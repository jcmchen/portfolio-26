import { analyzeEvidence, classifyThemeScores } from "./analysis/analyzeEvidence";
import { buildObservationFrame } from "./analysis/buildObservationFrame";
import { applyExplicitPlaceRelation } from "./analysis/extractPlaceRelations";
import {
  attachTopicContext,
  modelDocumentTopics,
  rerankThemeScoresWithTopics,
} from "./analysis/modelDocumentTopics";
import { normalizeEvidenceSources } from "./evidence/normalizeEvidence";
import { createQuestionGenerator } from "./generation";
import { generateEvidenceGroundedObservation } from "./generation/generateEvidenceGroundedObservation";
import { verifyTemplateObservation } from "./generation/verifyTemplateObservation";
import { isExcludedFieldNoteQuestion } from "./questionDiversity";
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

export type FieldNotePipelineOptions = {
  excludedQuestions?: string[];
};

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
  sources: RawEvidenceSource[],
  options: FieldNotePipelineOptions = {}
): Promise<CandidatePipelineResult> {
  const normalized = normalizeEvidenceSources(place, sources);
  const evidence = analyzeEvidence(place, normalized);
  const topics = modelDocumentTopics(place, evidence);
  const themeScores = rerankThemeScoresWithTopics(
    classifyThemeScores(evidence, place),
    topics
  );
  const evidenceValidation = validateEvidence(evidence);

  if (!evidenceValidation.valid) {
    return {
      ok: false,
      reason: evidenceValidation.reason,
      details: evidenceValidation.details,
      evidence,
      themeScores,
      topics,
    };
  }

  let retainedTemplate:
    | { generated: GeneratedFieldNote; frame: ObservationFrame }
    | undefined;
  let attemptedFrame: ObservationFrame | undefined;

  if (themeScores.length) {
    const builtFrame = buildObservationFrame(place, evidence, themeScores);
    const frame = builtFrame
      ? attachTopicContext(
          applyExplicitPlaceRelation(builtFrame, evidence),
          topics
        )
      : null;
    attemptedFrame = frame || undefined;
    if (frame) {
      const frameValidation = validateObservationFrame(frame);
      if (frameValidation.valid) {
        const generated = await createQuestionGenerator().generate(frame, {
          excludedQuestions: options.excludedQuestions,
        });
        if (generated) {
          const questionValidation = validateGeneratedQuestion(generated, frame);
          if (questionValidation.valid) {
            const verified = verifyTemplateObservation(generated, frame, evidence);
            if (
              verified &&
              !isExcludedFieldNoteQuestion(
                verified.generated.question,
                options.excludedQuestions
              )
            ) {
              if (!shouldPreferGenerativeFallback(verified.generated, verified.frame)) {
                return {
                  ok: true,
                  generated: verified.generated,
                  frame: verified.frame,
                  evidence,
                  themeScores,
                  topics,
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
    themeScores,
    topics
  );
  if (evidenceGrounded) {
    const frameValidation = validateObservationFrame(evidenceGrounded.frame);
    if (
      frameValidation.valid &&
      !isExcludedFieldNoteQuestion(
        evidenceGrounded.generated.question,
        options.excludedQuestions
      )
    ) {
      return {
        ok: true,
        generated: evidenceGrounded.generated,
        frame: evidenceGrounded.frame,
        evidence,
        themeScores,
        topics,
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
      topics,
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
    topics,
    frame: attemptedFrame,
  };
}
