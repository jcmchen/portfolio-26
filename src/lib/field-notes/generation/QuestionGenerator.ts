import type { GeneratedFieldNote, ObservationFrame } from "../types";

export type QuestionGenerationOptions = {
  excludedQuestions?: string[];
};

export interface FieldNoteQuestionGenerator {
  generate(
    frame: ObservationFrame,
    options?: QuestionGenerationOptions
  ): Promise<GeneratedFieldNote | null>;
}
