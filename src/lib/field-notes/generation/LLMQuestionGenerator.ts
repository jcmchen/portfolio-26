import type { GeneratedFieldNote, ObservationFrame } from "../types";
import type { FieldNoteQuestionGenerator } from "./QuestionGenerator";

export class LLMQuestionGenerator implements FieldNoteQuestionGenerator {
  async generate(_frame: ObservationFrame): Promise<GeneratedFieldNote | null> {
    throw new Error("LLM generation is not enabled");
  }
}
