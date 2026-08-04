import { analyzeEvidence, classifyThemeScores } from "./analysis/analyzeEvidence";
import { buildObservationFrame } from "./analysis/buildObservationFrame";
import { normalizeEvidenceSources } from "./evidence/normalizeEvidence";
import { createQuestionGenerator } from "./generation";
import type {
  CandidatePipelineResult,
  EvidencePlace,
  RawEvidenceSource,
} from "./types";
import { validateEvidence } from "./validation/validateEvidence";
import { validateGeneratedQuestion } from "./validation/validateGeneratedQuestion";
import { validateObservationFrame } from "./validation/validateObservationFrame";

export async function createFieldNoteFromEvidence(
  place: EvidencePlace,
  sources: RawEvidenceSource[]
): Promise<CandidatePipelineResult> {
  const normalized = normalizeEvidenceSources(place, sources);
  const evidence = analyzeEvidence(place, normalized);
  const themeScores = classifyThemeScores(evidence);
  const evidenceValidation = validateEvidence(evidence);

  if (!evidenceValidation.valid) {
    return {
      ok: false,
      reason: evidenceValidation.reason,
      details: evidenceValidation.details,
      evidence,
      themeScores,
    };
  }

  const frame = buildObservationFrame(place, evidence, themeScores);
  if (!frame) {
    return {
      ok: false,
      reason: "NO_APPLICABLE_TEMPLATE",
      evidence,
      themeScores,
    };
  }

  const frameValidation = validateObservationFrame(frame);
  if (!frameValidation.valid) {
    return {
      ok: false,
      reason: frameValidation.reason,
      details: frameValidation.details,
      evidence,
      themeScores,
      frame,
    };
  }

  const generator = createQuestionGenerator();
  const generated = await generator.generate(frame);
  if (!generated) {
    return {
      ok: false,
      reason: "NO_APPLICABLE_TEMPLATE",
      evidence,
      themeScores,
      frame,
    };
  }

  const questionValidation = validateGeneratedQuestion(generated, frame);
  if (!questionValidation.valid) {
    return {
      ok: false,
      reason: questionValidation.reason,
      details: questionValidation.details,
      evidence,
      themeScores,
      frame,
    };
  }

  return { ok: true, generated, frame, evidence, themeScores };
}
