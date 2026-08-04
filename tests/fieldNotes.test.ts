import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeEvidence,
  classifyThemeScores,
  createFieldNoteFromEvidence,
  createQuestionGenerator,
  fieldNoteCachePolicy,
  normalizeEvidenceSources,
  normalizeEvidenceText,
  selectFirstEvidenceBackedCandidate,
  type EvidencePlace,
  type RawEvidenceSource,
} from "../src/lib/field-notes";

function place(placeName: string): EvidencePlace {
  return {
    placeId: placeName.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-"),
    pageId: 1,
    placeName,
  };
}

function source(
  id: string,
  text: string,
  sectionTitle?: string
): RawEvidenceSource {
  return {
    id,
    source: sectionTitle ? "wikipedia-section" : "wikipedia-summary",
    label: sectionTitle || "summary",
    text,
    sectionTitle,
  };
}

function analyze(placeName: string, sources: RawEvidenceSource[]) {
  const currentPlace = place(placeName);
  return analyzeEvidence(
    currentPlace,
    normalizeEvidenceSources(currentPlace, sources)
  );
}

test("traditional Chinese metadata is removed and cannot create a history theme", () => {
  const normalized = normalizeEvidenceText(
    "Maolin National Scenic Area (traditional Chinese: 茂林國家風景區; pinyin: Màolín) is in Taiwan."
  );
  assert.doesNotMatch(normalized, /traditional Chinese|pinyin/i);

  const evidence = analyze("Maolin National Scenic Area", [source("summary", normalized)]);
  assert.equal(evidence.flatMap((item) => item.detectedThemes).length, 0);
});

test("Coast Range supports terrain and geology, never shoreline", () => {
  const evidence = analyze("New Almaden", [
    source(
      "geology",
      "The mineralized area around New Almaden lies within the Franciscan Assemblage of the Coast Range.",
      "Geology"
    ),
  ]);
  const themes = classifyThemeScores(evidence).map((item) => item.theme);
  assert.ok(themes.includes("terrain"));
  assert.ok(themes.includes("geology"));
  assert.ok(!themes.includes("water"));
});

test("John Marsh is a person and his stone house is not current-place evidence", () => {
  const evidence = analyze("Camron-Stanford House", [
    source("history", "John Marsh built a stone house elsewhere.", "History"),
  ]);
  assert.equal(evidence[0].subjectEntityType, "person");
  assert.equal(evidence[0].refersToCurrentPlace, false);
  assert.ok(!evidence[0].detectedThemes.some((item) => item.theme === "material"));
  assert.ok(!evidence[0].detectedThemes.some((item) => item.theme === "ecology"));
});

test("lowercase salt marsh habitat remains valid ecology evidence", () => {
  const evidence = analyze("Baylands Nature Preserve", [
    source("summary", "Baylands Nature Preserve contains extensive salt marsh habitat."),
  ]);
  assert.ok(
    evidence[0].detectedThemes.some(
      (item) => item.theme === "ecology" && item.score >= 3
    )
  );
});

test("ownership accepts current place and rejects another person's property", () => {
  const evidence = analyze("Camron-Stanford House", [
    source(
      "history",
      "Camron-Stanford House became Oakland's first museum in 1907. John Marsh built a stone house elsewhere.",
      "History"
    ),
  ]);
  assert.equal(evidence[0].refersToCurrentPlace, true);
  assert.equal(evidence[1].refersToCurrentPlace, false);
});

test("Sanfong evidence produces a commerce and river-goods question without climate", async () => {
  const result = await createFieldNoteFromEvidence(place("Sanfong Central Street"), [
    source(
      "summary",
      "Sanfong Central Street is a traditional shopping area and the largest grocery goods wholesale center in Kaohsiung."
    ),
    source(
      "history",
      "Around a century ago, a river ran beside the street and merchants imported foreign goods through it. The area later changed from sundry goods and agricultural produce to food and Lunar New Year wholesale.",
      "History"
    ),
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "commerce");
  assert.ok(result.frame.secondaryThemes.includes("goodsMovement"));
  assert.match(result.generated.question, /wholesale/i);
  assert.match(result.generated.question, /river/i);
  assert.doesNotMatch(result.generated.question, /climate/i);
  assert.ok(result.generated.evidenceIds.length > 0);
});

test("Camron-Stanford evidence produces a preserved private-to-public reading", async () => {
  const result = await createFieldNoteFromEvidence(place("Camron-Stanford House"), [
    source(
      "summary",
      "Camron-Stanford House is the only surviving nineteenth-century Victorian mansion that once surrounded Lake Merritt. It became Oakland's first museum in 1907."
    ),
    source(
      "history",
      "In 1907, the city purchased Camron-Stanford House and the surrounding residences. The city razed the other homes and created Lakeside Park. Public interest saved the house as an independent museum.",
      "History"
    ),
    source(
      "other-person",
      "John Marsh built a stone house elsewhere near Marsh Creek State Park.",
      "History"
    ),
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "preservation");
  assert.match(result.generated.question, /surviving|preserved/i);
  assert.match(result.generated.question, /mansion|park/i);
  assert.doesNotMatch(result.generated.question, /wetland|stone/i);
});

test("New Almaden produces mining and terrain, not shoreline", async () => {
  const result = await createFieldNoteFromEvidence(place("New Almaden"), [
    source(
      "summary",
      "New Almaden is a historic community and former mercury mine in the Capitancillos Hills. Cinnabar was used before the mining settlement expanded."
    ),
    source(
      "geology",
      "The mineralized area around New Almaden lies within the Franciscan Assemblage of the Coast Range and contains mercury ore deposits.",
      "Geology"
    ),
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "mining");
  assert.match(result.generated.question, /mercury|mining/i);
  assert.match(result.generated.question, /hills|slopes|ground/i);
  assert.doesNotMatch(result.generated.question, /shoreline|coastline/i);
});

test("Port of Hualien keeps an evidence-backed goods-movement reading", async () => {
  const result = await createFieldNoteFromEvidence(place("Port of Hualien"), [
    source(
      "summary",
      "The Port of Hualien is an international port with an artificial harbor, breakwaters, and 25 wharves."
    ),
    source(
      "history",
      "The Port of Hualien was constructed during Japanese rule for carrying local granulated sugar and transporting island-round cargo.",
      "History"
    ),
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "goodsMovement");
  assert.match(result.generated.question, /sugar|cargo/i);
  assert.match(result.generated.question, /Port of Hualien/i);
});

test("Carquinez Bridge keeps a specific multi-span historical reading", async () => {
  const result = await createFieldNoteFromEvidence(place("Carquinez Bridge"), [
    source(
      "summary",
      "The Carquinez Bridge is a pair of parallel cantilever and suspension bridges carrying Interstate 80."
    ),
    source(
      "history",
      "The Carquinez Bridge originally referred to a cantilever bridge built in 1927. A second parallel bridge was completed in 1958 for increased traffic, and a replacement span opened in 2003.",
      "History and description"
    ),
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "transportation");
  assert.match(result.generated.question, /parallel|span/i);
});

test("Maolin terrain reading is based on foothills and rivers, not language metadata", async () => {
  const result = await createFieldNoteFromEvidence(place("Maolin National Scenic Area"), [
    source(
      "summary",
      "Maolin National Scenic Area (traditional Chinese: 茂林國家風景區; pinyin: Màolín) is in southern Taiwan."
    ),
    source(
      "geology",
      "The scenic area lies on the western foothills of the Central Mountain Range and covers three rivers.",
      "Geology"
    ),
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "terrain");
  assert.match(result.generated.question, /foothills|river courses/i);
  assert.doesNotMatch(result.generated.question, /history|traditional/i);
});

test("empty evidence produces no natural-language question", async () => {
  const result = await createFieldNoteFromEvidence(place("Unavailable Place"), []);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "INSUFFICIENT_EVIDENCE");
  assert.ok(!("generated" in result));
});

test("failed candidate is skipped when the next candidate succeeds", async () => {
  const result = await selectFirstEvidenceBackedCandidate(["bad", "good"], async (candidate) =>
    candidate === "good"
      ? { ok: true, value: "accepted" }
      : { ok: false, reason: "INSUFFICIENT_EVIDENCE" }
  );
  assert.equal(result.ok, true);
  assert.equal(result.rejectedCount, 1);
  if (result.ok) assert.equal(result.value, "accepted");
});

test("a generic-question rejection advances to the next candidate", async () => {
  const attempted: string[] = [];
  const result = await selectFirstEvidenceBackedCandidate(
    ["generic", "specific"],
    async (candidate) => {
      attempted.push(candidate);
      return candidate === "specific"
        ? { ok: true, value: "evidence-backed" }
        : { ok: false, reason: "QUESTION_TOO_GENERIC" };
    }
  );

  assert.deepEqual(attempted, ["generic", "specific"]);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value, "evidence-backed");
});

test("failed responses use short cache while success remains daily", () => {
  const failed = fieldNoteCachePolicy("temporary-unavailable", 40_000, 600);
  assert.equal(failed.httpStatus, 503);
  assert.equal(failed.maxAge, 600);
  assert.match(failed.cacheControl, /s-maxage=600/);
  assert.doesNotMatch(failed.cacheControl, /stale-while-revalidate/);

  const success = fieldNoteCachePolicy("success", 40_000, 600);
  assert.equal(success.httpStatus, 200);
  assert.equal(success.maxAge, 40_000);
  assert.match(success.cacheControl, /stale-while-revalidate/);
});

test("question generator defaults to template and no LLM call is made", () => {
  const previous = process.env.FIELD_NOTE_GENERATOR;
  delete process.env.FIELD_NOTE_GENERATOR;
  try {
    assert.equal(createQuestionGenerator().constructor.name, "TemplateQuestionGenerator");
  } finally {
    if (previous === undefined) delete process.env.FIELD_NOTE_GENERATOR;
    else process.env.FIELD_NOTE_GENERATOR = previous;
  }
});
