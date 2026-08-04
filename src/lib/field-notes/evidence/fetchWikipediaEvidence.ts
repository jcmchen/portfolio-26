import { stripEvidenceHtml } from "./normalizeEvidence";
import type {
  EvidenceFetchDetail,
  EvidenceFetchResult,
  EvidencePlace,
  FetchResult,
  RawEvidenceSource,
} from "../types";

const REQUEST_TIMEOUT_MS = 8_000;
const USER_AGENT = "jcmchen.com daily place reading contact: portfolio";

type WikiParsedArticleResponse = {
  parse?: {
    revid?: number;
    text?: { "*"?: string };
    tocdata?: {
      sections?: Array<{
        tocLevel: number;
        index: string;
        line: string;
      }>;
    };
  };
};

type WikidataEntity = {
  claims?: Record<
    string,
    Array<{
      mainsnak?: {
        datavalue?: { value?: string | { id?: string; time?: string } };
      };
    }>
  >;
  labels?: Record<string, { value?: string }>;
};

type WikidataResponse = {
  entities?: Record<string, WikidataEntity>;
};

async function fetchJson<T>(url: string): Promise<FetchResult<T>> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
      });

      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 450));
          continue;
        }
        return {
          ok: false,
          data: null,
          status: "http-error",
          httpStatus: response.status,
          error: `HTTP ${response.status}`,
        };
      }

      try {
        return {
          ok: true,
          data: (await response.json()) as T,
          status: "success",
          httpStatus: response.status,
        };
      } catch (error) {
        return {
          ok: false,
          data: null,
          status: "parse-error",
          httpStatus: response.status,
          error: error instanceof Error ? error.message : "Invalid JSON response",
        };
      }
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      return {
        ok: false,
        data: null,
        status: timedOut ? "timeout" : "http-error",
        error: error instanceof Error ? error.message : "Evidence request failed",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    ok: false,
    data: null,
    status: "http-error",
    error: "Evidence request exhausted its retry budget",
  };
}

function reportFromResult<T>(result: FetchResult<T>, itemCount = 0): EvidenceFetchDetail {
  if (result.ok) {
    return {
      status: itemCount > 0 ? "success" : "empty",
      httpStatus: result.httpStatus,
      itemCount,
    };
  }

  return {
    status: result.status,
    httpStatus: result.httpStatus,
    itemCount: 0,
    error: result.error,
  };
}

const SECTION_PRIORITIES: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /\b(?:architecture|design|construction|structure|buildings?)\b/i, score: 5 },
  { pattern: /\b(?:geography|geology|environment|ecology|climate|landscape)\b/i, score: 5 },
  { pattern: /\b(?:history|origins?|development|conversion|preservation)\b/i, score: 4.5 },
  { pattern: /\b(?:commerce|trade|economy|industry|mining|transport|infrastructure|land use)\b/i, score: 4.25 },
  { pattern: /\b(?:station layout|facilities|service|operations?|access)\b/i, score: 3.75 },
  { pattern: /\b(?:culture|community|society|religion|traditions?|seasonal activities)\b/i, score: 4 },
];

function sectionScore(title: string) {
  return SECTION_PRIORITIES.reduce(
    (best, item) => (item.pattern.test(title) ? Math.max(best, item.score) : best),
    0
  );
}

function splitParsedHtmlArticle(
  html: string,
  tocSections: Array<{ tocLevel: number; line: string }>
) {
  const headingPattern = /<h2\b[^>]*>[\s\S]*?<\/h2>/gi;
  const matches = [...html.matchAll(headingPattern)];
  const topLevelToc = tocSections.filter((section) => section.tocLevel === 1);
  const leadHtml = html.slice(0, matches[0]?.index ?? html.length);
  const leadParagraphs = [...leadHtml.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)]
    .map((match) => stripEvidenceHtml(match[0]))
    .filter(Boolean);
  const summary = leadParagraphs.join(" ");
  const sections = matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = matches[index + 1]?.index ?? html.length;
    return {
      title: topLevelToc[index]?.line || stripEvidenceHtml(match[0]),
      text: stripEvidenceHtml(html.slice(start, end)),
    };
  });

  return { summary, sections };
}

async function fetchArticleEvidence(place: EvidencePlace) {
  const params = new URLSearchParams({
    action: "parse",
    format: "json",
    pageid: String(place.pageId),
    prop: "text|tocdata|revid",
    disableeditsection: "1",
  });
  const result = await fetchJson<WikiParsedArticleResponse>(
    `https://en.wikipedia.org/w/api.php?${params}`
  );
  if (!result.ok) {
    const report = reportFromResult(result);
    return {
      sources: [] as RawEvidenceSource[],
      summaryReport: report,
      indexReport: report,
      contentReport: report,
      sectionsReport: report,
    };
  }

  const html = result.data.parse?.text?.["*"]?.trim();
  const tocSections = result.data.parse?.tocdata?.sections || [];
  if (!html) {
    const empty = { status: "empty", httpStatus: 200, itemCount: 0 } satisfies EvidenceFetchDetail;
    return {
      sources: [] as RawEvidenceSource[],
      summaryReport: empty,
      indexReport: empty,
      contentReport: empty,
      sectionsReport: empty,
    };
  }

  const article = splitParsedHtmlArticle(html, tocSections);
  const selectedSections = article.sections
    .map((section) => ({ ...section, score: sectionScore(section.title) }))
    .filter((section) => section.score > 0 && section.text)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const summarySources: RawEvidenceSource[] = article.summary
    ? [
        {
          id: `summary-${place.pageId}`,
          source: "wikipedia-summary",
          label: `${place.placeName} summary`,
          text: article.summary,
          revision: result.data.parse?.revid,
        },
      ]
    : [];
  const sectionSources: RawEvidenceSource[] = selectedSections.map((section, index) => ({
    id: `section-${place.pageId}-${index}`,
    source: "wikipedia-section",
    label: `${place.placeName} · ${section.title}`,
    text: section.text.slice(0, 9_000),
    sectionTitle: section.title,
    revision: result.data.parse?.revid,
  }));
  const indexReport: EvidenceFetchDetail = tocSections.length
    ? { status: "success", httpStatus: 200, itemCount: tocSections.length }
    : { status: "empty", httpStatus: 200, itemCount: 0 };
  const contentReport: EvidenceFetchDetail = sectionSources.length
    ? { status: "success", httpStatus: 200, itemCount: sectionSources.length }
    : { status: "empty", httpStatus: 200, itemCount: 0 };

  return {
    sources: [...summarySources, ...sectionSources],
    summaryReport: reportFromResult(result, summarySources.length),
    indexReport,
    contentReport,
    sectionsReport: contentReport,
  };
}

const WIKIDATA_PROPERTIES: Record<string, (values: string[]) => string> = {
  P31: (values) => `The place is identified as ${values.join(" and ")}.`,
  P186: (values) => `Materials used at the place include ${values.join(" and ")}.`,
  P571: (values) => `The place was established in ${values.join(" and ")}.`,
  P149: (values) => `Its architecture is associated with ${values.join(" and ")}.`,
  P1435: (values) => `The place has ${values.join(" and ")} heritage designation.`,
  P706: (values) => `The place is located on the ${values.join(" and ")} terrain feature.`,
};

function wikidataRawValue(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  const item = value as { id?: string; time?: string };
  if (item.id) return item.id;
  if (item.time) return item.time.match(/[+-](\d{4})/)?.[1];
  return undefined;
}

async function fetchWikidata(place: EvidencePlace) {
  if (!place.wikidataId) {
    return {
      sources: [] as RawEvidenceSource[],
      report: { status: "empty", itemCount: 0 } satisfies EvidenceFetchDetail,
    };
  }

  const params = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: place.wikidataId,
    props: "claims",
  });
  const entityResult = await fetchJson<WikidataResponse>(
    `https://www.wikidata.org/w/api.php?${params}`
  );
  if (!entityResult.ok) {
    return { sources: [] as RawEvidenceSource[], report: reportFromResult(entityResult) };
  }

  const claims = entityResult.data.entities?.[place.wikidataId]?.claims || {};
  const valuesByProperty = new Map<string, string[]>();
  const ids = new Set<string>();

  Object.keys(WIKIDATA_PROPERTIES).forEach((property) => {
    const values = (claims[property] || [])
      .slice(0, 3)
      .map((claim) => wikidataRawValue(claim.mainsnak?.datavalue?.value))
      .filter((value): value is string => Boolean(value));
    values.forEach((value) => {
      if (/^Q\d+$/.test(value)) ids.add(value);
    });
    if (values.length) valuesByProperty.set(property, values);
  });

  let labels = new Map<string, string>();
  let labelWarning: string | undefined;
  if (ids.size) {
    const labelParams = new URLSearchParams({
      action: "wbgetentities",
      format: "json",
      ids: [...ids].join("|"),
      props: "labels",
      languages: "en",
      languagefallback: "1",
    });
    const labelResult = await fetchJson<WikidataResponse>(
      `https://www.wikidata.org/w/api.php?${labelParams}`
    );
    if (labelResult.ok) {
      labels = new Map(
        Object.entries(labelResult.data.entities || {}).map(([id, entity]) => [
          id,
          entity.labels?.en?.value || id,
        ])
      );
    } else {
      labelWarning = `Wikidata label lookup failed: ${labelResult.status}${
        labelResult.httpStatus ? ` (${labelResult.httpStatus})` : ""
      }.`;
    }
  }

  const facts = [...valuesByProperty.entries()].flatMap(([property, values]) => {
    const readable = values
      .map((value) => labels.get(value) || (/^Q\d+$/.test(value) ? undefined : value))
      .filter((value): value is string => Boolean(value));
    return readable.length ? [WIKIDATA_PROPERTIES[property](readable)] : [];
  });

  const sources: RawEvidenceSource[] = facts.length
    ? [
        {
          id: `wikidata-${place.wikidataId}`,
          source: "wikidata",
          label: `${place.wikidataId} Wikidata statements`,
          text: facts.join(" "),
        },
      ]
    : [];

  const report = reportFromResult(entityResult, sources.length);
  return {
    sources,
    report: labelWarning ? { ...report, error: labelWarning } : report,
  };
}

export async function fetchWikipediaEvidence(
  place: EvidencePlace
): Promise<EvidenceFetchResult> {
  const article = await fetchArticleEvidence(place);
  const wikidata = article.sources.length
    ? {
        sources: [] as RawEvidenceSource[],
        report: {
          status: "not-requested" as const,
          itemCount: 0,
          error: "Article evidence was available; optional enrichment was skipped.",
        },
      }
    : await fetchWikidata(place);

  return {
    sources: [...article.sources, ...wikidata.sources],
    report: {
      summary: article.summaryReport,
      sectionIndex: article.indexReport,
      sectionContent: article.contentReport,
      sections: article.sectionsReport,
      wikidata: wikidata.report,
    },
  };
}

export function hasUsableFetchedEvidence(result: EvidenceFetchResult) {
  return result.sources.length > 0;
}
