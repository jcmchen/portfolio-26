import type { FieldNoteQuestionGenerator } from "./QuestionGenerator";
import { TemplateQuestionGenerator } from "./TemplateQuestionGenerator";

export type { FieldNoteQuestionGenerator } from "./QuestionGenerator";

export function createQuestionGenerator(): FieldNoteQuestionGenerator {
  const mode = process.env.FIELD_NOTE_GENERATOR ?? "hybrid";

  if (["template", "operator", "hybrid", "llm"].includes(mode)) {
    return new TemplateQuestionGenerator();
  }

  throw new Error(`Unsupported FIELD_NOTE_GENERATOR: ${mode}`);
}
