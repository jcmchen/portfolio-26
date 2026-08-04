import type { ObservationFrame, QuestionValidationResult } from "../types";

export function validateObservationFrame(frame: ObservationFrame): QuestionValidationResult {
  if (!frame.evidenceIds.length) return { valid: false, reason: "INSUFFICIENT_EVIDENCE" };
  if (!frame.observableClues.length) return { valid: false, reason: "NO_OBSERVABLE_CLUE" };
  if (frame.confidence < 0.68) {
    return {
      valid: false,
      reason: "NO_SUPPORTED_THEME",
      details: `Frame confidence ${frame.confidence} is below threshold.`,
    };
  }

  return { valid: true };
}
