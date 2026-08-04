import type {
  AtomicEvidence,
  EvidencePlace,
  GenerativeObservationCandidate,
  ObservationOperator,
} from "../types";
import { selectBestGenerativeCandidate } from "./generativeValidation";

const DEFAULT_MODEL = "gpt-5.6-sol";
const REQUEST_TIMEOUT_MS = 20_000;
const OPERATORS: ObservationOperator[] = [
  "historical_trace",
  "spatial_organization",
  "boundary_connection",
  "material_expression",
  "use_behavior",
  "environment_relation",
];

type FetchLike = typeof fetch;

type LLMGeneratorOptions = {
  apiKey?: string;
  model?: string;
  fetchImpl?: FetchLike;
};

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function responseText(payload: ResponsesPayload) {
  if (payload.output_text) return payload.output_text;
  return payload.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === "output_text" && item.text)?.text;
}

function isCandidate(value: unknown): value is GenerativeObservationCandidate {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<GenerativeObservationCandidate>;
  return (
    typeof item.question === "string" &&
    typeof item.operator === "string" &&
    OPERATORS.includes(item.operator as ObservationOperator) &&
    Array.isArray(item.evidenceIds) &&
    item.evidenceIds.every((id) => typeof id === "string") &&
    Array.isArray(item.presuppositions) &&
    item.presuppositions.every((claim) => typeof claim === "string") &&
    Array.isArray(item.observableClues) &&
    item.observableClues.every((clue) => typeof clue === "string")
  );
}

export async function generateEvidenceGroundedLLMObservation(
  place: EvidencePlace,
  atoms: AtomicEvidence[],
  options: LLMGeneratorOptions = {}
) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey || !atoms.length) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model ?? process.env.FIELD_NOTE_LLM_MODEL ?? DEFAULT_MODEL,
        reasoning: { effort: "low" },
        store: false,
        input: [
          {
            role: "developer",
            content:
              "You create concise English field-observation prompts for a design portfolio. " +
              "Use only supplied evidence about the current place. Generate exactly three candidates using different observation operators. " +
              "Each question must be 8–18 words, useful to a visitor on site, and invite looking or inference rather than factual recall. " +
              "Do not assert that a visible trace exists when the evidence only establishes a past condition; ask whether or where it remains. " +
              "Every presupposition must be directly supported by the cited evidence IDs. Avoid generic questions and avoid mentioning Wikipedia.",
          },
          {
            role: "user",
            content: JSON.stringify({
              place: place.placeName,
              operators: OPERATORS,
              evidence: atoms.map((atom) => ({
                evidenceId: atom.evidenceId,
                text: atom.text,
                sectionTitle: atom.sectionTitle,
                suggestedOperators: atom.operators.map((item) => item.operator),
                observableClues: atom.observableClues,
              })),
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "field_note_candidates",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["candidates"],
              properties: {
                candidates: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "question",
                      "operator",
                      "evidenceIds",
                      "presuppositions",
                      "observableClues",
                    ],
                    properties: {
                      question: { type: "string" },
                      operator: { type: "string", enum: OPERATORS },
                      evidenceIds: {
                        type: "array",
                        minItems: 1,
                        maxItems: 3,
                        items: { type: "string" },
                      },
                      presuppositions: {
                        type: "array",
                        minItems: 1,
                        maxItems: 3,
                        items: { type: "string" },
                      },
                      observableClues: {
                        type: "array",
                        minItems: 1,
                        maxItems: 4,
                        items: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        max_output_tokens: 1_200,
      }),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as ResponsesPayload;
    const text = responseText(payload);
    if (!text) return null;
    const parsed = JSON.parse(text) as { candidates?: unknown[] };
    const candidates = (parsed.candidates || []).filter(isCandidate).slice(0, 3);
    return selectBestGenerativeCandidate(candidates, atoms);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
