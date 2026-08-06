import type {
  DocumentTopic,
  EvidenceItem,
  EvidencePlace,
  ObservationFrame,
  ThemeScore,
} from "../types";

const STOP_WORDS = new Set([
  "about", "after", "again", "against", "also", "among", "another", "around",
  "because", "before", "being", "between", "both", "during", "each", "from",
  "have", "having", "into", "itself", "more", "most", "other", "over", "same",
  "some", "such", "than", "that", "their", "there", "these", "they", "this",
  "through", "under", "very", "were", "where", "which", "while", "with", "within",
  "would", "area", "located", "place", "site", "known", "called", "part", "include",
  "includes", "including", "consists", "comprises", "contain", "contains", "contained",
  "support", "supports", "supported", "provide", "provides", "provided", "lead", "leads",
  "beside", "near", "along", "across", "several", "many", "form", "forms", "made",
  "city", "county", "district",
  "taiwan", "california", "united", "states",
]);

type SentenceVector = {
  item: EvidenceItem;
  vector: Map<string, number>;
  surfaces: Map<string, Map<string, number>>;
};

function stem(token: string) {
  if (token.length > 6 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 6 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 5 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

function excludedPlaceTerms(place: EvidencePlace) {
  return new Set(
    place.placeName
      .toLocaleLowerCase()
      .match(/[a-z][a-z'-]{2,}/g)
      ?.map(stem) || []
  );
}

function sentenceTerms(text: string, excluded: Set<string>) {
  const terms: string[] = [];
  const surfaces = new Map<string, Map<string, number>>();
  for (const surface of text.toLocaleLowerCase().match(/[a-z][a-z'-]{2,}/g) || []) {
    if (STOP_WORDS.has(surface)) continue;
    const term = stem(surface);
    if (term.length < 3 || STOP_WORDS.has(term) || excluded.has(term)) continue;
    terms.push(term);
    const variants = surfaces.get(term) || new Map<string, number>();
    variants.set(surface, (variants.get(surface) || 0) + 1);
    surfaces.set(term, variants);
  }
  return { terms, surfaces };
}

function cosine(first: Map<string, number>, second: Map<string, number>) {
  let dot = 0;
  let firstNorm = 0;
  let secondNorm = 0;
  first.forEach((value, term) => {
    dot += value * (second.get(term) || 0);
    firstNorm += value * value;
  });
  second.forEach((value) => {
    secondNorm += value * value;
  });
  return firstNorm && secondNorm
    ? dot / Math.sqrt(firstNorm * secondNorm)
    : 0;
}

function centroid(vectors: SentenceVector[]) {
  const result = new Map<string, number>();
  vectors.forEach(({ vector }) => {
    vector.forEach((value, term) => {
      result.set(term, (result.get(term) || 0) + value / vectors.length);
    });
  });
  return result;
}

function vectorRichness(vector: Map<string, number>) {
  return [...vector.values()].reduce((total, value) => total + value, 0);
}

function initialSeeds(vectors: SentenceVector[], count: number) {
  const seeds: SentenceVector[] = [];
  const first = [...vectors].sort(
    (a, b) =>
      vectorRichness(b.vector) - vectorRichness(a.vector) ||
      a.item.id.localeCompare(b.item.id)
  )[0];
  if (!first) return seeds;
  seeds.push(first);

  while (seeds.length < count) {
    const next = vectors
      .filter((candidate) => !seeds.includes(candidate))
      .map((candidate) => ({
        candidate,
        distance: 1 - Math.max(...seeds.map((seed) => cosine(candidate.vector, seed.vector))),
      }))
      .sort(
        (a, b) =>
          b.distance - a.distance ||
          vectorRichness(b.candidate.vector) - vectorRichness(a.candidate.vector) ||
          a.candidate.item.id.localeCompare(b.candidate.item.id)
      )[0]?.candidate;
    if (!next) break;
    seeds.push(next);
  }
  return seeds;
}

function clusterVectors(vectors: SentenceVector[]) {
  const clusterCount = Math.min(4, Math.max(1, Math.round(Math.sqrt(vectors.length))));
  let centers = initialSeeds(vectors, clusterCount).map((seed) => seed.vector);
  let groups: SentenceVector[][] = [];

  for (let iteration = 0; iteration < 6; iteration += 1) {
    groups = Array.from({ length: centers.length }, () => [] as SentenceVector[]);
    vectors.forEach((vector) => {
      const best = centers
        .map((center, index) => ({ index, similarity: cosine(vector.vector, center) }))
        .sort((a, b) => b.similarity - a.similarity || a.index - b.index)[0];
      groups[best?.index || 0].push(vector);
    });
    groups = groups.filter((group) => group.length > 0);
    centers = groups.map(centroid);
  }
  return groups;
}

function averageCoherence(vectors: SentenceVector[]) {
  if (vectors.length === 1) return 0.25;
  let total = 0;
  let pairs = 0;
  for (let first = 0; first < vectors.length; first += 1) {
    for (let second = first + 1; second < vectors.length; second += 1) {
      total += cosine(vectors[first].vector, vectors[second].vector);
      pairs += 1;
    }
  }
  return pairs ? total / pairs : 0;
}

function readableKeyword(term: string, vectors: SentenceVector[]) {
  const variants = new Map<string, number>();
  vectors.forEach(({ surfaces }) => {
    surfaces.get(term)?.forEach((count, surface) => {
      variants.set(surface, (variants.get(surface) || 0) + count);
    });
  });
  return [...variants.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].length - b[0].length || a[0].localeCompare(b[0])
  )[0]?.[0] || term;
}

function clusterThemeWeights(vectors: SentenceVector[]) {
  const scores = new Map<string, number>();
  vectors.forEach(({ item }) => {
    item.detectedThemes.forEach((detected) => {
      scores.set(detected.theme, (scores.get(detected.theme) || 0) + detected.score);
    });
  });
  const total = [...scores.values()].reduce((sum, score) => sum + score, 0) || 1;
  return [...scores.entries()]
    .map(([theme, score]) => ({
      theme: theme as DocumentTopic["themeWeights"][number]["theme"],
      score: Number((score / total).toFixed(3)),
    }))
    .sort((a, b) => b.score - a.score);
}

export function modelDocumentTopics(
  place: EvidencePlace,
  evidence: EvidenceItem[]
): DocumentTopic[] {
  const owned = evidence.filter(
    (item) => item.refersToCurrentPlace && item.normalizedText.length >= 30
  );
  if (!owned.length) return [];

  const excluded = excludedPlaceTerms(place);
  const tokenized = owned.map((item) => ({ item, ...sentenceTerms(item.normalizedText, excluded) }));
  const documentFrequency = new Map<string, number>();
  tokenized.forEach(({ terms }) => {
    new Set(terms).forEach((term) => {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    });
  });

  const vectors: SentenceVector[] = tokenized
    .map(({ item, terms, surfaces }) => {
      const counts = new Map<string, number>();
      terms.forEach((term) => counts.set(term, (counts.get(term) || 0) + 1));
      const vector = new Map<string, number>();
      counts.forEach((count, term) => {
        const idf = Math.log((1 + owned.length) / (1 + (documentFrequency.get(term) || 0))) + 1;
        vector.set(term, (count / Math.max(1, terms.length)) * idf);
      });
      return { item, vector, surfaces };
    })
    .filter(({ vector }) => vector.size >= 2);
  if (!vectors.length) return [];

  const rawTopics = clusterVectors(vectors).map((group) => {
    const center = centroid(group);
    const coherence = averageCoherence(group);
    const keywords = [...center.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([term]) => readableKeyword(term, group));
    const coverage = group.length / vectors.length;
    const lexicalStrength = Math.min(1, vectorRichness(center) * 4);
    return {
      keywords,
      evidenceIds: group.map(({ item }) => item.id),
      coherence: Number(coherence.toFixed(3)),
      rawWeight: coverage * 0.6 + coherence * 0.25 + lexicalStrength * 0.15,
      themeWeights: clusterThemeWeights(group),
    };
  });
  const totalWeight = rawTopics.reduce((total, topic) => total + topic.rawWeight, 0) || 1;

  return rawTopics
    .sort(
      (a, b) =>
        b.rawWeight - a.rawWeight ||
        b.evidenceIds.length - a.evidenceIds.length ||
        a.keywords.join(" ").localeCompare(b.keywords.join(" "))
    )
    .map((topic, index) => ({
      id: `topic-${index + 1}`,
      keywords: topic.keywords,
      evidenceIds: topic.evidenceIds,
      weight: Number((topic.rawWeight / totalWeight).toFixed(3)),
      coherence: topic.coherence,
      themeWeights: topic.themeWeights,
    }));
}

export function rerankThemeScoresWithTopics(
  scores: ThemeScore[],
  topics: DocumentTopic[]
) {
  return scores
    .map((score) => {
      const topicSupport = topics.reduce((total, topic) => {
        const themeWeight = topic.themeWeights.find(
          (item) => item.theme === score.theme
        )?.score || 0;
        const evidenceOverlap = topic.evidenceIds.filter((id) =>
          score.evidenceIds.includes(id)
        ).length / Math.max(1, topic.evidenceIds.length);
        return total + topic.weight * themeWeight * evidenceOverlap;
      }, 0);
      const bonus = Math.min(1.5, topicSupport * 3);
      return bonus > 0
        ? {
            ...score,
            score: Number((score.score + bonus).toFixed(3)),
            reasons: [...score.reasons, `document topic support: ${topicSupport.toFixed(3)}`],
          }
        : score;
    })
    .sort((a, b) => b.score - a.score);
}

export function attachTopicContext(
  frame: ObservationFrame,
  topics: DocumentTopic[]
): ObservationFrame {
  const relevant = topics
    .map((topic) => ({
      topic,
      overlap: topic.evidenceIds.filter((id) => frame.evidenceIds.includes(id)).length,
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.topic.weight - a.topic.weight)
    .slice(0, 2)
    .map(({ topic }) => ({
      topicId: topic.id,
      keywords: topic.keywords,
      weight: topic.weight,
      evidenceIds: topic.evidenceIds,
    }));
  return relevant.length ? { ...frame, topicContext: relevant } : frame;
}
