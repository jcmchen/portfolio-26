import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeEvidence,
  classifyThemeScores,
  createFieldNoteFromEvidence,
  createQuestionGenerator,
  FIELD_NOTE_ROTATION_DAYS,
  candidateRotationSlot,
  dailyRotationSlot,
  fieldNoteQuestionsMatch,
  fieldNoteCachePolicy,
  generateEvidenceGroundedLLMObservation,
  modelDocumentTopics,
  normalizeEvidenceSources,
  normalizeEvidenceText,
  rerankThemeScoresWithTopics,
  selectFirstEvidenceBackedCandidate,
  validateGenerativeCandidate,
  type EvidencePlace,
  type RawEvidenceSource,
} from "../src/lib/field-notes";
import {
  fetchWikimediaJson,
  parseRetryAfterMs,
  WIKIMEDIA_USER_AGENT,
} from "../src/lib/field-notes/wikimediaClient";

test("Wikimedia client uses a compliant identity and parses Retry-After", () => {
  assert.match(WIKIMEDIA_USER_AGENT, /^DailyPlaceReading\/\d+\.\d+ \(https:\/\//);
  assert.equal(parseRetryAfterMs("7"), 7_000);
  assert.equal(
    parseRetryAfterMs(
      "Fri, 07 Aug 2026 20:00:05 GMT",
      Date.parse("2026-08-07T20:00:00Z")
    ),
    5_000
  );
});

test("Wikimedia client allows no more than three concurrent requests", async () => {
  let active = 0;
  let peak = 0;
  const seenUserAgents = new Set<string>();
  const fetchImpl: typeof fetch = async (_input, init) => {
    active += 1;
    peak = Math.max(peak, active);
    seenUserAgents.add(new Headers(init?.headers).get("user-agent") || "");
    await new Promise((resolve) => setTimeout(resolve, 15));
    active -= 1;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const results = await Promise.all(
    Array.from({ length: 7 }, (_, index) =>
      fetchWikimediaJson<{ ok: boolean }>(`https://example.test/${index}`, {
        fetchImpl,
        maxAttempts: 1,
      })
    )
  );

  assert.equal(peak, 3);
  assert.deepEqual([...seenUserAgents], [WIKIMEDIA_USER_AGENT]);
  assert.ok(results.every((result) => result.ok && result.data.ok));
});

test("daily rotation gives every page one preferred day and prevents consecutive repeats", () => {
  const pageId = 43_813_261;
  const cycleStart = new Date("2026-08-03T00:00:00.000Z");
  const preferredDays = Array.from({ length: FIELD_NOTE_ROTATION_DAYS }, (_, offset) => {
    const date = new Date(cycleStart.getTime() + offset * 86_400_000);
    return candidateRotationSlot(pageId) === dailyRotationSlot(date);
  });

  assert.equal(preferredDays.filter(Boolean).length, 1);
  for (let offset = 0; offset < FIELD_NOTE_ROTATION_DAYS; offset += 1) {
    const today = new Date(cycleStart.getTime() + offset * 86_400_000);
    const tomorrow = new Date(today.getTime() + 86_400_000);
    assert.notEqual(dailyRotationSlot(today), dailyRotationSlot(tomorrow));
  }
});

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

test("inline Chinese labels are removed without deleting surrounding spatial evidence", () => {
  const normalized = normalizeEvidenceText(
    "The market consists of Futing Night Market (Chinese: 福町夜市), a street of Taiwanese Indigenous cuisine (Chinese: 原住民一條街), and Ziqiang Night Market."
  );

  assert.doesNotMatch(normalized, /Chinese|福町|原住民/);
  assert.match(normalized, /street of Taiwanese Indigenous cuisine/i);
  assert.match(normalized, /Ziqiang Night Market/i);
});

test("document topic modeling separates environmental and public-use readings", () => {
  const currentPlace = place("Harbor Park");
  const evidence = analyzeEvidence(
    currentPlace,
    normalizeEvidenceSources(currentPlace, [
      source(
        "summary",
        "Harbor Park contains tidal marsh habitat beside a creek. " +
          "The marsh supports wildlife and native vegetation. " +
          "Walking paths cross the public grounds and connect several gardens. " +
          "The paths lead to sports fields and playgrounds used for recreation."
      ),
    ])
  );
  const topics = modelDocumentTopics(currentPlace, evidence);
  const keywords = topics.flatMap((topic) => topic.keywords);

  assert.ok(topics.length >= 2);
  assert.ok(keywords.some((keyword) => /marsh|habitat|wildlife|vegetation/i.test(keyword)));
  assert.ok(keywords.some((keyword) => /paths?|gardens?|fields?|playgrounds?/i.test(keyword)));
  assert.ok(topics.every((topic) => topic.weight > 0 && topic.evidenceIds.length > 0));
  assert.ok(topics.every((topic) => !topic.keywords.includes("harbor")));
});

test("topic support reinforces repeated article themes without inventing a new theme", () => {
  const currentPlace = place("Creekside Reserve");
  const evidence = analyzeEvidence(
    currentPlace,
    normalizeEvidenceSources(currentPlace, [
      source(
        "summary",
        "Creekside Reserve contains tidal marsh habitat. " +
          "The wetland supports wildlife habitat and native vegetation. " +
          "Marsh channels carry water through the reserve. " +
          "A stone wall marks one entrance."
      ),
    ])
  );
  const original = classifyThemeScores(evidence, currentPlace);
  const topics = modelDocumentTopics(currentPlace, evidence);
  const reranked = rerankThemeScoresWithTopics(original, topics);
  const originalThemes = new Set(original.map((score) => score.theme));

  assert.equal(reranked[0]?.theme, "ecology");
  assert.ok(reranked.every((score) => originalThemes.has(score.theme)));
  assert.ok(
    reranked.some((score) =>
      score.reasons.some((reason) => reason.startsWith("document topic support:"))
    )
  );
});

test("topic context reaches a verified question for a non-station place", async () => {
  const result = await createFieldNoteFromEvidence(place("Riverside Park"), [
    source(
      "summary",
      "Riverside Park contains two public gardens connected by a footbridge. " +
        "The gardens surround a creek and native wetland habitat. " +
        "Walking paths lead from the gardens to recreation fields."
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.topics.length > 0);
  assert.ok((result.frame.topicContext?.length || 0) > 0);
  assert.ok(
    result.frame.topicContext?.some((topic) =>
      result.generated.evidenceIds.some((id) => topic.evidenceIds.includes(id))
    )
  );
  assert.match(result.generated.question, /gardens|footbridge|creek|wetland|paths/i);
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

test("a wetland park produces an ecology reading from observable habitat clues", async () => {
  const result = await createFieldNoteFromEvidence(place("Zhongdu Wetlands Park"), [
    source(
      "summary",
      "Zhongdu Wetlands Park contains restored wetland habitat, native vegetation, and local wildlife."
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "ecology");
  assert.equal(result.frame.frameType, "ecology-reading");
  assert.match(result.generated.question, /wetland|vegetation|wildlife/i);
});

test("park paths and sports fields produce a public-space reading", async () => {
  const result = await createFieldNoteFromEvidence(place("Erlun Sports Park"), [
    source(
      "summary",
      "Erlun Sports Park is a public park with walking paths, sports fields, and playgrounds."
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "publicSpace");
  assert.equal(result.frame.frameType, "public-space-reading");
  assert.match(result.generated.question, /paths|sports fields|playgrounds/i);
});

test("terrain-only evidence produces a frame without inventing history", async () => {
  const result = await createFieldNoteFromEvidence(place("Sorich Park"), [
    source("summary", "Sorich Park extends across steep hills and exposed slopes."),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "terrain");
  assert.match(result.generated.question, /hills|slopes/i);
  assert.doesNotMatch(result.generated.question, /history|shoreline/i);
});

test("rock outcrops produce a geology-only reading", async () => {
  const result = await createFieldNoteFromEvidence(place("Simms Island"), [
    source("summary", "Simms Island contains exposed rock outcrops and geological layers."),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "geology");
  assert.equal(result.frame.frameType, "geology-reading");
  assert.match(result.generated.question, /geology|outcrops/i);
});

test("a confirmed station gets a neutral field prompt without invented layout details", async () => {
  const neutral = await createFieldNoteFromEvidence(place("Example metro station"), [
    source("summary", "Example Station is a station on the Orange Line."),
  ]);
  assert.equal(neutral.ok, true);
  if (!neutral.ok) return;
  assert.equal(neutral.frame.frameType, "station-layout");
  assert.match(neutral.generated.question, /station|arrivals|departures/i);
  assert.doesNotMatch(neutral.generated.question, /platform|underground|exit/i);

  const supported = await createFieldNoteFromEvidence(place("Example metro station"), [
    source(
      "summary",
      "Example Station is an underground station with an island platform and four station exits."
    ),
  ]);
  assert.equal(supported.ok, true);
  if (!supported.ok) return;
  assert.equal(supported.frame.frameType, "station-layout");
  assert.match(supported.generated.question, /platform|exits|underground/i);
});

test("station components retain current-place ownership across sentences", () => {
  const evidence = analyze("Paseo de San Antonio station", [
    source(
      "summary",
      "Paseo de San Antonio station is an at-grade light rail station. The station platforms run along 1st Street and 2nd Street. The two platforms are connected by a pedestrian plaza."
    ),
  ]);

  assert.equal(evidence.length, 3);
  assert.ok(evidence.every((item) => item.refersToCurrentPlace));
  assert.ok(
    evidence[1].detectedThemes.some((theme) => theme.theme === "transportation")
  );
  assert.ok(
    evidence[2].detectedThemes.some((theme) => theme.theme === "publicSpace")
  );
});

test("Hualien station uses its terminal and starting-line role", async () => {
  const result = await createFieldNoteFromEvidence(place("Hualien railway station"), [
    source(
      "summary",
      "Hualien is a railway station served by the Taiwan Railway. It is the terminal station of the North-link line and the starting station of the Taitung line."
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.generated.templateId, "station-line-role-reading");
  assert.match(result.generated.question, /line’s end/i);
  assert.match(result.generated.question, /beginning/i);
  assert.doesNotMatch(result.generated.question, /pace of movement/i);
});

test("Paseo station uses its split platforms and pedestrian plaza", async () => {
  const result = await createFieldNoteFromEvidence(
    place("Paseo de San Antonio station"),
    [
      source(
        "summary",
        "Paseo de San Antonio station is an at-grade light rail station. The northbound platform is alongside 1st Street and the southbound platform is alongside 2nd Street. The two platforms are connected by a pedestrian plaza."
      ),
    ]
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.generated.templateId, "explicit-spatial-relation");
  assert.match(result.generated.question, /platforms/i);
  assert.match(result.generated.question, /pedestrian plaza/i);
  assert.doesNotMatch(result.generated.question, /pace of movement/i);
});

test("Kaohsiung Main Station uses its underground transformation instead of a neutral threshold", async () => {
  const result = await createFieldNoteFromEvidence(place("Kaohsiung Main Station"), [
    source(
      "summary",
      "Kaohsiung Main Station is a railway and metro station served by Taiwan Railway and Kaohsiung Rapid Transit."
    ),
    source(
      "history",
      "The station at the current site was built between 1933 and 1941. The railway was later moved underground within Kaohsiung. A temporary station building was used until the underground station opened.",
      "History"
    ),
    source(
      "railway",
      "The TRA portion is a three-level underground railway station with two island platforms.",
      "TRA railway"
    ),
    source(
      "metro",
      "The rapid transit station is a two-level underground station with one entrance.",
      "Metro"
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.generated.templateId, "underground-station-transformation");
  assert.match(result.generated.question, /railway underground/i);
  assert.match(result.generated.question, /presence in the city/i);
  assert.doesNotMatch(result.generated.question, /street and (?:the )?station|pace of movement/i);
});

test("Stanford station uses its event-only service evidence", async () => {
  const result = await createFieldNoteFromEvidence(place("Stanford station"), [
    source(
      "summary",
      "Stanford station is a Caltrain station near the Stanford Stadium. " +
        "It is not a regular service stop; instead, it is only in service for football home games and other large events at the stadium. " +
        "The usual stop for the university is Palo Alto station. " +
        "The station does not have any ticket vending machines; when in use, staff use handheld Clipper card readers."
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.generated.templateId, "event-only-station-service");
  assert.equal(result.generated.operator, "use_behavior");
  assert.match(result.generated.question, /large events/i);
  assert.match(result.generated.question, /regular daily travel/i);
  assert.doesNotMatch(result.generated.question, /street and (?:the )?station|pace of movement/i);

  const paloAltoSentence = result.evidence.find((item) =>
    /usual stop.*Palo Alto station/i.test(item.normalizedText)
  );
  assert.equal(paloAltoSentence?.refersToCurrentPlace, false);
});

for (const example of [
  {
    placeName: "Riverside Park",
    text: "Riverside Park is a public park with several gardens. The two gardens are connected by a footbridge.",
    expected: /footbridge.*two gardens/i,
  },
  {
    placeName: "Harbor Market",
    text: "Harbor Market is a night market with food stalls. The market stalls are arranged around a central plaza.",
    expected: /central plaza.*market stalls/i,
  },
  {
    placeName: "Example Church",
    text: "Example Church is a Gothic church. The nave and courtyard are joined by a covered arcade.",
    expected: /covered arcade.*nave and courtyard/i,
  },
  {
    placeName: "Walled Garden",
    text: "Walled Garden is a public garden with two courtyards. The two courtyards are separated by a stone wall.",
    expected: /stone wall.*boundary.*two courtyards/i,
  },
]) {
  test(`explicit spatial relations generalize to ${example.placeName}`, async () => {
    const result = await createFieldNoteFromEvidence(place(example.placeName), [
      source("summary", example.text),
    ]);

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.generated.templateId, "explicit-spatial-relation");
    assert.match(result.generated.question, example.expected);
    assert.equal(result.generated.operator, "spatial_organization");
  });
}

test("components of a separately named nearby place do not inherit ownership", () => {
  const evidence = analyze("Example Park", [
    source(
      "summary",
      "Example Park is a public park. Stanford station has two platforms. The two platforms are connected by a pedestrian plaza."
    ),
  ]);

  assert.equal(evidence[0].refersToCurrentPlace, true);
  assert.equal(evidence[1].refersToCurrentPlace, false);
  assert.equal(evidence[2].refersToCurrentPlace, false);
});

test("neutral station paraphrases share one semantic duplicate key", async () => {
  const evidence = [
    source("summary", "Example metro station is a station on the Orange Line."),
  ];
  const first = await createFieldNoteFromEvidence(place("Example metro station"), evidence);
  assert.equal(first.ok, true);
  if (!first.ok) return;

  const second = await createFieldNoteFromEvidence(
    place("Example metro station"),
    evidence,
    { excludedQuestions: [first.generated.question] }
  );
  assert.equal(second.ok, false);
  assert.equal(
    fieldNoteQuestionsMatch(
      "Where does movement change between the street and the station?",
      "What changes as people move between the street and station?"
    ),
    true
  );
});

test("a confirmed park gets a neutral prompt when no layout feature is stated", async () => {
  const result = await createFieldNoteFromEvidence(place("Example Sports Park"), [
    source("summary", "Example Sports Park is a public sports park in the city."),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.frameType, "public-space-reading");
  assert.match(result.generated.question, /gather, pause, or move/i);
  assert.doesNotMatch(result.generated.question, /path|field|playground/i);
});

test("specific built features support an architectural reading", async () => {
  const result = await createFieldNoteFromEvidence(place("Example Memorial Church"), [
    source(
      "summary",
      "Example Memorial Church has a Gothic facade and a prominent bell tower."
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "architecture");
  assert.match(result.generated.question, /Gothic|bell tower|facade/i);
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

test("Sanfong summary and history form a comparison instead of showing a vanished river", async () => {
  const result = await createFieldNoteFromEvidence(place("Sanfong Central Street"), [
    source(
      "summary",
      "Sanfong Central Street is a traditional shopping area selling grocery goods and the largest grocery goods wholesale center in Kaohsiung."
    ),
    source(
      "history",
      "Around a century ago, there was a river by the street through which local merchants imported foreign goods.",
      "History"
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.match(result.generated.question, /wholesale/i);
  assert.match(result.generated.question, /river-trade past/i);
  assert.doesNotMatch(result.generated.question, /river most clearly visible/i);
  assert.ok(result.generated.operator);
});

test("a night market can form a commercial reading without goods movement", async () => {
  const result = await createFieldNoteFromEvidence(place("Liouhe Night Market"), [
    source(
      "summary",
      "The Liouhe Night Market is a tourist night market in Kaohsiung where seafood, handicrafts, clothing, and other goods are sold."
    ),
    source(
      "history",
      "In the 1950s, many food stalls in the area were collectively known as Dagangpu Night Market. Since then, the night market developed into a large-scale market. The market later began selling halal foods at its stalls.",
      "History"
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "commerce");
  assert.equal(result.frame.frameType, "commercial-reading");
  assert.match(result.generated.question, /halal food/i);
  assert.match(result.generated.question, /mix of stalls/i);
  assert.ok(result.generated.question.split(/\s+/).length <= 24);
});

test("Dongdamen replaces the generic market fallback with a grounded historical observation", async () => {
  const previousMode = process.env.FIELD_NOTE_GENERATOR;
  process.env.FIELD_NOTE_GENERATOR = "operator";
  try {
    const result = await createFieldNoteFromEvidence(place("Dongdamen Night Market"), [
      source(
        "summary",
        "Dongdamen Night Market is the largest night market in Hualien County."
      ),
      source(
        "architecture",
        "The market features a center plaza, an ecology pond, and a lookout tower.",
        "Architecture"
      ),
      source(
        "history",
        "The area where the night market stands today used to be the area of the old train station.",
        "History"
      ),
    ]);

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.generated.generator, "operator");
    assert.equal(result.frame.frameType, "evidence-grounded-observation");
    assert.match(result.generated.question, /old train station/i);
    assert.doesNotMatch(result.generated.question, /mix of stalls|market's role/i);
  } finally {
    if (previousMode === undefined) delete process.env.FIELD_NOTE_GENERATOR;
    else process.env.FIELD_NOTE_GENERATOR = previousMode;
  }
});

test("universal operators can produce a grounded reading without a supported theme", async () => {
  const previousMode = process.env.FIELD_NOTE_GENERATOR;
  process.env.FIELD_NOTE_GENERATOR = "operator";
  try {
    const result = await createFieldNoteFromEvidence(place("Example Grounds"), [
      source(
        "history",
        "The area where Example Grounds stands today used to be the area of an old orchard.",
        "History"
      ),
    ]);

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.frame.primaryTheme, "placeReading");
    assert.match(result.generated.question, /old orchard/i);
  } finally {
    if (previousMode === undefined) delete process.env.FIELD_NOTE_GENERATOR;
    else process.env.FIELD_NOTE_GENERATOR = previousMode;
  }
});

test("generative validation rejects missing citations and unsupported presuppositions", () => {
  const atoms = [
    {
      evidenceId: "history-1",
      text: "The site used to be the area of the old train station.",
      relevance: 8,
      operators: [{ operator: "historical_trace" as const, score: 3 }],
      observableClues: ["the old train station"],
    },
  ];

  const missingCitation = validateGenerativeCandidate(
    {
      question: "Is the old train station still legible in today’s layout?",
      operator: "historical_trace",
      evidenceIds: ["missing"],
      presuppositions: ["The site used to be the old train station."],
      observableClues: ["the old train station"],
    },
    atoms
  );
  assert.equal(missingCitation.valid, false);

  const hallucination = validateGenerativeCandidate(
    {
      question: "Where is the demolished stone tower still visible in today’s layout?",
      operator: "historical_trace",
      evidenceIds: ["history-1"],
      presuppositions: ["A stone tower was demolished at the site."],
      observableClues: ["the stone tower"],
    },
    atoms
  );
  assert.equal(hallucination.valid, false);
});

test("structured LLM output is revalidated before selection", async () => {
  const atoms = [
    {
      evidenceId: "history-1",
      text: "The site used to be the area of the old train station.",
      relevance: 8,
      operators: [{ operator: "historical_trace" as const, score: 3 }],
      observableClues: ["the old train station"],
    },
  ];
  let requestBody: Record<string, unknown> | undefined;
  const fetchImpl = (async (_input: string | URL | Request, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        output_text: JSON.stringify({
          candidates: [
            {
              question: "What makes this place unique?",
              operator: "historical_trace",
              evidenceIds: ["history-1"],
              presuppositions: ["The site used to be the old train station."],
              observableClues: ["the old train station"],
            },
            {
              question: "Where is the unsupported brick tower visible in today’s layout?",
              operator: "material_expression",
              evidenceIds: ["history-1"],
              presuppositions: ["The site contains a brick tower."],
              observableClues: ["the brick tower"],
            },
            {
              question: "Is the old train station still legible in today’s layout?",
              operator: "historical_trace",
              evidenceIds: ["history-1"],
              presuppositions: ["The site used to be the old train station."],
              observableClues: ["the old train station"],
            },
          ],
        }),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  const result = await generateEvidenceGroundedLLMObservation(
    place("Example Grounds"),
    atoms,
    { apiKey: "test-key", model: "test-model", fetchImpl }
  );

  assert.ok(result);
  assert.match(result.candidate.question, /old train station/i);
  assert.equal(
    (requestBody?.text as { format?: { type?: string } })?.format?.type,
    "json_schema"
  );
});

test("mentioning a nearby market does not turn a river into a market", async () => {
  const result = await createFieldNoteFromEvidence(place("Love River"), [
    source(
      "summary",
      "Love River is a river in Kaohsiung that flows through the city. A night market operates near Love River and sells food from many stalls."
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "water");
  assert.doesNotMatch(result.generated.question, /market|stalls/i);
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

test("a former museum produces an evidence-backed institutional transition", async () => {
  const result = await createFieldNoteFromEvidence(place("Chung Cheng Aviation Museum"), [
    source(
      "summary",
      "The Chung Cheng Aviation Museum was an aviation museum located at Taiwan Taoyuan International Airport. The museum closed in 2014 to allow construction of Terminal 3. Items displayed at the museum were sent to storage and all 18 aircraft on display were relocated. The museum was located between the main freeway entrance and the airport terminals."
    ),
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.frame.primaryTheme, "institutionalChange");
  assert.equal(result.frame.frameType, "institutional-transition");
  assert.match(result.generated.question, /former aviation museum/i);
  assert.match(result.generated.question, /aircraft were relocated/i);
  assert.doesNotMatch(result.generated.question, /movement is organized/i);
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
  assert.ok(
    result.frame.primaryTheme === "mining" ||
      result.frame.secondaryThemes.includes("mining")
  );
  assert.match(result.generated.question, /mercury|mining/i);
  assert.match(result.generated.question, /hills|slopes|ground/i);
  assert.doesNotMatch(result.generated.question, /shoreline|coastline/i);
});

test("Port of Hualien replaces unsupported visible-history wording with a verified comparison", async () => {
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
  assert.match(result.generated.question, /cargo/i);
  assert.match(result.generated.question, /compare|earlier/i);
  assert.doesNotMatch(result.generated.question, /still reveal|still visible/i);
  assert.equal(result.generated.generator, "operator");
  assert.ok(result.generated.operator);
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
  assert.equal(result.generated.generator, "template");
  assert.equal(result.generated.operator, "historical_trace");
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
  assert.match(result.generated.question, /foothill|river channel/i);
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
