import type {
  AtomicEvidence,
  DocumentTopic,
  EvidenceItem,
  ObservationOperator,
} from "../types";

const OPERATOR_RULES: Record<ObservationOperator, RegExp[]> = {
  historical_trace: [
    /\b(?:used to be|formerly|former|originally|once|historic|old)\b/i,
    /\b(?:replaced|relocated|converted|rebuilt|demolished|opened|closed)\b/i,
    /\b(?:built|constructed|established|founded)\s+(?:in|during|between|from)\b/i,
  ],
  spatial_organization: [
    /\b(?:layout|plaza|courtyard|street|path|trail|platform|entrance|exit|station|park)\b/i,
    /\b(?:consists of|features|contains|spreads over|divided into|area of)\b/i,
    /\b(?:center|tower|district|zone|grounds|site|port|harbou?r|wharves?)\b/i,
  ],
  boundary_connection: [
    /\b(?:edge|boundary|threshold|between|beside|adjacent|surrounding)\b/i,
    /\b(?:joins?|connects?|crosses?|confluence|mouth|gateway|entrance)\b/i,
  ],
  material_expression: [
    /\b(?:brick|concrete|timber|wood|steel|iron|stone|masonry|adobe|tile)\b/i,
    /\b(?:facade|façade|structure|construction|architectural|building form)\b/i,
  ],
  use_behavior: [
    /\b(?:vendors?|stalls?|market|shops?|visitors?|pedestrians?|recreation)\b/i,
    /\b(?:used for|operates?|activity|gathering|festival|service|public)\b/i,
    /\b(?:transports?|carrying|cargo|goods|materials?)\b/i,
  ],
  environment_relation: [
    /\b(?:rivers?|creeks?|shore|coast|wetlands?|marsh|habitat|wildlife|vegetation)\b/i,
    /\b(?:foothills?|hills?|slopes?|valleys?|ridges?|terrain|geology|quarry|outcrops?|ecology)\b/i,
  ],
};

const OBSERVABLE_CLUE_RULES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bold train station\b/i, label: "the old train station" },
  { pattern: /\bformer train station\b/i, label: "the former train station" },
  { pattern: /\b(?:center|central) plaza\b/i, label: "the central plaza" },
  { pattern: /\becology pond\b/i, label: "the ecology pond" },
  { pattern: /\blookout tower\b/i, label: "the lookout tower" },
  { pattern: /\b(?:market )?stalls?\b/i, label: "the stalls" },
  { pattern: /\bcargo\b/i, label: "cargo movement" },
  { pattern: /\b(?:port|harbou?r)\b/i, label: "the port" },
  { pattern: /\bwharves?\b/i, label: "the wharves" },
  { pattern: /\bplatforms?\b/i, label: "the platforms" },
  { pattern: /\bstation\b/i, label: "the station" },
  { pattern: /\bparks?\b/i, label: "the park" },
  { pattern: /\b(?:station )?exits?\b/i, label: "the exits" },
  { pattern: /\b(?:walking )?paths?\b/i, label: "the paths" },
  { pattern: /\btrails?\b/i, label: "the trails" },
  { pattern: /\b(?:salt |tidal )?marsh\b/i, label: "the marsh" },
  { pattern: /\bwetlands?\b/i, label: "the wetland" },
  { pattern: /\bshoreline\b/i, label: "the shoreline" },
  { pattern: /\brivers?(?:bank| channel)?\b/i, label: "the river" },
  { pattern: /\bcreeks?(?: channel)?\b/i, label: "the creek" },
  { pattern: /\bquarry face\b/i, label: "the quarry face" },
  { pattern: /\brock outcrops?\b/i, label: "the rock outcrops" },
  { pattern: /\bbrick(?:work)?\b/i, label: "the brickwork" },
  { pattern: /\bconcrete\b/i, label: "the concrete structure" },
  { pattern: /\b(?:facade|façade)\b/i, label: "the facade" },
  { pattern: /\b(?:food|cuisine)(?:-based)? (?:areas?|streets?|districts?)\b/i, label: "the food areas" },
];

const STOP_WORDS = new Set([
  "about", "after", "also", "are", "been", "being", "between", "can",
  "does", "from", "had", "has", "have", "into", "its", "more", "over",
  "such", "than", "that", "the", "their", "there", "these", "they",
  "this", "through", "under", "used", "using", "was", "were", "where",
  "which", "while", "with", "would",
]);

function tokens(value: string) {
  return new Set(
    value
      .toLocaleLowerCase()
      .match(/[a-z][a-z'-]{2,}/g)
      ?.filter((token) => !STOP_WORDS.has(token))
      .map((token) =>
        token.length > 4
          ? token.replace(/(?:ing|ed|s)$/i, "")
          : token
      ) || []
  );
}

function jaccard(first: string, second: string) {
  const a = tokens(first);
  const b = tokens(second);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / (a.size + b.size - overlap);
}

function observableClues(text: string) {
  return Array.from(
    new Set(
      OBSERVABLE_CLUE_RULES
        .filter((rule) => rule.pattern.test(text))
        .map((rule) => rule.label)
    )
  ).slice(0, 4);
}

function operatorScores(text: string): AtomicEvidence["operators"] {
  return (Object.entries(OPERATOR_RULES) as Array<
    [ObservationOperator, RegExp[]]
  >)
    .map(([operator, rules]) => ({
      operator,
      score: rules.reduce(
        (total, pattern, index) => total + (pattern.test(text) ? 3 - index * 0.6 : 0),
        0
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

function relevance(item: EvidenceItem, operators: AtomicEvidence["operators"], clues: string[]) {
  const text = item.normalizedText;
  const sectionBonus = item.sectionTitle ? 1.2 : 0;
  const specificity = Math.min(2, (tokens(text).size / 18) * 2);
  const relationBonus = operators[0]?.score || 0;
  const observableBonus = Math.min(2.4, clues.length * 0.8);
  const dated = /\b(?:1[6-9]|20)\d{2}\b/.test(text) ? 0.5 : 0;
  const genericLead = /^.+?\sis (?:an?|the)\b.{0,90}$/i.test(text) ? 1.5 : 0;
  return Number(
    Math.max(0, sectionBonus + specificity + relationBonus + observableBonus + dated - genericLead).toFixed(2)
  );
}

export function selectAtomicEvidence(
  evidence: EvidenceItem[],
  limit = 6,
  topics: DocumentTopic[] = []
): AtomicEvidence[] {
  const candidates = evidence
    .filter(
      (item) =>
        item.refersToCurrentPlace &&
        item.normalizedText.length >= 35 &&
        item.normalizedText.length <= 420
    )
    .map((item) => {
      const clues = observableClues(item.normalizedText);
      const operators = operatorScores(item.normalizedText);
      return {
        evidenceId: item.id,
        text: item.normalizedText,
        sectionTitle: item.sectionTitle,
        relevance: relevance(item, operators, clues),
        operators,
        observableClues: clues,
      } satisfies AtomicEvidence;
    })
    .filter((item) => item.operators.length > 0 || item.observableClues.length > 0)
    .sort((a, b) => b.relevance - a.relevance);

  const selected: AtomicEvidence[] = [];
  while (selected.length < limit && candidates.length) {
    const coveredTopics = new Set(
      topics
        .filter((topic) =>
          selected.some((item) => topic.evidenceIds.includes(item.evidenceId))
        )
        .map((topic) => topic.id)
    );
    const next = candidates
      .map((candidate) => ({
        candidate,
        mmr:
          candidate.relevance * 0.75 -
          Math.max(0, ...selected.map((item) => jaccard(candidate.text, item.text))) * 4 +
          topics.reduce((bonus, topic) => {
            if (!topic.evidenceIds.includes(candidate.evidenceId)) return bonus;
            return bonus + topic.weight * (coveredTopics.has(topic.id) ? 0.7 : 2.2);
          }, 0),
      }))
      .sort((a, b) => b.mmr - a.mmr)[0]?.candidate;
    if (!next) break;
    selected.push(next);
    candidates.splice(candidates.indexOf(next), 1);
  }

  return selected;
}

export function significantTokenOverlap(first: string, second: string) {
  const a = tokens(first);
  const b = tokens(second);
  if (!a.size) return 0;
  return [...a].filter((token) => b.has(token)).length / a.size;
}
