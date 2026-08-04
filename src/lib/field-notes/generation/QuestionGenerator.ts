import type { GeneratedFieldNote, ObservationFrame } from "../types";

export interface FieldNoteQuestionGenerator {
  generate(frame: ObservationFrame): Promise<GeneratedFieldNote | null>;
}
