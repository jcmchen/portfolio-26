export function normalizeFieldNoteQuestion(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NEUTRAL_STATION_QUESTIONS = [
  "where does movement change between the street and the station",
  "how does entering the station change the pace of movement",
  "where do arrivals and departures become most visible at the station",
  "what changes as people move between the street and station",
];

function semanticQuestionKey(value: string) {
  const normalized = normalizeFieldNoteQuestion(value);
  return NEUTRAL_STATION_QUESTIONS.includes(normalized)
    ? "neutral-station-threshold"
    : normalized;
}

export function fieldNoteQuestionsMatch(first: string, second: string) {
  return semanticQuestionKey(first) === semanticQuestionKey(second);
}

export function isExcludedFieldNoteQuestion(
  question: string,
  excludedQuestions: string[] = []
) {
  return excludedQuestions.some((excluded) =>
    fieldNoteQuestionsMatch(question, excluded)
  );
}
