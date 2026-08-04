import type {
  DetectedTheme,
  EntityType,
  EvidenceItem,
  EvidencePlace,
  ObservationTheme,
  ThemeScore,
} from "../types";

type ConceptRule = {
  pattern: RegExp;
  score: number;
  phrase: string;
};

const CONCEPT_RULES: Record<ObservationTheme, ConceptRule[]> = {
  commerce: [
    { pattern: /\bwholesale(?:\s+center|\s+district)?\b/i, score: 3, phrase: "wholesale activity" },
    { pattern: /\bcommercial street\b/i, score: 3, phrase: "commercial street" },
    { pattern: /\b(?:merchants?|market|retail|general goods|grocery goods)\b/i, score: 2, phrase: "trade and shops" },
    { pattern: /\b(?:shops?|food products?|agricultural produce|lunar new year|chinese new year)\b/i, score: 1, phrase: "goods sold here" },
  ],
  goodsMovement: [
    { pattern: /\b(?:river trade|transported goods|brought goods|imported (?:foreign )?goods|imported through)\b/i, score: 3, phrase: "movement of goods" },
    { pattern: /\b(?:cargo|shipping|warehouse|distribution|wharves?|carrying .{0,50}(?:sugar|goods|cargo))\b/i, score: 2.5, phrase: "cargo and distribution" },
    { pattern: /\b(?:transporting|supplied by|imported|carrying)\b/i, score: 1.5, phrase: "goods transport" },
  ],
  transportation: [
    { pattern: /\b(?:railway|railroad|rail line|transcontinental railroad)\b/i, score: 3, phrase: "rail infrastructure" },
    { pattern: /\b(?:caltrain|train station)\b/i, score: 3, phrase: "rail station" },
    { pattern: /\b(?:airport|airfield|metro station|railway station)\b/i, score: 3, phrase: "transport hub" },
    { pattern: /\b(?:bridge|station|port|harbou?r|roadway|route)\b/i, score: 2.5, phrase: "transport infrastructure" },
    { pattern: /\b(?:traffic|pedestrians?|walking distance|accessible by bus)\b/i, score: 1, phrase: "movement and access" },
  ],
  adaptiveReuse: [
    { pattern: /\b(?:converted into|reused as|adapted (?:for|as)|changed from .{0,60} to)\b/i, score: 3, phrase: "adaptive reuse" },
    { pattern: /\b(?:became|established).{0,50}\bmuseum\b/i, score: 2.5, phrase: "change of use" },
  ],
  preservation: [
    { pattern: /\b(?:only surviving|last remaining|sole surviving)\b/i, score: 3, phrase: "only surviving structure" },
    { pattern: /\b(?:preserved|saved|remaining|listed on the national register)\b/i, score: 2.5, phrase: "preservation" },
    { pattern: /\b(?:demolished|razed|removed).{0,70}(?:houses?|homes?|residences?|buildings?)\b/i, score: 2, phrase: "surrounding buildings removed" },
  ],
  residentialHistory: [
    { pattern: /\b(?:private residence|residential district|family home|private mansions?)\b/i, score: 3, phrase: "private residential use" },
    { pattern: /\b(?:victorian mansions?|mansion|estate|villa)\b/i, score: 2.5, phrase: "historic residence" },
    { pattern: /\b(?:home|house|residences?)\b/i, score: 1, phrase: "residential use" },
  ],
  museumConversion: [
    { pattern: /\b(?:became|established as|converted into).{0,45}(?:city(?:'s)? first )?museum\b/i, score: 3, phrase: "conversion to a museum" },
    { pattern: /\bfirst museum\b/i, score: 3, phrase: "first museum" },
    { pattern: /\b(?:museum occupied|independent museum)\b/i, score: 2, phrase: "museum use" },
  ],
  architecture: [
    { pattern: /\b(?:victorian|italianate|gothic|modernist|art deco|brutalist)\b/i, score: 3, phrase: "architectural style" },
    { pattern: /\b(?:architecture|architectural|cantilever bridge|suspension bridge)\b/i, score: 2.5, phrase: "built form" },
    { pattern: /\b(?:facade|façade|structural|building form)\b/i, score: 1.5, phrase: "building form" },
  ],
  material: [
    { pattern: /\b(?:reinforced concrete|precast concrete|rammed earth|stone masonry)\b/i, score: 3, phrase: "construction material" },
    { pattern: /\b(?:brick|concrete|timber|wooden|steel|iron|masonry|adobe|tilework)\b/i, score: 2.5, phrase: "visible material" },
  ],
  terrain: [
    { pattern: /\b(?:california\s+)?coast ranges?\b/i, score: 3, phrase: "Coast Range terrain" },
    { pattern: /\b(?:mountain range|foothills?|hills?|valley|valleys|slope|terrain)\b/i, score: 3, phrase: "terrain" },
    { pattern: /\b(?:ridge|canyon|elevation)\b/i, score: 1.5, phrase: "landform" },
  ],
  geology: [
    { pattern: /\b(?:geology|geological|rock formation|ore deposit|mineralized area|franciscan assemblage)\b/i, score: 3, phrase: "geology" },
    { pattern: /\b(?:cinnabar|mercury ore|mineral deposits?|quicksilver)\b/i, score: 2.5, phrase: "mineral geology" },
    { pattern: /\b(?:rock|ore|mineral)\b/i, score: 1, phrase: "geological material" },
  ],
  water: [
    { pattern: /\b(?:shoreline|waterfront|coastline|bay shore|riverbank|riverfront)\b/i, score: 3, phrase: "water's edge" },
    { pattern: /\b(?:two|three|several|multiple)\s+rivers?\b/i, score: 3, phrase: "river system" },
    { pattern: /\b(?:river|creek|stream|estuary|tidal|ocean|lake)\b/i, score: 2, phrase: "waterway" },
    { pattern: /\b(?:harbou?r|breakwater|wharf)\b/i, score: 1.5, phrase: "working waterfront" },
  ],
  ecology: [
    { pattern: /\b(?:salt marsh|tidal marsh|marsh habitat|wet marshland|wetland ecology)\b/i, score: 3, phrase: "wetland ecology" },
    { pattern: /\b(?:habitat|ecology|ecological|wetland)\b/i, score: 2, phrase: "ecology" },
  ],
  industry: [
    { pattern: /\b(?:industrial settlement|manufacturing|smelter|extraction industry)\b/i, score: 3, phrase: "industrial activity" },
    { pattern: /\b(?:industrial|industry|factory|extraction)\b/i, score: 2, phrase: "industry" },
  ],
  mining: [
    { pattern: /\b(?:mercury mining|cinnabar mining|quicksilver mining|mining settlement)\b/i, score: 3, phrase: "mercury mining" },
    { pattern: /\b(?:mine|mines|mining|miner|miners|smelter|mercury|cinnabar|quicksilver)\b/i, score: 2, phrase: "mining" },
  ],
  publicSpace: [
    { pattern: /\b(?:public park|municipal park|public grounds|opened to the public)\b/i, score: 3, phrase: "public space" },
    { pattern: /\b(?:lakeside park|city park|park landscape)\b/i, score: 2.5, phrase: "park" },
    { pattern: /\b(?:street|plaza|courtyard|park)\b/i, score: 1, phrase: "shared public space" },
  ],
};

function placeAliases(placeName: string) {
  const aliases = new Set([placeName.toLocaleLowerCase()]);
  const lower = placeName.toLocaleLowerCase();

  if (lower.includes("house")) ["the house", "this house", "the home", "the mansion"].forEach((item) => aliases.add(item));
  if (lower.includes("street")) ["the street", "this street", "the commercial street"].forEach((item) => aliases.add(item));
  if (lower.includes("port")) ["the port", "this port", "the harbor"].forEach((item) => aliases.add(item));
  if (lower.includes("bridge")) ["the bridge", "this bridge", "the spans"].forEach((item) => aliases.add(item));
  if (/scenic area|park|reserve/.test(lower)) ["the scenic area", "the area", "the park"].forEach((item) => aliases.add(item));
  if (/almaden|mine/.test(lower)) ["new almaden", "the mines", "the mining district", "the community"].forEach((item) => aliases.add(item));

  return [...aliases];
}

function detectEntities(text: string, place: EvidencePlace) {
  const entities: EvidenceItem["introducedEntities"] = [];
  const lower = text.toLocaleLowerCase();

  if (lower.includes(place.placeName.toLocaleLowerCase())) {
    entities.push({ text: place.placeName, type: "currentPlace" });
  }

  const personMatches = text.match(/\b(?:Dr\.\s+)?[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];
  personMatches.forEach((name) => {
    if (!place.placeName.toLocaleLowerCase().includes(name.toLocaleLowerCase())) {
      entities.push({ text: name, type: "person" });
    }
  });

  const geographicMatches = text.match(/\b(?:Lake|Mount|River|Creek|Park|Range)\s+[A-Z][A-Za-z-]+(?:\s+[A-Z][A-Za-z-]+)?\b/g) || [];
  geographicMatches.forEach((name) => {
    entities.push({ text: name, type: "geographicFeature" });
  });

  return Array.from(new Map(entities.map((entity) => [`${entity.type}:${entity.text}`, entity])).values());
}

function competingSubject(text: string) {
  const personProperty = /\b(?:stone|brick|wooden|timber|concrete)?\s*(?:house|home|property|estate)\s+of\s+(?:Dr\.\s+)?[A-Z][a-z]+\s+[A-Z][a-z]+\b/i.test(text);
  const marshPerson = /\b(?:John\s+Marsh|Dr\.\s*John\s+Marsh|Marsh(?:'s|’s)\s+(?:house|home|family)|the\s+Marsh\s+family)\b/.test(text);
  const startsWithPerson = /^(?:Next to occupy[^.]* was |(?:Dr\.\s+)?[A-Z][a-z]+\s+[A-Z][a-z]+\s+(?:was|is|owned|built|made|became|served|donated)\b)/.test(text);
  const personPronoun = /^(?:He|She|His|Her)\b/.test(text);

  return personProperty || marshPerson || startsWithPerson || personPronoun;
}

function currentPlaceOwnership(
  place: EvidencePlace,
  item: EvidenceItem,
  previousOwned: boolean
) {
  const text = item.normalizedText;
  const lower = text.toLocaleLowerCase();
  const aliases = placeAliases(place.placeName);
  const explicitlyNamesPlace = lower.includes(place.placeName.toLocaleLowerCase());
  const beginsWithAlias = aliases.some((alias) => lower.startsWith(alias));
  const continuation = /^(?:it|its|this|these|the surrounding|the other|however,?\s+(?:it|the))/i.test(text);

  if (explicitlyNamesPlace) {
    return {
      refers: true,
      subject: place.placeName,
      type: "currentPlace" as EntityType,
    };
  }

  if (competingSubject(text)) {
    const subject = text.match(/(?:Dr\.\s+)?[A-Z][a-z]+\s+[A-Z][a-z]+/)?.[0] || null;
    return { refers: false, subject, type: "person" as EntityType };
  }

  if (beginsWithAlias || (previousOwned && continuation)) {
    return {
      refers: true,
      subject: beginsWithAlias ? aliases.find((alias) => lower.startsWith(alias)) || place.placeName : place.placeName,
      type: "currentPlace" as EntityType,
    };
  }

  if (item.source === "wikidata") {
    return { refers: true, subject: place.placeName, type: "currentPlace" as EntityType };
  }

  if (previousOwned && /\b(?:surrounding|nearby|there|the city|the government|today|later|in \d{4})\b/i.test(text)) {
    return { refers: true, subject: place.placeName, type: "currentPlace" as EntityType };
  }

  if (item.sentenceIndex === 0 && !competingSubject(text)) {
    return { refers: true, subject: place.placeName, type: "currentPlace" as EntityType };
  }

  return { refers: false, subject: null, type: "unknown" as EntityType };
}

function addThemeMatch(
  matches: Map<ObservationTheme, DetectedTheme>,
  theme: ObservationTheme,
  score: number,
  phrase: string,
  reason: string
) {
  const existing = matches.get(theme);
  if (existing) {
    existing.score += score;
    existing.reasons.push(reason);
    return;
  }

  matches.set(theme, {
    theme,
    score,
    matchedPhrase: phrase,
    reasons: [reason],
  });
}

export function resolveConcepts(item: EvidenceItem): DetectedTheme[] {
  if (!item.refersToCurrentPlace) return [];

  const text = item.normalizedText;
  const matches = new Map<ObservationTheme, DetectedTheme>();
  const isCoastRange = /\b(?:california\s+)?coast ranges?\b/i.test(text);
  const explicitWaterEdge = /\b(?:shoreline|waterfront|coastline|beach|tidal|estuary|bay shore)\b/i.test(text);

  Object.entries(CONCEPT_RULES).forEach(([themeValue, rules]) => {
    const theme = themeValue as ObservationTheme;
    if (theme === "water" && isCoastRange && !explicitWaterEdge && !/\b(?:river|creek|stream|lake|ocean|harbou?r)\b/i.test(text)) {
      return;
    }

    rules.forEach((rule) => {
      const match = text.match(rule.pattern);
      if (!match) return;
      addThemeMatch(matches, theme, rule.score, rule.phrase, `matched “${match[0]}”`);
    });
  });

  if (/\b(?:california\s+)?coast ranges?\b/i.test(text)) {
    addThemeMatch(matches, "terrain", 1, "Coast Range terrain", "phrase override: Coast Range");
    addThemeMatch(matches, "geology", 1, "Coast Range geology", "phrase override: Coast Range");
    if (!explicitWaterEdge) matches.delete("water");
  }

  if (item.sectionTitle && /\bgeolog(?:y|ical)\b/i.test(item.sectionTitle)) {
    addThemeMatch(matches, "geology", 3, "geology", "section context: Geology");
  }

  return [...matches.values()].filter((match) => match.score >= 1.5);
}

export function analyzeEvidence(place: EvidencePlace, evidence: EvidenceItem[]) {
  const previousOwnedBySource = new Map<string, boolean>();

  return evidence.map((item) => {
    const sourceKey = `${item.source}:${item.sourceLabel}`;
    const ownership = currentPlaceOwnership(
      place,
      item,
      previousOwnedBySource.get(sourceKey) || false
    );
    const analyzed: EvidenceItem = {
      ...item,
      subject: ownership.subject,
      subjectEntityType: ownership.type,
      mentionsCurrentPlace: item.normalizedText
        .toLocaleLowerCase()
        .includes(place.placeName.toLocaleLowerCase()),
      refersToCurrentPlace: ownership.refers,
      introducedEntities: detectEntities(item.normalizedText, place),
      detectedThemes: [],
    };
    analyzed.detectedThemes = resolveConcepts(analyzed);
    previousOwnedBySource.set(sourceKey, ownership.refers);
    return analyzed;
  });
}

export function classifyThemeScores(evidence: EvidenceItem[]): ThemeScore[] {
  const scores = new Map<ObservationTheme, ThemeScore>();

  evidence.forEach((item) => {
    if (!item.refersToCurrentPlace) return;
    item.detectedThemes.forEach((detected) => {
      const current = scores.get(detected.theme) || {
        theme: detected.theme,
        score: 0,
        evidenceIds: [],
        reasons: [],
      };
      current.score += detected.score;
      if (!current.evidenceIds.includes(item.id)) current.evidenceIds.push(item.id);
      current.reasons.push(...detected.reasons);
      scores.set(detected.theme, current);
    });
  });

  scores.forEach((score) => {
    if (score.evidenceIds.length > 1) score.score += Math.min(1.5, (score.evidenceIds.length - 1) * 0.5);
  });

  return [...scores.values()]
    .filter((score) => score.score >= 3)
    .sort((a, b) => b.score - a.score);
}
