export const FIELD_NOTE_ALGORITHM_VERSION = "evidence-bridge-v3";

export type ObservationTheme =
  | "environment"
  | "material"
  | "space"
  | "historyCulture";

export type EvidenceRelation = "explicit-causal" | "associated" | "descriptive";

export type PromptSource = {
  id: string;
  label: string;
  text: string;
  kind: "summary" | "section" | "wikidata";
  revision?: number;
};

export type FieldPromptResult = {
  prompt: string;
  meta: {
    algorithmVersion: string;
    mode: "evidence-to-observation";
    themes: ObservationTheme[];
    relation: EvidenceRelation;
    evidence: Array<{
      source: string;
      text: string;
      revision?: number;
    }>;
    observableCues: string[];
    candidatesEvaluated: number;
    score: number;
    usedFallback: boolean;
  };
};

type ConceptRule = {
  pattern: RegExp;
  phrase: string;
  cues: string[];
  weight: number;
};

type ThemeMatch = {
  theme: ObservationTheme;
  phrase: string;
  cues: string[];
  weight: number;
};

type EvidenceRecord = {
  id: string;
  source: PromptSource;
  text: string;
  themes: ThemeMatch[];
  relation: EvidenceRelation;
  score: number;
};

type PromptCandidate = {
  prompt: string;
  evidence: EvidenceRecord;
  themes: ObservationTheme[];
  observableCues: string[];
  score: number;
};

type PlaceContext = {
  subject: string;
  possessive: string;
  setting: string;
};

const THEME_ORDER: ObservationTheme[] = [
  "environment",
  "material",
  "space",
  "historyCulture",
];

const CONCEPT_RULES: Record<ObservationTheme, ConceptRule[]> = {
  environment: [
    {
      pattern: /\b(?:coastal|rocky|sandy|eroding)\s+(?:coast|shore|shoreline)\b/i,
      phrase: "the coastal setting",
      cues: ["salt", "erosion", "weathering", "exposure"],
      weight: 3,
    },
    {
      pattern: /\b(?:coast|shore|shoreline)\b/i,
      phrase: "the shoreline",
      cues: ["erosion", "edges", "tides", "exposure"],
      weight: 2.7,
    },
    {
      pattern: /\b(?:fog|foggy)\b/i,
      phrase: "fog",
      cues: ["visibility", "moisture", "light", "surface change"],
      weight: 2.6,
    },
    {
      pattern: /\b(?:tide|tides|tidal)\b/i,
      phrase: "the tides",
      cues: ["water marks", "erosion", "debris", "changing edges"],
      weight: 2.6,
    },
    {
      pattern: /\berosion\b/i,
      phrase: "erosion",
      cues: ["wear", "cracks", "exposed layers", "repair"],
      weight: 2.6,
    },
    {
      pattern: /\b(?:wetland|marsh|estuary)\b/i,
      phrase: "the wetland ecology",
      cues: ["vegetation", "water levels", "soft ground", "habitat edges"],
      weight: 2.5,
    },
    {
      pattern: /\b(?:forest|woodland)\b/i,
      phrase: "the forest",
      cues: ["canopy", "ground cover", "managed edges", "light"],
      weight: 2.3,
    },
    {
      pattern: /\b(?:mountain|mountains|hill|hills|valley|terrain|slope)\b/i,
      phrase: "the terrain",
      cues: ["slope", "cut ground", "drainage", "views"],
      weight: 2.3,
    },
    {
      pattern: /\b(?:river|creek|stream|waterfall)\b/i,
      phrase: "the waterway",
      cues: ["flow", "banks", "crossings", "flood traces"],
      weight: 2.2,
    },
    {
      pattern: /\b(?:wind|winds)\b/i,
      phrase: "wind",
      cues: ["movement", "shelter", "orientation", "surface wear"],
      weight: 2.1,
    },
    {
      pattern: /\b(?:rain|rainfall|monsoon|humidity)\b/i,
      phrase: "the climate",
      cues: ["drainage", "staining", "corrosion", "shade"],
      weight: 2,
    },
    {
      pattern: /\b(?:geology|geological|volcanic|formation)\b/i,
      phrase: "the geology",
      cues: ["rock layers", "landform", "cut surfaces", "soil"],
      weight: 2,
    },
    {
      pattern: /\b(?:habitat|ecology|ecological|landscape)\b/i,
      phrase: "the local ecology",
      cues: ["species", "vegetation", "disturbance", "habitat edges"],
      weight: 1.7,
    },
  ],
  material: [
    {
      pattern: /\b(?:weathered|exposed|red|fired|historic)?\s*brick\b/i,
      phrase: "brick",
      cues: ["mortar", "weathering", "repair", "color variation"],
      weight: 3,
    },
    {
      pattern: /\b(?:reinforced|precast|poured)?\s*concrete\b/i,
      phrase: "concrete",
      cues: ["formwork marks", "cracks", "patches", "staining"],
      weight: 3,
    },
    {
      pattern: /\b(?:wood|wooden|timber)\b/i,
      phrase: "timber",
      cues: ["grain", "joints", "decay", "replacement"],
      weight: 2.8,
    },
    {
      pattern: /\b(?:stone|granite|limestone|sandstone|masonry)\b/i,
      phrase: "stonework",
      cues: ["joints", "tool marks", "weathering", "moss"],
      weight: 2.8,
    },
    {
      pattern: /\b(?:steel|iron|metal|metalwork)\b/i,
      phrase: "metalwork",
      cues: ["corrosion", "fasteners", "welds", "replacement"],
      weight: 2.6,
    },
    {
      pattern: /\b(?:tile|tiles|tiled|ceramic)\b/i,
      phrase: "tilework",
      cues: ["pattern", "glaze", "cracks", "repair"],
      weight: 2.5,
    },
    {
      pattern: /\b(?:adobe|rammed earth|earthen)\b/i,
      phrase: "earth construction",
      cues: ["layers", "erosion", "patching", "surface texture"],
      weight: 2.5,
    },
    {
      pattern: /\bglass\b/i,
      phrase: "glass",
      cues: ["reflection", "transparency", "frames", "replacement"],
      weight: 2.2,
    },
  ],
  space: [
    {
      pattern: /\b(?:railway|railroad|rail line)\b/i,
      phrase: "the rail infrastructure",
      cues: ["alignment", "cut slopes", "bridges", "movement"],
      weight: 3,
    },
    {
      pattern: /\b(?:harbor|harbour|port|marina|dock|pier)\b/i,
      phrase: "the waterfront infrastructure",
      cues: ["working edges", "access", "mooring", "circulation"],
      weight: 2.8,
    },
    {
      pattern: /\b(?:fort|fortress|bunker|barracks)\b/i,
      phrase: "the fortified spaces",
      cues: ["walls", "sightlines", "thresholds", "defensive edges"],
      weight: 2.8,
    },
    {
      pattern: /\b(?:temple|shrine|church|mosque)\b/i,
      phrase: "the sacred spaces",
      cues: ["thresholds", "orientation", "gathering", "ritual routes"],
      weight: 2.8,
    },
    {
      pattern: /\b(?:street|alley|lane|plaza|courtyard)\b/i,
      phrase: "the public spaces",
      cues: ["movement", "gathering", "shade", "thresholds"],
      weight: 2.6,
    },
    {
      pattern: /\b(?:bridge|station|market|canal|reservoir)\b/i,
      phrase: "the civic infrastructure",
      cues: ["access", "scale", "edges", "everyday use"],
      weight: 2.5,
    },
    {
      pattern: /\b(?:settlement|district|neighbou?rhood|village)\b/i,
      phrase: "the settlement pattern",
      cues: ["density", "boundaries", "street pattern", "shared space"],
      weight: 2.4,
    },
    {
      pattern: /\b(?:path|trail|route|road)\b/i,
      phrase: "the routes through the site",
      cues: ["sequence", "surface", "slope", "access"],
      weight: 2.2,
    },
    {
      pattern: /\b(?:architecture|architectural|infrastructure|urban)\b/i,
      phrase: "the built spaces",
      cues: ["scale", "thresholds", "circulation", "edges"],
      weight: 1.8,
    },
  ],
  historyCulture: [
    {
      pattern: /\b(?:Indigenous|Aboriginal)\b/i,
      phrase: "the site's Indigenous history",
      cues: ["continuity", "land use", "place names", "cultural traces"],
      weight: 3,
    },
    {
      pattern: /\bcolonial\b/i,
      phrase: "its colonial history",
      cues: ["layering", "reuse", "boundaries", "building types"],
      weight: 3,
    },
    {
      pattern: /\b(?:Japanese rule|Japanese colonial)\b/i,
      phrase: "its history under Japanese rule",
      cues: ["infrastructure", "building types", "reuse", "street patterns"],
      weight: 3,
    },
    {
      pattern: /\b(?:industrial|industry|factory|manufacturing)\b/i,
      phrase: "its industrial past",
      cues: ["working surfaces", "large spans", "service routes", "reuse"],
      weight: 2.8,
    },
    {
      pattern: /\b(?:military|naval|army|defen[cs]e)\b/i,
      phrase: "its military history",
      cues: ["sightlines", "walls", "restricted edges", "reuse"],
      weight: 2.8,
    },
    {
      pattern: /\b(?:immigrant|migration|community)\b/i,
      phrase: "the histories of its communities",
      cues: ["signage", "shared spaces", "adaptation", "everyday use"],
      weight: 2.9,
    },
    {
      pattern: /\b(?:agriculture|agricultural|fishing|mining|timber industry)\b/i,
      phrase: "its working history",
      cues: ["tools", "routes", "working edges", "adaptation"],
      weight: 2.6,
    },
    {
      pattern: /\b(?:ritual|religious|sacred|festival|ceremony)\b/i,
      phrase: "its cultural traditions",
      cues: ["gathering", "offerings", "procession", "seasonal use"],
      weight: 2.5,
    },
    {
      pattern: /\b(?:heritage|historic|historical|traditional)\b/i,
      phrase: "its layered history",
      cues: ["repair", "reuse", "old and new fabric", "interpretive signs"],
      weight: 1.8,
    },
    {
      pattern: /\b(?:century|founded|established|constructed|built)\b/i,
      phrase: "the way it has changed over time",
      cues: ["additions", "repair", "reuse", "material layers"],
      weight: 1.4,
    },
  ],
};

const EXPLICIT_CAUSAL_PATTERN =
  /\b(?:because|therefore|resulted in|led to|in response to|due to|built to|designed to|enabled|caused|adapted to|as a result)\b/i;
const ASSOCIATED_PATTERN =
  /\b(?:associated with|connected to|used for|part of|supported|during|along|around|through|developed|grew|served as)\b/i;

function findThemeMatch(text: string, theme: ObservationTheme): ThemeMatch | undefined {
  const rule = CONCEPT_RULES[theme].find(({ pattern }) => pattern.test(text));

  return rule
    ? {
        theme,
        phrase: rule.phrase,
        cues: rule.cues,
        weight: rule.weight,
      }
    : undefined;
}

function pairBonus(first: ObservationTheme, second: ObservationTheme) {
  const pair = new Set([first, second]);

  if (pair.has("environment") && pair.has("material")) return 2.5;
  if (pair.has("space") && pair.has("historyCulture")) return 2.2;
  if (pair.has("material") && pair.has("historyCulture")) return 1.8;
  if (pair.has("environment") && pair.has("historyCulture")) return 1.6;
  if (pair.has("environment") && pair.has("space")) return 1.4;
  if (pair.has("material") && pair.has("space")) return 1.2;

  return 0;
}

function sentenceCandidates(text: string) {
  return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length >= 25 && sentence.length <= 420)
    .slice(0, 36);
}

function relationFromText(text: string): EvidenceRelation {
  if (EXPLICIT_CAUSAL_PATTERN.test(text)) return "explicit-causal";
  if (ASSOCIATED_PATTERN.test(text)) return "associated";
  return "descriptive";
}

function extractEvidence(sources: PromptSource[]) {
  const records: EvidenceRecord[] = [];

  sources.forEach((source) => {
    sentenceCandidates(source.text).forEach((sentence, sentenceIndex) => {
      const themes = THEME_ORDER.map((theme) => findThemeMatch(sentence, theme)).filter(
        (match): match is ThemeMatch => Boolean(match)
      );

      if (!themes.length) return;

      const relation = relationFromText(sentence);
      const strongestPairBonus = themes.reduce(
        (best, first, firstIndex) =>
          Math.max(
            best,
            ...themes
              .slice(firstIndex + 1)
              .map((second) => pairBonus(first.theme, second.theme))
          ),
        0
      );
      const sourceBonus = source.kind === "wikidata" ? 1.2 : source.kind === "section" ? 0.6 : 0.2;
      const relationBonus = relation === "explicit-causal" ? 2 : relation === "associated" ? 0.8 : 0;
      const score =
        themes.reduce((total, theme) => total + theme.weight, 0) +
        strongestPairBonus +
        sourceBonus +
        relationBonus -
        sentenceIndex * 0.025;

      records.push({
        id: `${source.id}-${sentenceIndex}`,
        source,
        text: sentence,
        themes,
        relation,
        score,
      });
    });
  });

  return records.sort((a, b) => b.score - a.score).slice(0, 16);
}

function candidateFromPair(
  evidence: EvidenceRecord,
  first: ThemeMatch,
  second: ThemeMatch,
  placeContext: PlaceContext
) {
  const byTheme = new Map([
    [first.theme, first],
    [second.theme, second],
  ]);
  const environment = byTheme.get("environment");
  const material = byTheme.get("material");
  const space = byTheme.get("space");
  const history = byTheme.get("historyCulture");
  let prompt: string | undefined;
  let observableCues: string[] = [];
  const placeSubject = space ? placeContext.subject : "this place";
  const placePossessive = space ? placeContext.possessive : "its";
  const placeSetting = space ? placeContext.setting : "in this place";
  const historyPhrase = history
    ? history.phrase
        .replace(/^its\b/, placePossessive)
        .replace(/^the site's\b/, placePossessive)
        .replace(/\bits communities\b/, `${placePossessive} communities`)
    : "";

  if (environment && material) {
    prompt = `Where does ${material.phrase} show the clearest response to ${environment.phrase}?`;
    observableCues = material.cues.slice(0, 2);
  } else if (environment && space) {
    prompt = `How has ${environment.phrase} shaped ${placeSubject}?`;
    observableCues = [space.cues[0], environment.cues[0]];
  } else if (material && space) {
    prompt = `How does ${material.phrase} shape the way ${placeSubject} is used?`;
    observableCues = [material.cues[0], space.cues[0]];
  } else if (material && history) {
    prompt = `What can ${material.phrase} tell us about ${historyPhrase}?`;
    observableCues = [material.cues[0], history.cues[0]];
  } else if (space && history) {
    prompt = `Where can you still see ${historyPhrase} ${placeSetting}?`;
    observableCues = [space.cues[0], history.cues[1]];
  } else if (environment && history) {
    prompt = `How has ${environment.phrase} influenced the way this place has changed over time?`;
    observableCues = [environment.cues[0], history.cues[0]];
  }

  if (!prompt) return undefined;

  return {
    prompt,
    evidence,
    themes: [first.theme, second.theme],
    observableCues,
    score: 0,
  } satisfies PromptCandidate;
}

function candidateFromSingle(
  evidence: EvidenceRecord,
  match: ThemeMatch,
  placeContext: PlaceContext
) {
  const historyPhrase = match.phrase.replace(/^the site's\b/, "its");
  const historyQuestion = historyPhrase.startsWith("the histories")
    ? `Where are ${historyPhrase} still visible ${placeContext.setting}?`
    : `Where is ${historyPhrase} still visible ${placeContext.setting}?`;
  const promptByTheme: Record<ObservationTheme, string> = {
    environment: `How has ${match.phrase} shaped the way this place is used and changed?`,
    material: `What does ${match.phrase} reveal about how this place was built and changed?`,
    space: `How does ${placeContext.subject} shape movement through this place?`,
    historyCulture: historyQuestion,
  };

  return {
    prompt: promptByTheme[match.theme],
    evidence,
    themes: [match.theme],
    observableCues: match.cues.slice(0, 4),
    score: 0,
  } satisfies PromptCandidate;
}

function placeContextFromTitle(place?: string): PlaceContext {
  const title = place?.toLowerCase() || "";

  if (/\b(?:port|harbou?r|marina|dock|pier)\b/.test(title)) {
    return {
      subject: "the port",
      possessive: "the port’s",
      setting: "along the waterfront",
    };
  }

  if (/\bbridge\b/.test(title)) {
    return {
      subject: "the bridge",
      possessive: "the bridge’s",
      setting: "in its structure",
    };
  }

  if (/\b(?:station|railway|railroad)\b/.test(title)) {
    return {
      subject: "the station",
      possessive: "the station’s",
      setting: "along its routes and platforms",
    };
  }

  if (/\b(?:temple|shrine|church|mosque)\b/.test(title)) {
    return {
      subject: "the site",
      possessive: "the site’s",
      setting: "in its spaces and rituals",
    };
  }

  if (/\b(?:park|scenic area|reserve)\b/.test(title)) {
    return {
      subject: "the landscape",
      possessive: "the area’s",
      setting: "across the landscape",
    };
  }

  return {
    subject: "this place",
    possessive: "its",
    setting: "in this place",
  };
}

function generateCandidates(evidenceRecords: EvidenceRecord[], place?: string) {
  const candidates: PromptCandidate[] = [];
  const placeContext = placeContextFromTitle(place);

  evidenceRecords.slice(0, 10).forEach((evidence) => {
    evidence.themes.forEach((first, firstIndex) => {
      candidates.push(candidateFromSingle(evidence, first, placeContext));

      evidence.themes.slice(firstIndex + 1).forEach((second) => {
        const candidate = candidateFromPair(evidence, first, second, placeContext);
        if (candidate) candidates.push(candidate);
      });
    });
  });

  return Array.from(new Map(candidates.map((candidate) => [candidate.prompt, candidate])).values());
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).length;
}

function scoreCandidate(candidate: PromptCandidate) {
  const words = wordCount(candidate.prompt);
  const lengthScore =
    words >= 9 && words <= 18
      ? 5
      : Math.max(0, 5 - Math.min(Math.abs(words - 9), Math.abs(words - 18)));
  const observabilityScore =
    /\b(?:observe|observed|visible|traces|look for|on site|notice|moving through|signs|reveal|show|see|changed over time)\b/i.test(
      candidate.prompt
    )
      ? 3
      : 0;
  const inferenceScore = /\b(?:how|what|where)\b/i.test(candidate.prompt) ? 2 : 0;
  const specificityScore = candidate.themes.length * 1.4;
  const candidateThemeWeight = candidate.evidence.themes
    .filter((match) => candidate.themes.includes(match.theme))
    .reduce((total, match) => total + match.weight, 0);
  const pairRelevanceScore =
    candidate.themes.length === 2
      ? pairBonus(candidate.themes[0], candidate.themes[1]) * 1.5
      : 0;
  const causalPenalty =
    candidate.evidence.relation !== "explicit-causal" &&
    /\b(?:caused|resulted|led to|why did|how did)\b/i.test(candidate.prompt)
      ? 6
      : 0;
  const genericPenalty =
    /how does this place|shape this place|where can you still see its .+ in this place/i.test(
      candidate.prompt
    )
      ? 2
      : 0;
  const templatePenalty =
    /\bhow might\b/i.test(candidate.prompt) ||
    /\band what could\b/i.test(candidate.prompt) ||
    /\breveal on site\b/i.test(candidate.prompt)
      ? 4
      : 0;
  const verbosityPenalty = words > 20 ? (words - 20) * 0.75 : 0;
  const focusedHistory =
    candidate.themes.length === 1 && candidate.themes[0] === "historyCulture"
      ? candidate.evidence.themes.find((match) => match.theme === "historyCulture")
      : undefined;
  const distinctiveHistoryBonus =
    focusedHistory && focusedHistory.weight >= 2.9 ? 7 : 0;

  return (
    candidate.evidence.score +
    lengthScore +
    observabilityScore +
    inferenceScore +
    specificityScore +
    distinctiveHistoryBonus +
    candidateThemeWeight +
    pairRelevanceScore -
    causalPenalty -
    genericPenalty -
    templatePenalty -
    verbosityPenalty
  );
}

export function generateFieldNotePrompt({
  sources,
  fallback,
  place,
  avoidPrompts = [],
}: {
  sources: PromptSource[];
  fallback: string;
  place?: string;
  avoidPrompts?: string[];
}): FieldPromptResult {
  const evidenceRecords = extractEvidence(sources);
  const evaluatedCandidates = generateCandidates(evidenceRecords, place)
    .map((candidate) => ({ ...candidate, score: scoreCandidate(candidate) }))
    .sort((a, b) => b.score - a.score);
  const avoided = new Set(
    avoidPrompts.map((prompt) => prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
  );
  const candidates = evaluatedCandidates.filter(
    (candidate) =>
      !avoided.has(candidate.prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
  );
  const selected = candidates[0];

  if (!selected) {
    return {
      prompt: fallback,
      meta: {
        algorithmVersion: FIELD_NOTE_ALGORITHM_VERSION,
        mode: "evidence-to-observation",
        themes: [],
        relation: "descriptive",
        evidence: [],
        observableCues: [],
        candidatesEvaluated: evaluatedCandidates.length,
        score: 0,
        usedFallback: true,
      },
    };
  }

  return {
    prompt: selected.prompt,
    meta: {
      algorithmVersion: FIELD_NOTE_ALGORITHM_VERSION,
      mode: "evidence-to-observation",
      themes: selected.themes,
      relation: selected.evidence.relation,
      evidence: [
        {
          source: selected.evidence.source.label,
          text: selected.evidence.text.slice(0, 320),
          revision: selected.evidence.source.revision,
        },
      ],
      observableCues: selected.observableCues,
      candidatesEvaluated: evaluatedCandidates.length,
      score: Number(selected.score.toFixed(2)),
      usedFallback: false,
    },
  };
}
