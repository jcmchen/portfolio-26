export const FIELD_NOTE_ALGORITHM_VERSION = "hybrid-nlp-v4";

export type EvidenceSource =
  | "wikipedia-summary"
  | "wikipedia-section"
  | "wikidata";

export type EvidenceFetchStatus =
  | "success"
  | "not-requested"
  | "http-error"
  | "parse-error"
  | "empty"
  | "timeout";

export type ObservationTheme =
  | "commerce"
  | "goodsMovement"
  | "transportation"
  | "adaptiveReuse"
  | "preservation"
  | "residentialHistory"
  | "museumConversion"
  | "architecture"
  | "material"
  | "terrain"
  | "geology"
  | "water"
  | "ecology"
  | "industry"
  | "mining"
  | "publicSpace";

export type EntityType =
  | "currentPlace"
  | "otherPlace"
  | "person"
  | "organization"
  | "building"
  | "geographicFeature"
  | "unknown";

export type EvidencePlace = {
  placeId: string;
  pageId: number;
  placeName: string;
  wikidataId?: string;
};

export type RawEvidenceSource = {
  id: string;
  source: EvidenceSource;
  label: string;
  text: string;
  sectionTitle?: string;
  revision?: number;
};

export type DetectedTheme = {
  theme: ObservationTheme;
  score: number;
  matchedPhrase?: string;
  reasons: string[];
};

export type EvidenceItem = {
  id: string;
  source: EvidenceSource;
  sourceLabel: string;
  text: string;
  normalizedText: string;
  sectionTitle?: string;
  revision?: number;
  sentenceIndex: number;
  subject?: string | null;
  subjectEntityType?: EntityType;
  mentionsCurrentPlace: boolean;
  refersToCurrentPlace: boolean;
  introducedEntities: Array<{
    text: string;
    type: EntityType;
  }>;
  detectedThemes: DetectedTheme[];
};

export type EvidenceFetchDetail = {
  status: EvidenceFetchStatus;
  httpStatus?: number;
  itemCount: number;
  error?: string;
};

export type EvidenceFetchReport = {
  summary: EvidenceFetchDetail;
  sectionIndex: EvidenceFetchDetail;
  sectionContent: EvidenceFetchDetail;
  sections: EvidenceFetchDetail;
  wikidata: EvidenceFetchDetail;
};

export type EvidenceFetchResult = {
  sources: RawEvidenceSource[];
  report: EvidenceFetchReport;
};

export type ThemeScore = {
  theme: ObservationTheme;
  score: number;
  evidenceIds: string[];
  reasons: string[];
};

export type ObservationFrame = {
  placeId: string;
  placeName: string;
  primaryTheme: ObservationTheme;
  secondaryThemes: ObservationTheme[];
  confidence: number;
  pastState?: string;
  presentState?: string;
  historicalChange?: string;
  visibleFeature?: string;
  observableClues: string[];
  evidenceIds: string[];
  disallowedConcepts: string[];
  frameType:
    | "past-present-change"
    | "historical-trace"
    | "preserved-survivor"
    | "industry-landscape"
    | "material-expression"
    | "terrain-reading";
};

export type GeneratedFieldNote = {
  question: string;
  evidenceIds: string[];
  observableClues: string[];
  generator: "template" | "llm";
  templateId?: string;
};

export type CandidateRejectionReason =
  | "EVIDENCE_FETCH_FAILED"
  | "INSUFFICIENT_EVIDENCE"
  | "NO_CURRENT_PLACE_EVIDENCE"
  | "ENTITY_OWNERSHIP_MISMATCH"
  | "NO_SUPPORTED_THEME"
  | "NO_OBSERVABLE_CLUE"
  | "NO_APPLICABLE_TEMPLATE"
  | "UNSUPPORTED_CONCEPT"
  | "QUESTION_TOO_GENERIC";

export type FieldNotePromptMeta = {
  algorithmVersion: string;
  generator: "template" | "llm";
  templateId?: string;
  primaryTheme: ObservationTheme;
  secondaryThemes: ObservationTheme[];
  confidence: number;
  frameType: ObservationFrame["frameType"];
  evidence: Array<{
    id: string;
    source: string;
    text: string;
    revision?: number;
  }>;
  observableClues: string[];
  fetchReport: EvidenceFetchReport;
};

export type QuestionValidationResult =
  | { valid: true }
  | {
      valid: false;
      reason: CandidateRejectionReason;
      details?: string;
    };

export type CandidatePipelineSuccess = {
  ok: true;
  generated: GeneratedFieldNote;
  frame: ObservationFrame;
  evidence: EvidenceItem[];
  themeScores: ThemeScore[];
};

export type CandidatePipelineFailure = {
  ok: false;
  reason: CandidateRejectionReason;
  details?: string;
  evidence: EvidenceItem[];
  themeScores: ThemeScore[];
  frame?: ObservationFrame;
};

export type CandidatePipelineResult = CandidatePipelineSuccess | CandidatePipelineFailure;

export type FetchResult<T> =
  | {
      ok: true;
      data: T;
      status: "success";
      httpStatus?: number;
    }
  | {
      ok: false;
      data: null;
      status: Exclude<EvidenceFetchStatus, "success">;
      httpStatus?: number;
      error: string;
    };
