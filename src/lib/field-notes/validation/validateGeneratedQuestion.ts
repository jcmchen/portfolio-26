import type {
  GeneratedFieldNote,
  ObservationFrame,
  ObservationTheme,
  QuestionValidationResult,
} from "../types";

const OLD_FALLBACKS = [
  "how has climate shaped the way this place is used and changed",
  "how has the landscape shaped the way people move through this place",
];

const QUESTION_CONCEPTS: Array<{ pattern: RegExp; themes: ObservationTheme[] }> = [
  { pattern: /\b(?:climate|rainfall|humidity|monsoon)\b/i, themes: [] },
  { pattern: /\b(?:shoreline|coastline|tidal|beach)\b/i, themes: ["water"] },
  { pattern: /\b(?:wetland|marsh habitat|wetland ecology)\b/i, themes: ["ecology"] },
  { pattern: /\b(?:habitat|wildlife|native vegetation|flora|fauna)\b/i, themes: ["ecology"] },
  { pattern: /\b(?:stonework|brick|concrete|timber|masonry)\b/i, themes: ["material"] },
  { pattern: /\b(?:geology|geological|outcrops?|quarry face|ore deposits?)\b/i, themes: ["geology"] },
  { pattern: /\b(?:mine|mining|mercury|cinnabar|quicksilver)\b/i, themes: ["mining", "geology", "industry"] },
  { pattern: /\b(?:wholesale|commercial|trade|markets?|shops?|stalls?)\b/i, themes: ["commerce"] },
  { pattern: /\b(?:cargo|goods|distribution)\b/i, themes: ["goodsMovement"] },
  { pattern: /\b(?:mansion|residence|residential)\b/i, themes: ["residentialHistory"] },
  { pattern: /\b(?:museum)\b/i, themes: ["museumConversion", "adaptiveReuse", "institutionalChange"] },
  { pattern: /\b(?:preserved|surviving|remaining)\b/i, themes: ["preservation"] },
  { pattern: /\b(?:park|public grounds)\b/i, themes: ["publicSpace"] },
  { pattern: /\b(?:bridge|port|railway|railroad|route|traffic|station|platforms?|tracks?|airport)\b/i, themes: ["transportation"] },
  { pattern: /\b(?:hills?|foothills?|valley|slopes?|terrain|mountain range)\b/i, themes: ["terrain"] },
];

function normalizeQuestion(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function frameHasSpecificContent(frame: ObservationFrame, question: string) {
  const supportedPhrases = [
    frame.pastState,
    frame.presentState,
    frame.visibleFeature,
    frame.historicalChange,
    ...frame.observableClues,
  ].filter((value): value is string => Boolean(value));

  const questionWords = new Set(normalizeQuestion(question).split(" "));
  return supportedPhrases.some((phrase) => {
    const significantWords = normalizeQuestion(phrase)
      .split(" ")
      .filter((word) => word.length >= 5 && !["about", "their", "where", "place"].includes(word));
    return significantWords.some((word) => questionWords.has(word));
  });
}

export function validateGeneratedQuestion(
  generated: GeneratedFieldNote,
  frame: ObservationFrame
): QuestionValidationResult {
  if (!generated.evidenceIds.length) {
    return { valid: false, reason: "INSUFFICIENT_EVIDENCE", details: "Question has no evidence IDs." };
  }

  if (generated.evidenceIds.some((id) => !frame.evidenceIds.includes(id))) {
    return { valid: false, reason: "UNSUPPORTED_CONCEPT", details: "Question references evidence outside its frame." };
  }

  if (!generated.observableClues.length) {
    return { valid: false, reason: "NO_OBSERVABLE_CLUE" };
  }

  const normalized = normalizeQuestion(generated.question);
  if (OLD_FALLBACKS.includes(normalized)) {
    return { valid: false, reason: "QUESTION_TOO_GENERIC", details: "Matches a removed regional fallback." };
  }

  const disallowed = frame.disallowedConcepts.find((concept) =>
    normalized.includes(normalizeQuestion(concept))
  );
  if (disallowed) {
    return { valid: false, reason: "UNSUPPORTED_CONCEPT", details: `Question contains disallowed concept: ${disallowed}.` };
  }

  const supportedThemes = new Set([frame.primaryTheme, ...frame.secondaryThemes]);
  const conceptualText = generated.question.replace(
    new RegExp(escapeRegExp(frame.placeName), "gi"),
    ""
  );
  for (const concept of QUESTION_CONCEPTS) {
    if (!concept.pattern.test(conceptualText)) continue;
    if (!concept.themes.length || !concept.themes.some((theme) => supportedThemes.has(theme))) {
      return {
        valid: false,
        reason: "UNSUPPORTED_CONCEPT",
        details: `Question introduces unsupported concept matching ${concept.pattern.source}.`,
      };
    }
  }

  if (!frameHasSpecificContent(frame, generated.question)) {
    return {
      valid: false,
      reason: "QUESTION_TOO_GENERIC",
      details: "Question contains no supported role, transition, feature, or observable clue.",
    };
  }

  const words = generated.question.trim().split(/\s+/).length;
  if (words < 8 || words > 24 || !generated.question.endsWith("?")) {
    return {
      valid: false,
      reason: "QUESTION_TOO_GENERIC",
      details: "Question length or punctuation is outside the accepted range.",
    };
  }

  return { valid: true };
}
