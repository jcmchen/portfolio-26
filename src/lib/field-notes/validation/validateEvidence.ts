import type { EvidenceItem, QuestionValidationResult } from "../types";

export function validateEvidence(evidence: EvidenceItem[]): QuestionValidationResult {
  if (!evidence.length) return { valid: false, reason: "INSUFFICIENT_EVIDENCE" };

  const owned = evidence.filter((item) => item.refersToCurrentPlace);
  if (!owned.length) return { valid: false, reason: "NO_CURRENT_PLACE_EVIDENCE" };

  return { valid: true };
}
