import type { EvidenceItem, ObservationFrame } from "../types";

function cleanPhrase(value: string) {
  return value
    .replace(/^(?:a|an|the)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function definitePhrase(value: string) {
  const cleaned = cleanPhrase(value);
  return /^\d/.test(cleaned) ? cleaned : `the ${cleaned}`;
}

export function extractExplicitPlaceRelation(evidence: EvidenceItem[]) {
  for (const item of evidence) {
    if (!item.refersToCurrentPlace) continue;
    const text = item.normalizedText;
    const connectedBy = text.match(
      /^(?:the|these|those)\s+([^,.;]{2,75}?)\s+(?:is|are)\s+(?:directly\s+)?(?:connected|linked|joined)\s+by\s+(?:a|an|the)\s+([^,.;]{2,60})/i
    );
    if (connectedBy) {
      return {
        kind: "connected-by" as const,
        connector: definitePhrase(connectedBy[2]),
        targets: definitePhrase(connectedBy[1]),
        evidenceId: item.id,
      };
    }

    const organizedAround = text.match(
      /^(?:the|these|those)\s+([^,.;]{2,75}?)\s+(?:is|are)\s+(?:arranged|organized|clustered|grouped)\s+around\s+(?:a|an|the)\s+([^,.;]{2,60})/i
    );
    if (organizedAround) {
      return {
        kind: "organized-around" as const,
        connector: definitePhrase(organizedAround[2]),
        targets: definitePhrase(organizedAround[1]),
        evidenceId: item.id,
      };
    }

    const separatedBy = text.match(
      /^(?:the|these|those)\s+([^,.;]{2,75}?)\s+(?:is|are)\s+(?:separated|divided)\s+by\s+(?:a|an|the)\s+([^,.;]{2,60})/i
    );
    if (separatedBy) {
      return {
        kind: "separated-by" as const,
        connector: definitePhrase(separatedBy[2]),
        targets: definitePhrase(separatedBy[1]),
        evidenceId: item.id,
      };
    }

    const activeConnection = text.match(
      /^(?:a|an|the)\s+([^,.;]{2,60}?)\s+(?:connects|links|joins)\s+(?:the\s+)?([^,.;]{2,85})/i
    );
    if (activeConnection) {
      return {
        kind: "connected-by" as const,
        connector: definitePhrase(activeConnection[1]),
        targets: definitePhrase(activeConnection[2]),
        evidenceId: item.id,
      };
    }
  }

  return null;
}

export function applyExplicitPlaceRelation(
  frame: ObservationFrame,
  evidence: EvidenceItem[]
): ObservationFrame {
  const spatialRelation = extractExplicitPlaceRelation(evidence);
  if (!spatialRelation) return frame;

  return {
    ...frame,
    visibleFeature:
      spatialRelation.kind === "connected-by"
        ? `${spatialRelation.connector} connecting ${spatialRelation.targets}`
        : spatialRelation.kind === "organized-around"
          ? `${spatialRelation.targets} organized around ${spatialRelation.connector}`
          : `${spatialRelation.connector} separating ${spatialRelation.targets}`,
    observableClues: [spatialRelation.connector, spatialRelation.targets],
    evidenceIds: Array.from(
      new Set([spatialRelation.evidenceId, ...frame.evidenceIds])
    ),
    spatialRelation,
  };
}
