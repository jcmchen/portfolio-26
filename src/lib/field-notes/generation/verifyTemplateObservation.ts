import {
  selectAtomicEvidence,
  significantTokenOverlap,
} from "../analysis/selectAtomicEvidence";
import type {
  EvidenceItem,
  GeneratedFieldNote,
  GenerativeObservationCandidate,
  ObservationFrame,
  ObservationOperator,
} from "../types";
import { validateGenerativeCandidate } from "./generativeValidation";

function operatorForFrame(frame: ObservationFrame): ObservationOperator {
  if (frame.spatialRelation) return "spatial_organization";
  if (
    frame.frameType === "station-layout" &&
    /\bevent-only service pattern\b/i.test(frame.visibleFeature || "")
  ) {
    return "use_behavior";
  }
  if (
    [
      "past-present-change",
      "historical-trace",
      "preserved-survivor",
      "industry-landscape",
      "institutional-transition",
    ].includes(frame.frameType)
  ) {
    return "historical_trace";
  }
  if (frame.frameType === "material-expression") {
    return frame.primaryTheme === "transportation"
      ? "spatial_organization"
      : "material_expression";
  }
  if (frame.frameType === "terrain-reading" || frame.frameType === "ecology-reading") {
    return "environment_relation";
  }
  if (frame.frameType === "commercial-reading") return "use_behavior";
  return "spatial_organization";
}

export function verifyTemplateObservation(
  generated: GeneratedFieldNote,
  frame: ObservationFrame,
  evidence: EvidenceItem[]
) {
  const selectedAtoms = selectAtomicEvidence(evidence, 12);
  const atomsById = new Map(
    selectedAtoms.map((atom) => [atom.evidenceId, atom])
  );

  // The atomic selector is intentionally conservative. A specialized frame can
  // still cite precise evidence that has no known operator keyword (for example,
  // "a pair of parallel bridges"). Keep that evidence available to the verifier
  // instead of silently replacing a good template with a weaker generic prompt.
  evidence.forEach((item) => {
    if (
      !atomsById.has(item.id) &&
      frame.evidenceIds.includes(item.id) &&
      item.refersToCurrentPlace &&
      item.normalizedText.length >= 20
    ) {
      atomsById.set(item.id, {
        evidenceId: item.id,
        text: item.normalizedText,
        sectionTitle: item.sectionTitle,
        relevance: 0,
        operators: [],
        observableClues: [],
      });
    }
  });

  const frameClaims = [
    frame.pastState,
    frame.presentState,
    frame.historicalChange,
    frame.visibleFeature,
  ].filter((value): value is string => Boolean(value));
  const groundingTargets = [
    generated.question,
    ...frame.observableClues,
    ...frameClaims,
  ];
  const verificationContext = groundingTargets.join(" ");
  const eligibleAtoms = [...atomsById.values()].filter((atom) =>
    frame.evidenceIds.includes(atom.evidenceId)
  );
  const rankedAtoms = eligibleAtoms
    .map((atom) => ({
      atom,
      score: atom.relevance * 0.25 + significantTokenOverlap(verificationContext, atom.text) * 12,
    }))
    .sort((a, b) => b.score - a.score);
  const selectedIds = new Set<string>();

  // Cover each claim or clue with its strongest supporting sentence before
  // filling the citation set by overall relevance. This keeps complementary
  // evidence such as “parallel bridges” + “increased traffic” together.
  groundingTargets.forEach((target) => {
    const strongest = eligibleAtoms
      .map((atom) => ({
        atom,
        overlap: significantTokenOverlap(target, atom.text),
      }))
      .filter((item) => item.overlap >= 0.15)
      .sort(
        (a, b) =>
          b.overlap - a.overlap || b.atom.relevance - a.atom.relevance
      )[0]?.atom;
    if (strongest) selectedIds.add(strongest.evidenceId);
  });
  rankedAtoms.forEach(({ atom }) => {
    if (selectedIds.size < 8) selectedIds.add(atom.evidenceId);
  });
  const frameAtoms = eligibleAtoms.filter((atom) =>
    selectedIds.has(atom.evidenceId)
  );
  if (!frameAtoms.length) return null;

  const citedText = frameAtoms.map((atom) => atom.text).join(" ");
  const groundedClaims = frameClaims.filter(
    (claim) => significantTokenOverlap(claim, citedText) >= 0.3
  );
  const candidate: GenerativeObservationCandidate = {
    question: generated.question,
    operator: operatorForFrame(frame),
    evidenceIds: frameAtoms.map((atom) => atom.evidenceId),
    presuppositions: groundedClaims.length
      ? groundedClaims.slice(0, 3)
      : [frameAtoms[0].text],
    observableClues: frame.observableClues,
  };
  const validation = validateGenerativeCandidate(candidate, frameAtoms);
  if (!validation.valid) return null;

  return {
    generated: {
      ...generated,
      evidenceIds: candidate.evidenceIds,
      operator: candidate.operator,
    },
    frame: {
      ...frame,
      evidenceIds: candidate.evidenceIds,
      confidence: Number(
        Math.min(frame.confidence, 0.68 + validation.score * 0.27).toFixed(2)
      ),
    },
    validation,
  };
}
