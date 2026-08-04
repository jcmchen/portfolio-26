import { significantTokenOverlap } from "../analysis/selectAtomicEvidence";
import type {
  AtomicEvidence,
  GenerativeObservationCandidate,
} from "../types";

const GENERIC_QUESTIONS = [
  /how has .+ shaped the way this place/i,
  /what makes this place (?:special|unique|interesting)/i,
  /what does this place reveal/i,
  /how does infrastructure shape this place/i,
  /what can you observe (?:here|at this place)/i,
];

const OBSERVATION_LANGUAGE =
  /\b(?:visible|legible|layout|trace|remains?|surviv(?:e|es|ed|ing)|edge|boundary|connect|organize|movement|move|gather|pause|material|built|facade|façade|path|route|street|plaza|platform|shore|river|creek|wetland|marsh|hill|slope|station|market|stalls?|vendors?|cargo|park|house|mansion|museum|bridge|port|harbou?r|wharves?|mine|mining|habitat|vegetation|tower|pond|quarry|outcrop)\b/i;

export type GenerativeCandidateValidation =
  | { valid: true; score: number }
  | { valid: false; reason: string };

export function validateGenerativeCandidate(
  candidate: GenerativeObservationCandidate,
  atoms: AtomicEvidence[]
): GenerativeCandidateValidation {
  const evidenceById = new Map(atoms.map((atom) => [atom.evidenceId, atom]));
  const cited = Array.from(new Set(candidate.evidenceIds))
    .map((id) => evidenceById.get(id))
    .filter((atom): atom is AtomicEvidence => Boolean(atom));

  if (!cited.length || cited.length !== new Set(candidate.evidenceIds).size) {
    return { valid: false, reason: "Candidate cites missing evidence." };
  }

  const words = candidate.question.trim().split(/\s+/).length;
  if (words < 8 || words > 18 || !candidate.question.endsWith("?")) {
    return { valid: false, reason: "Question must contain 8–18 words and end with a question mark." };
  }
  if (GENERIC_QUESTIONS.some((pattern) => pattern.test(candidate.question))) {
    return { valid: false, reason: "Question matches a generic fallback." };
  }
  if (!OBSERVATION_LANGUAGE.test(`${candidate.question} ${candidate.observableClues.join(" ")}`)) {
    return { valid: false, reason: "Question does not support on-site observation." };
  }
  if (!candidate.observableClues.length || !candidate.presuppositions.length) {
    return { valid: false, reason: "Candidate lacks clues or explicit presuppositions." };
  }

  const citedText = cited.map((atom) => atom.text).join(" ");
  const asksOpenEndedPersistence =
    !/^(?:is|are|can|could|might|whether)\b/i.test(candidate.question.trim()) &&
    /\bstill\s+(?:reveal|visible|legible|remain)|\bstill\b.{0,35}\bvisible/i.test(
      candidate.question
    );
  const persistenceIsSupported =
    /\b(?:preserv(?:ed|ation)|remain(?:s|ed|ing)?|surviv(?:e|es|ed|ing)|still stands?|visible traces?|historic fabric|original structure)\b/i.test(
      citedText
    );
  if (asksOpenEndedPersistence && !persistenceIsSupported) {
    return {
      valid: false,
      reason: "Question presupposes a surviving visible trace not established by evidence.",
    };
  }
  const weakestPresupposition = Math.min(
    ...candidate.presuppositions.map((claim) =>
      significantTokenOverlap(claim, citedText)
    )
  );
  if (weakestPresupposition < 0.3) {
    return { valid: false, reason: "A presupposition is not grounded in cited evidence." };
  }

  const questionGrounding = significantTokenOverlap(candidate.question, citedText);
  const factualClues = candidate.observableClues.filter(
    (clue) =>
      !/\b(?:(?:today’s|today's|current) (?:layout|landscape|activity)|movement|gather|pause|contrast|boundar(?:y|ies)|arrivals?|departures?|remaining signs|changes? in elevation|flow direction|scale|street-facing form|conditions)\b/i.test(
        clue
      )
  );
  const clueScores = factualClues.map((clue) =>
    significantTokenOverlap(clue, citedText)
  );
  const groundedClueRatio = clueScores.length
    ? clueScores.filter((score) => score >= 0.3).length / clueScores.length
    : 1;
  const clueGrounding = clueScores.length
    ? clueScores.reduce((total, score) => total + score, 0) / clueScores.length
    : 0.5;
  if (groundedClueRatio < 0.5) {
    return { valid: false, reason: "Most observable clues are not grounded in cited evidence." };
  }
  if (questionGrounding < 0.12 || clueGrounding < 0.3) {
    return { valid: false, reason: "Question or clues are insufficiently specific to the evidence." };
  }

  const brevity = 1 - Math.abs(words - 12) / 12;
  const grounding = Math.min(1, weakestPresupposition * 0.65 + questionGrounding * 0.35);
  const observability = OBSERVATION_LANGUAGE.test(candidate.question) ? 1 : 0.7;
  const specificity = Math.min(1, questionGrounding * 2.8 + clueGrounding * 0.35);
  const score =
    grounding * 0.35 +
    observability * 0.25 +
    specificity * 0.25 +
    Math.max(0, brevity) * 0.15;

  return { valid: true, score: Number(score.toFixed(3)) };
}

export function selectBestGenerativeCandidate(
  candidates: GenerativeObservationCandidate[],
  atoms: AtomicEvidence[]
) {
  return candidates
    .map((candidate) => ({
      candidate,
      validation: validateGenerativeCandidate(candidate, atoms),
    }))
    .filter(
      (item): item is {
        candidate: GenerativeObservationCandidate;
        validation: { valid: true; score: number };
      } => item.validation.valid
    )
    .sort((a, b) => b.validation.score - a.validation.score)[0] || null;
}
