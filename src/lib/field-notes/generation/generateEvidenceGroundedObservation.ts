import { selectAtomicEvidence } from "../analysis/selectAtomicEvidence";
import type {
  CandidatePipelineSuccess,
  DocumentTopic,
  EvidenceItem,
  EvidencePlace,
  GeneratedFieldNote,
  ObservationFrame,
  ThemeScore,
} from "../types";
import { generateEvidenceGroundedLLMObservation } from "./EvidenceGroundedLLMGenerator";
import { generateUniversalOperatorObservation } from "./UniversalOperatorGenerator";

export async function generateEvidenceGroundedObservation(
  place: EvidencePlace,
  evidence: EvidenceItem[],
  themeScores: ThemeScore[],
  topics: DocumentTopic[] = []
): Promise<Pick<CandidatePipelineSuccess, "generated" | "frame"> | null> {
  const atoms = selectAtomicEvidence(evidence, 6, topics);
  if (!atoms.length) return null;

  const mode = process.env.FIELD_NOTE_GENERATOR ?? "hybrid";
  const llmResult =
    mode === "template" || mode === "operator"
      ? null
      : await generateEvidenceGroundedLLMObservation(place, atoms, { topics });
  const selected =
    llmResult || generateUniversalOperatorObservation(place, atoms, topics);
  if (!selected) return null;

  const generator = llmResult ? "llm" : "operator";
  const primaryTheme = themeScores[0]?.theme || "placeReading";
  const secondaryThemes = themeScores
    .slice(primaryTheme === "placeReading" ? 0 : 1, 4)
    .map((score) => score.theme);
  const confidence = Number(
    Math.min(0.96, 0.68 + selected.validation.score * 0.27).toFixed(2)
  );
  const generated: GeneratedFieldNote = {
    question: selected.candidate.question,
    evidenceIds: selected.candidate.evidenceIds,
    observableClues: selected.candidate.observableClues,
    generator,
    templateId: `evidence-grounded-${selected.candidate.operator}`,
    operator: selected.candidate.operator,
  };
  const frame: ObservationFrame = {
    placeId: place.placeId,
    placeName: place.placeName,
    primaryTheme,
    secondaryThemes,
    confidence,
    visibleFeature: selected.candidate.observableClues.join(", "),
    observableClues: selected.candidate.observableClues,
    evidenceIds: selected.candidate.evidenceIds,
    disallowedConcepts: [],
    topicContext: topics
      .filter((topic) =>
        selected.candidate.evidenceIds.some((id) => topic.evidenceIds.includes(id))
      )
      .slice(0, 2)
      .map((topic) => ({
        topicId: topic.id,
        keywords: topic.keywords,
        weight: topic.weight,
        evidenceIds: topic.evidenceIds,
      })),
    frameType: "evidence-grounded-observation",
  };

  return { generated, frame };
}
