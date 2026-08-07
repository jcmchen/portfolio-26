export const FIELD_NOTE_ALGORITHM_VERSION = "hybrid-nlp-v10-high-level-reading";

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
  | "placeReading"
  | "commerce"
  | "goodsMovement"
  | "transportation"
  | "adaptiveReuse"
  | "preservation"
  | "residentialHistory"
  | "museumConversion"
  | "institutionalChange"
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

export type DocumentTopic = {
  id: string;
  keywords: string[];
  evidenceIds: string[];
  weight: number;
  coherence: number;
  themeWeights: Array<{
    theme: ObservationTheme;
    score: number;
  }>;
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
  spatialRelation?: {
    kind: "connected-by" | "organized-around" | "separated-by";
    connector: string;
    targets: string;
    evidenceId: string;
  };
  topicContext?: Array<{
    topicId: string;
    keywords: string[];
    weight: number;
    evidenceIds: string[];
  }>;
  frameType:
    | "past-present-change"
    | "historical-trace"
    | "preserved-survivor"
    | "industry-landscape"
    | "institutional-transition"
    | "commercial-reading"
    | "station-layout"
    | "ecology-reading"
    | "public-space-reading"
    | "geology-reading"
    | "material-expression"
    | "terrain-reading"
    | "evidence-grounded-observation";
};

export type ObservationOperator =
  | "historical_trace"
  | "spatial_organization"
  | "boundary_connection"
  | "material_expression"
  | "use_behavior"
  | "environment_relation";

export type AtomicEvidence = {
  evidenceId: string;
  text: string;
  sectionTitle?: string;
  relevance: number;
  operators: Array<{
    operator: ObservationOperator;
    score: number;
  }>;
  observableClues: string[];
};

export type GenerativeObservationCandidate = {
  question: string;
  operator: ObservationOperator;
  evidenceIds: string[];
  presuppositions: string[];
  observableClues: string[];
};

export type GeneratedFieldNote = {
  question: string;
  evidenceIds: string[];
  observableClues: string[];
  generator: "template" | "operator" | "llm";
  templateId?: string;
  operator?: ObservationOperator;
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
  generator: "template" | "operator" | "llm";
  templateId?: string;
  operator?: ObservationOperator;
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
  topics?: Array<{
    topicId: string;
    keywords: string[];
    weight: number;
  }>;
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
  topics: DocumentTopic[];
};

export type CandidatePipelineFailure = {
  ok: false;
  reason: CandidateRejectionReason;
  details?: string;
  evidence: EvidenceItem[];
  themeScores: ThemeScore[];
  topics: DocumentTopic[];
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
