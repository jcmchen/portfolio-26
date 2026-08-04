import { LLMQuestionGenerator } from "./LLMQuestionGenerator";
import type { FieldNoteQuestionGenerator } from "./QuestionGenerator";
import { TemplateQuestionGenerator } from "./TemplateQuestionGenerator";

export type { FieldNoteQuestionGenerator } from "./QuestionGenerator";

export function createQuestionGenerator(): FieldNoteQuestionGenerator {
  const mode = process.env.FIELD_NOTE_GENERATOR ?? "template";

  if (mode === "template") return new TemplateQuestionGenerator();
  if (mode === "llm") return new LLMQuestionGenerator();

  throw new Error(`Unsupported FIELD_NOTE_GENERATOR: ${mode}`);
}
