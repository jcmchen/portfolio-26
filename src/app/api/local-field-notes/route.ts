import { NextResponse } from "next/server";
import { type FieldLocation } from "@/data/fieldNotes";
import {
  FIELD_NOTE_ALGORITHM_VERSION,
  generateFieldNotePrompt,
  type PromptSource,
} from "@/lib/fieldNotePrompt";

export const revalidate = 86400;
export const dynamic = "force-dynamic";

type WikiMember = {
  pageid: number;
  title: string;
};

type WikiCategoryResponse = {
  query?: {
    categorymembers?: WikiMember[];
  };
};

type WikiGeoSearchResponse = {
  query?: {
    geosearch?: Array<WikiMember & { lat: number; lon: number; dist: number }>;
  };
};

type WikiPage = {
  pageid: number;
  title: string;
  pageimage?: string;
  pageprops?: {
    wikibase_item?: string;
  };
  thumbnail?: {
    source: string;
  };
  coordinates?: Array<{
    lat: number;
    lon: number;
  }>;
};

type WikiPageResponse = {
  query?: {
    pages?: Record<string, WikiPage>;
  };
};

type WikiParseResponse = {
  parse?: {
    revid?: number;
    sections?: Array<{
      index: string;
      line: string;
    }>;
    text?: {
      "*": string;
    };
  };
};

type PageSummaryResponse = {
  title?: string;
  extract?: string;
  description?: string;
  revision?: string | number;
};

type WikidataEntity = {
  claims?: Record<
    string,
    Array<{
      mainsnak?: {
        datavalue?: {
          value?: string | { id?: string; time?: string };
        };
      };
    }>
  >;
  labels?: Record<string, { value?: string }>;
};

type WikidataResponse = {
  entities?: Record<string, WikidataEntity>;
};

type RegionSeed = {
  name: string;
  lat: number;
  lon: number;
};

type RegionConfig = {
  categories: string[];
  seeds: RegionSeed[];
  prompt: string;
};

type DailyFieldNotesResponse = {
  date: string;
  generatedAt: string;
  refresh: string;
  source: string;
  cacheVersion: string;
  taiwan: FieldLocation;
  sfBay: FieldLocation;
};

type WikiFieldLocation = FieldLocation & {
  wikiPageId: number;
  wikiTitle: string;
  wikidataId?: string;
};

const CACHE_VERSION = `daily-place-reading-${FIELD_NOTE_ALGORITHM_VERSION}-v1`;
let dailyCache: DailyFieldNotesResponse | undefined;

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
    prompt:
      "How has climate shaped the way this place is used and changed?",
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
    prompt:
      "How has the landscape shaped the way people move through this place?",
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
    .toLowerCase()
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
  const title = member.title.toLowerCase();

  return ![
    " association",
    " foundation",
    " society",
    " organization",
    " organisation",
    " institute",
    " bureau",
    " department",
    " ministry",
    " agency",
    " company",
    " corporation",
    " council",
    " committee",
    " club",
    " festival",
    " event",
    " award",
    " competition",
    " list of ",
  ].some((term) => title.includes(term));
}

function isLikelyPlaceImage(filename?: string) {
  if (!filename) return true;

  return !/\b(?:map|logo|seal|flag|coat[ _-]of[ _-]arms|diagram|icon|route|location)\b/i.test(
    filename
  );
}

function normalizeWikiImageUrl(src?: string) {
  if (!src) return undefined;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return `https://en.wikipedia.org${src}`;
  return undefined;
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function stripHtml(value: string) {
  return decodeHtml(
    value
      .replace(/<(?:script|style|table|figure|sup)[^>]*>[\s\S]*?<\/(?:script|style|table|figure|sup)>/gi, " ")
      .replace(/<br\s*\/?>/gi, ". ")
      .replace(/<\/p>|<\/li>|<\/h[1-6]>/gi, ". ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\[\s*edit\s*\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractInfoboxImage(html?: string) {
  if (!html) return undefined;

  const infobox = html.match(/<table[^>]*class="[^"]*\binfobox\b[^"]*"[\s\S]*?<\/table>/i)?.[0];
  const source = infobox ?? html;
  const imageSrc =
    source.match(/<img[^>]+(?:src|data-src)="([^"]+)"/i)?.[1] ??
    source.match(/<img[^>]+srcset="([^"]+)"/i)?.[1]?.split(/\s+/)[0];

  return normalizeWikiImageUrl(imageSrc ? decodeHtml(imageSrc) : undefined);
}

function extractGeoCoordinates(html?: string) {
  if (!html) return undefined;

  const geoText = html.match(/<span[^>]*class="[^"]*\bgeo\b[^"]*"[^>]*>([^<]+)<\/span>/i)?.[1];
  if (!geoText) return undefined;

  const [lat, lon] = decodeHtml(geoText)
    .split(";")
    .map((value) => Number.parseFloat(value.trim()));

  if (Number.isNaN(lat) || Number.isNaN(lon)) return undefined;
  return { lat, lon };
}

async function fetchParsedPage(member: WikiMember) {
  const params = new URLSearchParams({
    action: "parse",
    format: "json",
    pageid: String(member.pageid),
    prop: "text",
    disableeditsection: "1",
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });

  if (!response.ok) return {};

  const data = (await response.json().catch(() => ({}))) as WikiParseResponse;
  const html = data.parse?.text?.["*"];

  return {
    imageUrl: extractInfoboxImage(html),
    coordinates: extractGeoCoordinates(html),
  };
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

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });

  if (!response.ok) return [];

  const data = (await response.json().catch(() => ({}))) as WikiCategoryResponse;
  return (data.query?.categorymembers ?? []).filter(isLikelyPlace);
}

async function fetchCategoryPool(categories: string[]) {
  const members: WikiMember[] = [];

  for (const category of categories) {
    members.push(...(await fetchCategoryMembers(category).catch(() => [])));
  }

  return Array.from(new Map(members.map((member) => [member.pageid, member])).values());
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
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });

  if (!response.ok) return [];
  const data = (await response.json().catch(() => ({}))) as WikiGeoSearchResponse;
  return (data.query?.geosearch || []).filter(isLikelyPlace);
}

async function fetchGeoPool(region: FieldLocation["region"]) {
  const seeds = rotateDaily(REGION_CONFIG[region].seeds, `${region}-${dateKey()}-seed`).slice(0, 2);
  const groups = await Promise.all(seeds.map((seed) => fetchNearbyMembers(seed).catch(() => [])));

  return Array.from(
    new Map(groups.flat().map((member) => [member.pageid, member])).values()
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

  return {
    id: `${region === "Taiwan" ? "tw" : "sf"}-${slugify(page.title || member?.title || String(page.pageid))}`,
    wikiPageId: page.pageid,
    wikiTitle: page.title,
    wikidataId: page.pageprops?.wikibase_item,
    region,
    place: page.title || member?.title || "Wikipedia field note",
    prompt: REGION_CONFIG[region].prompt,
    coordinates: formatCoordinates(coordinates?.lat, coordinates?.lon),
    imageUrl,
    imageAlt: imageUrl ? page.title : undefined,
    source: `Wikipedia / ${region === "Taiwan" ? "Taiwan" : "SF Bay Area"}`,
    url: `https://en.wikipedia.org/?curid=${page.pageid}`,
  } satisfies WikiFieldLocation;
}

async function fetchPageSummary(place: WikiFieldLocation): Promise<PromptSource | undefined> {
  const title = encodeURIComponent(place.wikiTitle.replaceAll(" ", "_"));
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
    next: { revalidate },
    headers: {
      Accept: "application/json",
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });

  if (!response.ok) return undefined;

  const data = (await response.json().catch(() => ({}))) as PageSummaryResponse;
  const text = [data.description, data.extract].filter(Boolean).join(". ");
  if (!text) return undefined;

  return {
    id: `summary-${place.wikiPageId}`,
    label: `${place.wikiTitle} summary`,
    text,
    kind: "summary",
    revision: data.revision ? Number(data.revision) : undefined,
  };
}

const SECTION_PRIORITIES: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /\b(?:architecture|design|construction|structure|buildings?)\b/i, score: 5 },
  { pattern: /\b(?:geography|geology|environment|ecology|climate|landscape)\b/i, score: 5 },
  { pattern: /\b(?:history|origins?|development)\b/i, score: 4.5 },
  { pattern: /\b(?:culture|community|society|religion|traditions?)\b/i, score: 4 },
  { pattern: /\b(?:infrastructure|transport|economy|industry|land use)\b/i, score: 3.5 },
];

function sectionScore(title: string) {
  return SECTION_PRIORITIES.reduce(
    (best, item) => (item.pattern.test(title) ? Math.max(best, item.score) : best),
    0
  );
}

async function fetchSectionIndex(place: WikiFieldLocation) {
  const params = new URLSearchParams({
    action: "parse",
    format: "json",
    pageid: String(place.wikiPageId),
    prop: "sections|revid",
  });
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });

  if (!response.ok) return undefined;
  const data = (await response.json().catch(() => ({}))) as WikiParseResponse;
  return data.parse;
}

async function fetchSectionSource(
  place: WikiFieldLocation,
  section: { index: string; line: string },
  revision?: number
): Promise<PromptSource | undefined> {
  const params = new URLSearchParams({
    action: "parse",
    format: "json",
    pageid: String(place.wikiPageId),
    section: section.index,
    prop: "text",
    disableeditsection: "1",
  });
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });

  if (!response.ok) return undefined;
  const data = (await response.json().catch(() => ({}))) as WikiParseResponse;
  const text = stripHtml(data.parse?.text?.["*"] || "").slice(0, 7000);
  if (!text) return undefined;

  return {
    id: `section-${place.wikiPageId}-${section.index}`,
    label: `${place.wikiTitle} · ${decodeHtml(section.line)}`,
    text,
    kind: "section",
    revision,
  };
}

async function fetchRelevantSections(place: WikiFieldLocation) {
  const parsed = await fetchSectionIndex(place).catch(() => undefined);
  const sections = (parsed?.sections || [])
    .map((section) => ({ ...section, score: sectionScore(decodeHtml(section.line)) }))
    .filter((section) => section.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const sources = await Promise.all(
    sections.map((section) => fetchSectionSource(place, section, parsed?.revid))
  );

  return sources.filter((source): source is PromptSource => Boolean(source));
}

const WIKIDATA_PROPERTIES: Record<
  string,
  { label: string; sentence: (values: string[]) => string }
> = {
  P31: {
    label: "instance of",
    sentence: (values) => `The place is identified as ${values.join(" and ")}.`,
  },
  P186: {
    label: "material used",
    sentence: (values) => `Materials used at the place include ${values.join(" and ")}.`,
  },
  P571: {
    label: "inception",
    sentence: (values) => `The place was established in ${values.join(" and ")}.`,
  },
  P149: {
    label: "architectural style",
    sentence: (values) => `Its architecture is associated with ${values.join(" and ")}.`,
  },
  P84: {
    label: "architect",
    sentence: (values) => `The architecture is attributed to ${values.join(" and ")}.`,
  },
  P1435: {
    label: "heritage designation",
    sentence: (values) => `The place has ${values.join(" and ")} heritage designation.`,
  },
  P706: {
    label: "terrain feature",
    sentence: (values) => `The place is located on the ${values.join(" and ")} terrain feature.`,
  },
};

function wikidataRawValue(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;

  const item = value as { id?: string; time?: string };
  if (item.id) return item.id;
  if (item.time) return item.time.match(/[+-](\d{4})/)?.[1];
  return undefined;
}

async function fetchWikidataSources(place: WikiFieldLocation): Promise<PromptSource[]> {
  if (!place.wikidataId) return [];

  const entityParams = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: place.wikidataId,
    props: "claims",
  });
  const entityResponse = await fetch(`https://www.wikidata.org/w/api.php?${entityParams}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });
  if (!entityResponse.ok) return [];

  const entityData = (await entityResponse.json().catch(() => ({}))) as WikidataResponse;
  const claims = entityData.entities?.[place.wikidataId]?.claims || {};
  const valuesByProperty = new Map<string, string[]>();
  const entityIds = new Set<string>();

  Object.keys(WIKIDATA_PROPERTIES).forEach((property) => {
    const values = (claims[property] || [])
      .slice(0, 3)
      .map((claim) => wikidataRawValue(claim.mainsnak?.datavalue?.value))
      .filter((value): value is string => Boolean(value));

    values.forEach((value) => {
      if (/^Q\d+$/.test(value)) entityIds.add(value);
    });
    if (values.length) valuesByProperty.set(property, values);
  });

  let labels = new Map<string, string>();
  if (entityIds.size) {
    const labelParams = new URLSearchParams({
      action: "wbgetentities",
      format: "json",
      ids: Array.from(entityIds).join("|"),
      props: "labels",
      languages: "en",
      languagefallback: "1",
    });
    const labelResponse = await fetch(`https://www.wikidata.org/w/api.php?${labelParams}`, {
      next: { revalidate },
      headers: {
        "User-Agent": "jcmchen.com field notes contact: portfolio",
      },
    });

    if (labelResponse.ok) {
      const labelData = (await labelResponse.json().catch(() => ({}))) as WikidataResponse;
      labels = new Map(
        Object.entries(labelData.entities || {}).map(([id, entity]) => [
          id,
          entity.labels?.en?.value || id,
        ])
      );
    }
  }

  const facts = Array.from(valuesByProperty.entries()).map(([property, values]) => {
    const readableValues = values.map((value) => labels.get(value) || value);
    return WIKIDATA_PROPERTIES[property].sentence(readableValues);
  });

  if (!facts.length) return [];

  return [
    {
      id: `wikidata-${place.wikidataId}`,
      label: `${place.wikidataId} Wikidata statements`,
      text: facts.join(" "),
      kind: "wikidata",
    },
  ];
}

async function buildPromptForPlace(place: WikiFieldLocation, fallback: string) {
  const [summary, sections, wikidata] = await Promise.all([
    fetchPageSummary(place).catch(() => undefined),
    fetchRelevantSections(place).catch(() => []),
    fetchWikidataSources(place).catch(() => []),
  ]);
  const sources = [...(summary ? [summary] : []), ...sections, ...wikidata];

  return generateFieldNotePrompt({ sources, fallback, place: place.wikiTitle });
}

async function fetchWikiPages(members: WikiMember[], region: FieldLocation["region"]) {
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

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });

  if (!response.ok) throw new Error(`Wikipedia page failed: ${response.status}`);

  const data = (await response.json().catch(() => ({}))) as WikiPageResponse;
  const pages = Object.values(data.query?.pages ?? {}).filter((page) =>
    isLikelyPlaceImage(page.pageimage)
  );
  const byPageId = new Map(
    pages.map((page) => [
      page.pageid,
      wikiPageToFieldLocation(page, memberById.get(page.pageid), region),
    ])
  );

  return members
    .map((member) => byPageId.get(member.pageid))
    .filter((place): place is WikiFieldLocation => Boolean(place));
}

async function fetchWikiPage(member: WikiMember, region: FieldLocation["region"]) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "pageimages|coordinates|pageprops",
    pageids: String(member.pageid),
    piprop: "thumbnail|name",
    pithumbsize: "900",
    colimit: "1",
    ppprop: "wikibase_item",
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });

  if (!response.ok) throw new Error(`Wikipedia page failed: ${response.status}`);

  const data = (await response.json().catch(() => ({}))) as WikiPageResponse;
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page) throw new Error("Wikipedia page missing");
  const parsed =
    page.thumbnail?.source && page.coordinates?.[0]
      ? undefined
      : await fetchParsedPage(member).catch(() => undefined);
  const coordinates = page.coordinates?.[0] ?? parsed?.coordinates;
  const imageUrl = page.thumbnail?.source ?? parsed?.imageUrl;

  return {
    id: `${region === "Taiwan" ? "tw" : "sf"}-${slugify(page.title)}`,
    wikiPageId: page.pageid,
    wikiTitle: page.title,
    wikidataId: page.pageprops?.wikibase_item,
    region,
    place: page.title || member.title,
    prompt: REGION_CONFIG[region].prompt,
    coordinates: formatCoordinates(coordinates?.lat, coordinates?.lon),
    imageUrl,
    imageAlt: imageUrl ? page.title : undefined,
    source: `Wikipedia / ${region === "Taiwan" ? "Taiwan" : "SF Bay Area"}`,
    url: `https://en.wikipedia.org/?curid=${page.pageid}`,
  } satisfies WikiFieldLocation;
}

function hasResolvedWikiDetail(place: FieldLocation) {
  return place.coordinates !== "coordinate pending" && Boolean(place.imageUrl);
}

async function resolveRegion(region: FieldLocation["region"]) {
  const categories = rotateDaily(REGION_CONFIG[region].categories, `${region}-category`).slice(0, 4);
  const [categoryMembers, geoMembers] = await Promise.all([
    fetchCategoryPool(categories).catch(() => []),
    fetchGeoPool(region).catch(() => []),
  ]);
  const members = rotateDaily(
    interleaveMembers(geoMembers, categoryMembers),
    `${region}-${dateKey()}-candidate`
  );
  if (!members.length) {
    throw new Error(`Wikipedia category pool is empty for ${region}`);
  }

  const resolvedPlaces: WikiFieldLocation[] = [];

  for (let index = 0; index < Math.min(members.length, 150); index += 50) {
    const batchedPlaces = await fetchWikiPages(members.slice(index, index + 50), region).catch(
      () => []
    );
    resolvedPlaces.push(...batchedPlaces.filter(hasResolvedWikiDetail));
  }

  if (resolvedPlaces.length) {
    const selected = selectDaily(resolvedPlaces, `${region}-${dateKey()}-resolved-place`);
    const generated = await buildPromptForPlace(selected, REGION_CONFIG[region].prompt);
    const {
      wikiPageId: _wikiPageId,
      wikiTitle: _wikiTitle,
      wikidataId: _wikidataId,
      ...place
    } = selected;

    return {
      ...place,
      prompt: generated.prompt,
      promptMeta: generated.meta,
    } satisfies FieldLocation;
  }

  for (const member of members.slice(0, 12)) {
    const place = await fetchWikiPage(member, region).catch(() => undefined);
    if (place && hasResolvedWikiDetail(place)) {
      const generated = await buildPromptForPlace(place, REGION_CONFIG[region].prompt);
      const {
        wikiPageId: _wikiPageId,
        wikiTitle: _wikiTitle,
        wikidataId: _wikidataId,
        ...fieldLocation
      } = place;
      return {
        ...fieldLocation,
        prompt: generated.prompt,
        promptMeta: generated.meta,
      } satisfies FieldLocation;
    }
  }

  throw new Error(`Wikipedia pages with image and coordinates could not be resolved for ${region}`);
}

function secondsUntilNextUtcDay() {
  const now = new Date();
  const nextUtcDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );

  return Math.max(60, Math.ceil((nextUtcDay - now.getTime()) / 1000));
}

function jsonResponse(data: DailyFieldNotesResponse) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${secondsUntilNextUtcDay()}, stale-while-revalidate=86400`,
    },
  });
}

function avoidRepeatedPrompt(location: FieldLocation, existingPrompt: string) {
  if (location.prompt.trim().toLowerCase() !== existingPrompt.trim().toLowerCase()) {
    return location;
  }

  const evidence = location.promptMeta?.evidence || [];
  const regenerated = generateFieldNotePrompt({
    place: location.place,
    fallback: REGION_CONFIG[location.region].prompt,
    avoidPrompts: [existingPrompt],
    sources: evidence.map((item, index) => ({
      id: `distinct-${location.id}-${index}`,
      label: item.source,
      text: item.text,
      kind: "summary",
      revision: item.revision,
    })),
  });

  return {
    ...location,
    prompt: regenerated.prompt,
    promptMeta: regenerated.meta,
  } satisfies FieldLocation;
}

export async function GET() {
  if (dailyCache?.date === dateKey() && dailyCache.cacheVersion === CACHE_VERSION) {
    return jsonResponse(dailyCache);
  }

  const [taiwan, initialSfBay] = await Promise.all([
    resolveRegion("Taiwan"),
    resolveRegion("SF Bay Area"),
  ]);
  const sfBay = avoidRepeatedPrompt(initialSfBay, taiwan.prompt);

  dailyCache = {
    date: dateKey(),
    generatedAt: new Date().toISOString(),
    refresh: "daily",
    source: "Wikipedia geosearch + category pool + Wikidata",
    cacheVersion: CACHE_VERSION,
    taiwan,
    sfBay,
  };

  return jsonResponse(dailyCache);
}
