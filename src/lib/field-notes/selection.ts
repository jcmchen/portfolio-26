import type { CandidateRejectionReason } from "./types";

export type CandidateEvaluation<T> =
  | { ok: true; value: T }
  | { ok: false; reason: CandidateRejectionReason; terminal?: boolean };

export async function selectFirstEvidenceBackedCandidate<C, T>(
  candidates: C[],
  evaluate: (candidate: C) => Promise<CandidateEvaluation<T>>
): Promise<
  | { ok: true; value: T; rejectedCount: number }
  | { ok: false; reason: CandidateRejectionReason; rejectedCount: number }
> {
  let lastReason: CandidateRejectionReason = "INSUFFICIENT_EVIDENCE";

  for (let index = 0; index < candidates.length; index += 1) {
    const result = await evaluate(candidates[index]);
    if (result.ok) return { ok: true, value: result.value, rejectedCount: index };
    lastReason = result.reason;
    if (result.terminal) {
      return { ok: false, reason: result.reason, rejectedCount: index + 1 };
    }
  }

  return { ok: false, reason: lastReason, rejectedCount: candidates.length };
}
