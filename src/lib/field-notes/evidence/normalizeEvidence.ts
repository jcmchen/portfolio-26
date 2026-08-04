import type { EvidenceItem, EvidencePlace, RawEvidenceSource } from "../types";

const LANGUAGE_METADATA_PATTERNS = [
  /\((?:[^()]*(?:traditional|simplified)\s+Chinese|[^()]*pinyin)[^()]*\)/gi,
  /\b(?:traditional|simplified)\s+Chinese(?:\s+characters?)?\s*:?/gi,
  /\b(?:Chinese|pinyin)\s*:\s*[^).;]+[).;]?/gi,
  /\bpronunciation\s*:\s*[^.;]+[.;]?/gi,
];

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_match: string, code: string) =>
      String.fromCharCode(Number(code))
    );
}

export function stripEvidenceHtml(value: string) {
  return decodeHtml(
    value
      .replace(/<(?:script|style|table|figure|sup|nav)[^>]*>[\s\S]*?<\/(?:script|style|table|figure|sup|nav)>/gi, " ")
      .replace(/<br\s*\/?>/gi, ". ")
      .replace(/<\/p>|<\/li>|<\/h[1-6]>/gi, ". ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\[\s*edit\s*\]/gi, " ")
    .replace(/\[(?:\d+|citation needed)\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEvidenceText(value: string) {
  let normalized = stripEvidenceHtml(value);

  LANGUAGE_METADATA_PATTERNS.forEach((pattern) => {
    normalized = normalized.replace(pattern, " ");
  });

  return normalized
    .replace(/\bcoordinates?\s*:\s*[-+\d°′″., /NSEW]+/gi, " ")
    .replace(/\b(?:jump to content|toggle the table of contents|from Wikipedia, the free encyclopedia)\b/gi, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitEvidenceSentences(value: string) {
  return (value.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length >= 20 && sentence.length <= 560);
}

export function normalizeEvidenceSources(
  place: EvidencePlace,
  sources: RawEvidenceSource[]
): EvidenceItem[] {
  return sources.flatMap((source) => {
    const original = stripEvidenceHtml(source.text);
    const normalized = normalizeEvidenceText(source.text);
    const originalSentences = splitEvidenceSentences(original);
    const normalizedSentences = splitEvidenceSentences(normalized);

    return normalizedSentences.map((normalizedText, sentenceIndex) => ({
      id: `${source.id}-sentence-${sentenceIndex}`,
      source: source.source,
      sourceLabel: source.label,
      text: originalSentences[sentenceIndex] || normalizedText,
      normalizedText,
      sectionTitle: source.sectionTitle,
      revision: source.revision,
      sentenceIndex,
      subject: null,
      subjectEntityType: "unknown" as const,
      mentionsCurrentPlace: normalizedText
        .toLocaleLowerCase()
        .includes(place.placeName.toLocaleLowerCase()),
      refersToCurrentPlace: false,
      introducedEntities: [],
      detectedThemes: [],
    }));
  });
}
