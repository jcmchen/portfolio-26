import { NextResponse } from "next/server";
import type { FieldLocation } from "@/data/fieldNotes";
import {
  FIELD_NOTE_ALGORITHM_VERSION,
  FIELD_NOTE_ROTATION_DAYS,
  createFieldNoteFromEvidence,
  fieldNoteQuestionsMatch,
  fieldNoteCachePolicy,
  fetchWikipediaEvidence,
  hasUsableFetchedEvidence,
  isPreferredDailyCandidate,
  selectFirstEvidenceBackedCandidate,
  type CandidateRejectionReason,
  type EvidenceFetchReport,
  type EvidencePlace,
  type FieldNotePromptMeta,
  type ThemeScore,
} from "@/lib/field-notes";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type WikiMember = {
  pageid: number;
  title: string;
};

type WikiCategoryResponse = {
  query?: { categorymembers?: WikiMember[] };
};

type WikiGeoSearchResponse = {
  query?: { geosearch?: Array<WikiMember & { lat: number; lon: number; dist: number }> };
};

type WikiPage = {
  pageid: number;
  title: string;
  pageimage?: string;
  pageprops?: { wikibase_item?: string };
  thumbnail?: { source: string };
  coordinates?: Array<{ lat: number; lon: number }>;
};

type WikiPageResponse = {
  query?: { pages?: Record<string, WikiPage> };
};

type RegionSeed = { name: string; lat: number; lon: number };

type RegionConfig = {
  categories: string[];
  seeds: RegionSeed[];
};

type WikiFieldLocation = FieldLocation & {
  wikiPageId: number;
  wikiTitle: string;
  wikidataId?: string;
};

type TemporaryUnavailable = {
  status: "temporary-unavailable";
  region: FieldLocation["region"];
  message: "Today’s local field note is temporarily unavailable.";
  reason: CandidateRejectionReason;
  retryAfterSeconds: number;
};

type FieldNoteCacheState =
  | { status: "success"; cacheClass: "daily" }
  | {
      status: "temporary-failure";
      cacheClass: "short";
      retryAfterSeconds: number;
      reason: CandidateRejectionReason;
    };

type DailyFieldNotesResponse = {
  status: "success" | "partial" | "temporary-unavailable";
  date: string;
  generatedAt: string;
  refresh: "daily" | "short-retry";
  source: string;
  cacheVersion: string;
  cacheState: FieldNoteCacheState;
  taiwan: FieldLocation | null;
  sfBay: FieldLocation | null;
  unavailable: TemporaryUnavailable[];
};

type RegionResolution =
  | { ok: true; location: FieldLocation }
  | { ok: false; unavailable: TemporaryUnavailable };

const SHORT_RETRY_SECONDS = 600;
const MAX_EVIDENCE_CANDIDATES = 24;
const CACHE_VERSION = `daily-place-reading-${FIELD_NOTE_ALGORITHM_VERSION}-v2`;
let dailyCache: DailyFieldNotesResponse | undefined;
let shortCache: { expiresAt: number; response: DailyFieldNotesResponse } | undefined;

const REGION_CONFIG = {
  Taiwan: {
    categories: [
      "Tourist attractions in Taiwan",
      "National scenic areas of Taiwan",
      "National parks of Taiwan",
      "Museums in Taiwan",
      "Parks in Taiwan",
      "Temples in Taiwan",
      "Beaches of Taiwan",
      "Historic sites in Taiwan",
    ],
    seeds: [
      { name: "Taipei", lat: 25.0375, lon: 121.5637 },
      { name: "Tainan", lat: 22.9999, lon: 120.2269 },
      { name: "Hualien", lat: 23.9911, lon: 121.6112 },
      { name: "Kaohsiung", lat: 22.6273, lon: 120.3014 },
      { name: "Taichung", lat: 24.1477, lon: 120.6736 },
    ],
  },
  "SF Bay Area": {
    categories: [
      "Tourist attractions in the San Francisco Bay Area",
      "Parks in the San Francisco Bay Area",
      "Museums in the San Francisco Bay Area",
      "Beaches of the San Francisco Bay Area",
      "Bridges in the San Francisco Bay Area",
      "Historic sites in the San Francisco Bay Area",
      "Sonoma County, California",
    ],
    seeds: [
      { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
      { name: "Oakland", lat: 37.8044, lon: -122.2712 },
      { name: "Berkeley", lat: 37.8715, lon: -122.273 },
      { name: "San Jose", lat: 37.3382, lon: -121.8863 },
      { name: "Marin", lat: 37.9735, lon: -122.5311 },
      { name: "Palo Alto", lat: 37.4419, lon: -122.143 },
    ],
  },
} satisfies Record<FieldLocation["region"], RegionConfig>;

const dateKey = () => new Date().toISOString().slice(0, 10);

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function selectDaily<T>(items: T[], key: string) {
  const day = Math.floor(Date.now() / 86400000);
  return items[(day + hashString(key)) % items.length];
}

function rotateDaily<T>(items: T[], key: string) {
  if (!items.length) return [];
  const selected = selectDaily(items, key);
  const index = items.indexOf(selected);
  return [...items.slice(index), ...items.slice(0, index)];
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatCoordinates(lat?: number, lon?: number) {
  if (lat === undefined || lon === undefined) return "coordinate pending";
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}${ns} / ${Math.abs(lon).toFixed(3)}${ew}`;
}

function isLikelyPlace(member: WikiMember) {
  const title = member.title.toLocaleLowerCase();
  return !(
    /^(?:list of|\d{4}\b)/i.test(member.title) ||
    /\b(?:association|foundation|society|organization|organisation|institute|bureau|department|ministry|agency|company|corporation|council|committee|club|office|festival|event|award|competition|university|college|school|casino|hotel|area codes?|attacks?|explosions?|administration)\b/i.test(title)
  );
}

function isLikelyPlaceImage(filename?: string) {
  if (!filename) return true;
  return !/\b(?:map|logo|seal|flag|coat[ _-]of[ _-]arms|diagram|icon|route|location)\b/i.test(
    filename
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: 86400 },
    headers: { "User-Agent": "jcmchen.com daily place reading contact: portfolio" },
  });
  if (!response.ok) throw new Error(`Wikipedia candidate request failed: ${response.status}`);
  return (await response.json()) as T;
}

async function fetchCategoryMembers(category: string) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "categorymembers",
    cmtitle: `Category:${category}`,
    cmtype: "page",
    cmlimit: "80",
  });
  const data = await fetchJson<WikiCategoryResponse>(
    `https://en.wikipedia.org/w/api.php?${params}`
  );
  return (data.query?.categorymembers || []).filter(isLikelyPlace);
}

async function fetchCategoryPool(categories: string[]) {
  const settled = await Promise.allSettled(categories.map(fetchCategoryMembers));
  const failures = settled.filter((result) => result.status === "rejected");
  if (failures.length) {
    console.warn({
      event: "local-field-note-candidate-pool-partial-failure",
      source: "wikipedia-categories",
      failureCount: failures.length,
    });
  }
  return Array.from(
    new Map(
      settled
        .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
        .map((member) => [member.pageid, member])
    ).values()
  );
}

async function fetchNearbyMembers(seed: RegionSeed) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "geosearch",
    gscoord: `${seed.lat}|${seed.lon}`,
    gsradius: "10000",
    gslimit: "60",
    gsnamespace: "0",
  });
  const data = await fetchJson<WikiGeoSearchResponse>(
    `https://en.wikipedia.org/w/api.php?${params}`
  );
  return (data.query?.geosearch || []).filter(isLikelyPlace);
}

async function fetchGeoPool(region: FieldLocation["region"]) {
  const seeds = rotateDaily(
    REGION_CONFIG[region].seeds,
    `${region}-${dateKey()}-seed`
  ).slice(0, 2);
  const settled = await Promise.allSettled(seeds.map(fetchNearbyMembers));
  return Array.from(
    new Map(
      settled
        .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
        .map((member) => [member.pageid, member])
    ).values()
  );
}

function interleaveMembers(first: WikiMember[], second: WikiMember[]) {
  const merged: WikiMember[] = [];
  const length = Math.max(first.length, second.length);
  for (let index = 0; index < length; index += 1) {
    if (first[index]) merged.push(first[index]);
    if (second[index]) merged.push(second[index]);
  }
  return Array.from(new Map(merged.map((member) => [member.pageid, member])).values());
}

function wikiPageToFieldLocation(
  page: WikiPage,
  member: WikiMember | undefined,
  region: FieldLocation["region"]
): WikiFieldLocation {
  const imageUrl = page.thumbnail?.source;
  const coordinates = page.coordinates?.[0];
  const placeName = page.title || member?.title || "Wikipedia field note";
  return {
    id: `${region === "Taiwan" ? "tw" : "sf"}-${slugify(placeName)}`,
    wikiPageId: page.pageid,
    wikiTitle: placeName,
    wikidataId: page.pageprops?.wikibase_item,
    region,
    place: placeName,
    prompt: "",
    coordinates: formatCoordinates(coordinates?.lat, coordinates?.lon),
    imageUrl,
    imageAlt: imageUrl ? placeName : undefined,
    source: `Wikipedia / ${region}`,
    url: `https://en.wikipedia.org/?curid=${page.pageid}`,
  };
}

async function fetchWikiPages(members: WikiMember[], region: FieldLocation["region"]) {
  if (!members.length) return [];
  const memberById = new Map(members.map((member) => [member.pageid, member]));
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "pageimages|coordinates|pageprops",
    pageids: members.map((member) => member.pageid).join("|"),
    piprop: "thumbnail|name",
    pithumbsize: "900",
    colimit: "max",
    ppprop: "wikibase_item",
  });
  const data = await fetchJson<WikiPageResponse>(
    `https://en.wikipedia.org/w/api.php?${params}`
  );
  const pages = Object.values(data.query?.pages || {}).filter(
    (page) =>
      page.thumbnail?.source &&
      page.coordinates?.[0] &&
      isLikelyPlaceImage(page.pageimage)
  );
  const byId = new Map(
    pages.map((page) => [
      page.pageid,
      wikiPageToFieldLocation(page, memberById.get(page.pageid), region),
    ])
  );
  return members
    .map((member) => byId.get(member.pageid))
    .filter((place): place is WikiFieldLocation => Boolean(place));
}

async function fetchWikiPageByTitle(
  rawTitle: string,
  region: FieldLocation["region"]
): Promise<WikiFieldLocation | null> {
  const title = rawTitle.replace(/_/g, " ").trim().slice(0, 160);
  if (!title) return null;

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    redirects: "1",
    prop: "pageimages|coordinates|pageprops",
    titles: title,
    piprop: "thumbnail|name",
    pithumbsize: "900",
    colimit: "max",
    ppprop: "wikibase_item",
  });
  const data = await fetchJson<WikiPageResponse>(
    `https://en.wikipedia.org/w/api.php?${params}`
  );
  const page = Object.values(data.query?.pages || {}).find(
    (candidate) => candidate.pageid > 0
  );

  return page ? wikiPageToFieldLocation(page, undefined, region) : null;
}

function evidencePlace(place: WikiFieldLocation): EvidencePlace {
  return {
    placeId: place.id,
    pageId: place.wikiPageId,
    placeName: place.wikiTitle,
    wikidataId: place.wikidataId,
  };
}

function rejectionReasonForFetch(report: EvidenceFetchReport): CandidateRejectionReason {
  const details = Object.values(report);
  return details.every((item) => item.status !== "success")
    ? "EVIDENCE_FETCH_FAILED"
    : "INSUFFICIENT_EVIDENCE";
}

function fetchWasRateLimited(report: EvidenceFetchReport) {
  return Object.values(report).some((item) => item.httpStatus === 429);
}

function candidateTitlePriority(place: WikiFieldLocation) {
  const title = place.place.toLocaleLowerCase();
  if (/\b(?:river|creek|bridge|port|harbou?r|market|commercial street|mine|mining|quarry|wetland|marsh|station|airport|terminal|house|mansion)\b/.test(title)) return 6;
  if (/\b(?:beach|bay|lake|mountain|mount|hill|valley|canyon|scenic area)\b/.test(title)) return 5;
  if (/\b(?:park|garden|museum|church|cathedral|temple|lighthouse|civic center|library|landmark)\b/.test(title)) return 4;
  return 1;
}

function candidateFamily(place: WikiFieldLocation) {
  const title = place.place.toLocaleLowerCase();
  if (/\b(?:river|creek|bay|beach|lake|wetland|marsh|waterfront|wharf)\b/.test(title)) return "water-ecology";
  if (/\b(?:station|airport|terminal|bridge|port|harbou?r)\b/.test(title)) return "transportation";
  if (/\b(?:market|commercial street|shopping district)\b/.test(title)) return "commerce";
  if (/\b(?:house|mansion|residence|villa)\b/.test(title)) return "residential";
  if (/\b(?:mine|mining|quarry|mountain|mount|hill|valley|canyon|scenic area)\b/.test(title)) return "terrain-industry";
  if (/\b(?:park|garden|plaza)\b/.test(title)) return "public-space";
  if (/\b(?:museum|church|cathedral|temple|lighthouse|civic center|library|landmark)\b/.test(title)) return "institutional";
  return "other";
}

function stratifyCandidates(places: WikiFieldLocation[], key: string) {
  const ranked = places.map((place, index) => ({
    place,
    index,
    priority:
      candidateTitlePriority(place) +
      (isPreferredDailyCandidate(place.wikiPageId) ? 10 : 0),
    family: candidateFamily(place),
  }));
  const ordered: WikiFieldLocation[] = [];
  const priorities = Array.from(new Set(ranked.map((item) => item.priority))).sort(
    (a, b) => b - a
  );

  priorities.forEach((priority) => {
    const atPriority = ranked.filter((item) => item.priority === priority);
    const families = rotateDaily(
      Array.from(new Set(atPriority.map((item) => item.family))),
      `${key}-${priority}-families`
    );
    const byFamily = new Map(
      families.map((family) => [
        family,
        atPriority
          .filter((item) => item.family === family)
          .sort((a, b) => a.index - b.index)
          .map((item) => item.place),
      ])
    );

    while (families.some((family) => (byFamily.get(family)?.length || 0) > 0)) {
      families.forEach((family) => {
        const next = byFamily.get(family)?.shift();
        if (next) ordered.push(next);
      });
    }
  });

  return ordered;
}

function logCandidateRejected(input: {
  place: WikiFieldLocation;
  reason: CandidateRejectionReason;
  fetchReport: EvidenceFetchReport;
  themeScores?: ThemeScore[];
  evidenceCount?: number;
  ownedEvidenceCount?: number;
  selectedFrameType?: string;
  details?: string;
}) {
  console.warn({
    event: "local-field-note-candidate-rejected",
    placeId: input.place.id,
    placeName: input.place.place,
    reason: input.reason,
    fetchReport: input.fetchReport,
    themeScores: (input.themeScores || []).map((score) => ({
      theme: score.theme,
      score: score.score,
      evidenceCount: score.evidenceIds.length,
    })),
    evidenceCount: input.evidenceCount || 0,
    ownedEvidenceCount: input.ownedEvidenceCount || 0,
    selectedFrameType: input.selectedFrameType,
    generatorMode: process.env.FIELD_NOTE_GENERATOR || "hybrid",
    details: input.details,
  });
}

function unavailable(
  region: FieldLocation["region"],
  reason: CandidateRejectionReason
): TemporaryUnavailable {
  return {
    status: "temporary-unavailable",
    region,
    message: "Today’s local field note is temporarily unavailable.",
    reason,
    retryAfterSeconds: SHORT_RETRY_SECONDS,
  };
}

async function resolveRegion(
  region: FieldLocation["region"],
  overrideTitle?: string,
  excludedQuestions: string[] = []
): Promise<RegionResolution> {
  let candidates: WikiFieldLocation[];

  if (overrideTitle) {
    try {
      const overridePlace = await fetchWikiPageByTitle(overrideTitle, region);
      candidates = overridePlace ? [overridePlace] : [];
    } catch (error) {
      console.warn({
        event: "local-field-note-development-override-failed",
        region,
        title: overrideTitle,
        error: error instanceof Error ? error.message : "Unknown override error",
      });
      candidates = [];
    }
  } else {
    const categories = rotateDaily(
      REGION_CONFIG[region].categories,
      `${region}-category`
    ).slice(0, 4);
    const [categoryResult, geoResult] = await Promise.allSettled([
      fetchCategoryPool(categories),
      fetchGeoPool(region),
    ]);
    const categoryMembers = categoryResult.status === "fulfilled" ? categoryResult.value : [];
    const geoMembers = geoResult.status === "fulfilled" ? geoResult.value : [];
    const members = rotateDaily(
      interleaveMembers(categoryMembers, geoMembers),
      `${region}-${dateKey()}-candidate`
    );

    if (!members.length) {
      return { ok: false, unavailable: unavailable(region, "EVIDENCE_FETCH_FAILED") };
    }

    const batches: WikiMember[][] = [];
    for (let index = 0; index < Math.min(members.length, 150); index += 50) {
      batches.push(members.slice(index, index + 50));
    }
    const settledPages = await Promise.allSettled(
      batches.map((batch) => fetchWikiPages(batch, region))
    );
    const resolvedPlaces = settledPages.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );
    candidates = stratifyCandidates(
      rotateDaily(resolvedPlaces, `${region}-${dateKey()}-resolved-place`),
      `${region}-${dateKey()}-${FIELD_NOTE_ROTATION_DAYS}-day-candidate-order`
    )
      .slice(0, MAX_EVIDENCE_CANDIDATES);
  }

  if (!candidates.length) {
    return { ok: false, unavailable: unavailable(region, "EVIDENCE_FETCH_FAILED") };
  }
  const selection = await selectFirstEvidenceBackedCandidate(candidates, async (place) => {
    const fetched = await fetchWikipediaEvidence(evidencePlace(place));
    if (!hasUsableFetchedEvidence(fetched)) {
      const reason = rejectionReasonForFetch(fetched.report);
      logCandidateRejected({ place, reason, fetchReport: fetched.report });
      return {
        ok: false as const,
        reason,
        terminal: fetchWasRateLimited(fetched.report),
      };
    }

    const pipeline = await createFieldNoteFromEvidence(
      evidencePlace(place),
      fetched.sources,
      { excludedQuestions }
    );
    if (!pipeline.ok) {
      logCandidateRejected({
        place,
        reason: pipeline.reason,
        fetchReport: fetched.report,
        themeScores: pipeline.themeScores,
        evidenceCount: pipeline.evidence.length,
        ownedEvidenceCount: pipeline.evidence.filter((item) => item.refersToCurrentPlace).length,
        selectedFrameType: pipeline.frame?.frameType,
        details: pipeline.details,
      });
      return { ok: false as const, reason: pipeline.reason };
    }

    const selectedEvidence = pipeline.evidence.filter((item) =>
      pipeline.frame.evidenceIds.includes(item.id)
    );
    const promptMeta: FieldNotePromptMeta = {
      algorithmVersion: FIELD_NOTE_ALGORITHM_VERSION,
      generator: pipeline.generated.generator,
      templateId: pipeline.generated.templateId,
      operator: pipeline.generated.operator,
      primaryTheme: pipeline.frame.primaryTheme,
      secondaryThemes: pipeline.frame.secondaryThemes,
      confidence: pipeline.frame.confidence,
      frameType: pipeline.frame.frameType,
      evidence: selectedEvidence.slice(0, 5).map((item) => ({
        id: item.id,
        source: item.sourceLabel,
        text: item.normalizedText.slice(0, 320),
        revision: item.revision,
      })),
      observableClues: pipeline.generated.observableClues,
      topics: pipeline.frame.topicContext?.map((topic) => ({
        topicId: topic.topicId,
        keywords: topic.keywords,
        weight: topic.weight,
      })),
      fetchReport: fetched.report,
    };
    const {
      wikiPageId: _wikiPageId,
      wikiTitle: _wikiTitle,
      wikidataId: _wikidataId,
      ...fieldLocation
    } = place;
    const location: FieldLocation = {
      ...fieldLocation,
      prompt: pipeline.generated.question,
      promptMeta,
    };

    console.info({
      event: "local-field-note-candidate-accepted",
      placeId: place.id,
      placeName: place.place,
      primaryTheme: pipeline.frame.primaryTheme,
      secondaryThemes: pipeline.frame.secondaryThemes,
      confidence: pipeline.frame.confidence,
      frameType: pipeline.frame.frameType,
      templateId: pipeline.generated.templateId,
      evidenceIds: pipeline.generated.evidenceIds,
      topics: pipeline.frame.topicContext?.map((topic) => ({
        topicId: topic.topicId,
        keywords: topic.keywords,
        weight: topic.weight,
      })),
    });
    return { ok: true as const, value: location };
  });

  return selection.ok
    ? { ok: true, location: selection.value }
    : { ok: false, unavailable: unavailable(region, selection.reason) };
}

function secondsUntilNextUtcDay() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(60, Math.ceil((next - now.getTime()) / 1000));
}

function jsonResponse(response: DailyFieldNotesResponse, developmentOverride = false) {
  const policy = fieldNoteCachePolicy(
    response.status,
    secondsUntilNextUtcDay(),
    SHORT_RETRY_SECONDS
  );
  return NextResponse.json(response, {
    status: policy.httpStatus,
    headers: {
      "Cache-Control": developmentOverride ? "no-store" : policy.cacheControl,
      ...(developmentOverride
        ? { "X-Field-Note-Override": "development" }
        : {}),
      ...(policy.retryAfter ? { "Retry-After": policy.retryAfter } : {}),
    },
  });
}

function readDevelopmentOverrides(request: Request) {
  if (process.env.NODE_ENV === "production") return {};

  const searchParams = new URL(request.url).searchParams;
  const readTitle = (key: string) => {
    const value = searchParams.get(key)?.trim();
    return value ? value.slice(0, 160) : undefined;
  };

  return {
    taiwan: readTitle("tw"),
    sfBay: readTitle("sf"),
  };
}

export async function GET(request: Request) {
  const overrides = readDevelopmentOverrides(request);
  const hasDevelopmentOverride = Boolean(overrides.taiwan || overrides.sfBay);

  if (
    !hasDevelopmentOverride &&
    dailyCache?.date === dateKey() &&
    dailyCache.cacheVersion === CACHE_VERSION
  ) {
    return jsonResponse(dailyCache);
  }
  if (!hasDevelopmentOverride && shortCache && shortCache.expiresAt > Date.now()) {
    return jsonResponse(shortCache.response);
  }

  const [taiwanResult, initialSfResult] = await Promise.all([
    resolveRegion("Taiwan", overrides.taiwan),
    resolveRegion("SF Bay Area", overrides.sfBay),
  ]);
  let sfResult = initialSfResult;
  if (
    taiwanResult.ok &&
    sfResult.ok &&
    fieldNoteQuestionsMatch(
      taiwanResult.location.prompt,
      sfResult.location.prompt
    )
  ) {
    const diversified = await resolveRegion(
      "SF Bay Area",
      overrides.sfBay,
      [taiwanResult.location.prompt]
    );
    if (diversified.ok) {
      sfResult = diversified;
    } else {
      console.warn({
        event: "local-field-note-duplicate-prompt-retained",
        prompt: taiwanResult.location.prompt,
        reason: diversified.unavailable.reason,
      });
    }
  }
  const taiwan = taiwanResult.ok ? taiwanResult.location : null;
  const sfBay = sfResult.ok ? sfResult.location : null;
  const unavailableRegions = [taiwanResult, sfResult].flatMap((result) =>
    result.ok ? [] : [result.unavailable]
  );
  const status = taiwan && sfBay ? "success" : taiwan || sfBay ? "partial" : "temporary-unavailable";
  const failureReason = unavailableRegions[0]?.reason || "INSUFFICIENT_EVIDENCE";
  const response: DailyFieldNotesResponse = {
    status,
    date: dateKey(),
    generatedAt: new Date().toISOString(),
    refresh: status === "success" ? "daily" : "short-retry",
    source: "Wikipedia Action API + Wikidata",
    cacheVersion: CACHE_VERSION,
    cacheState:
      status === "success"
        ? { status: "success", cacheClass: "daily" }
        : {
            status: "temporary-failure",
            cacheClass: "short",
            retryAfterSeconds: SHORT_RETRY_SECONDS,
            reason: failureReason,
          },
    taiwan,
    sfBay,
    unavailable: unavailableRegions,
  };

  if (!hasDevelopmentOverride) {
    if (status === "success") {
      dailyCache = response;
      shortCache = undefined;
    } else {
      shortCache = { expiresAt: Date.now() + SHORT_RETRY_SECONDS * 1000, response };
    }
  }

  return jsonResponse(response, hasDevelopmentOverride);
}
