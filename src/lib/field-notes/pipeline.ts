import { analyzeEvidence, classifyThemeScores } from "./analysis/analyzeEvidence";
import { buildObservationFrame } from "./analysis/buildObservationFrame";
import { normalizeEvidenceSources } from "./evidence/normalizeEvidence";
import { createQuestionGenerator } from "./generation";
import { generateEvidenceGroundedObservation } from "./generation/generateEvidenceGroundedObservation";
import { verifyTemplateObservation } from "./generation/verifyTemplateObservation";
import type {
  CandidatePipelineResult,
  EvidencePlace,
  GeneratedFieldNote,
  ObservationFrame,
  RawEvidenceSource,
} from "./types";
import { validateEvidence } from "./validation/validateEvidence";
import { validateGeneratedQuestion } from "./validation/validateGeneratedQuestion";
import { validateObservationFrame } from "./validation/validateObservationFrame";

function shouldPreferGenerativeFallback(
  generated: GeneratedFieldNote,
  frame: ObservationFrame
) {
  return (
    generated.templateId === "market-mix-reading" ||
    (generated.templateId === "station-layout-reading" &&
      frame.observableClues.includes("movement at the station threshold"))
  );
}

export async function createFieldNoteFromEvidence(
  place: EvidencePlace,
  sources: RawEvidenceSource[]
): Promise<CandidatePipelineResult> {
  const normalized = normalizeEvidenceSources(place, sources);
  const evidence = analyzeEvidence(place, normalized);
  const themeScores = classifyThemeScores(evidence, place);
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

  let retainedTemplate:
    | { generated: GeneratedFieldNote; frame: ObservationFrame }
    | undefined;
  let attemptedFrame: ObservationFrame | undefined;

  if (themeScores.length) {
    const frame = buildObservationFrame(place, evidence, themeScores);
    attemptedFrame = frame || undefined;
    if (frame) {
      const frameValidation = validateObservationFrame(frame);
      if (frameValidation.valid) {
        const generated = await createQuestionGenerator().generate(frame);
        if (generated) {
          const questionValidation = validateGeneratedQuestion(generated, frame);
          if (questionValidation.valid) {
            const verified = verifyTemplateObservation(generated, frame, evidence);
            if (verified) {
              if (!shouldPreferGenerativeFallback(verified.generated, verified.frame)) {
                return {
                  ok: true,
                  generated: verified.generated,
                  frame: verified.frame,
                  evidence,
                  themeScores,
                };
              }
              retainedTemplate = {
                generated: verified.generated,
                frame: verified.frame,
              };
            }
          }
        }
      }
    }
  }

  const evidenceGrounded = await generateEvidenceGroundedObservation(
    place,
    evidence,
    themeScores
  );
  if (evidenceGrounded) {
    const frameValidation = validateObservationFrame(evidenceGrounded.frame);
    if (frameValidation.valid) {
      return {
        ok: true,
        generated: evidenceGrounded.generated,
        frame: evidenceGrounded.frame,
        evidence,
        themeScores,
      };
    }
  }

  if (retainedTemplate) {
    return {
      ok: true,
      generated: retainedTemplate.generated,
      frame: retainedTemplate.frame,
      evidence,
      themeScores,
    };
  }

  return {
    ok: false,
    reason: themeScores.length ? "NO_APPLICABLE_TEMPLATE" : "NO_SUPPORTED_THEME",
    details: themeScores.length
      ? "No template or evidence-grounded observation passed validation."
      : "No supported theme or evidence-grounded observation was available.",
    evidence,
    themeScores,
    frame: attemptedFrame,
  };
}
