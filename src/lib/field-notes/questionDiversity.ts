export function normalizeFieldNoteQuestion(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function fieldNoteQuestionsMatch(first: string, second: string) {
  return normalizeFieldNoteQuestion(first) === normalizeFieldNoteQuestion(second);
}

export function isExcludedFieldNoteQuestion(
  question: string,
  excludedQuestions: string[] = []
) {
  return excludedQuestions.some((excluded) =>
    fieldNoteQuestionsMatch(question, excluded)
  );
}
