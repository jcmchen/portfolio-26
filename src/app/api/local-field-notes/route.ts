import { NextResponse } from "next/server";
import { type FieldLocation } from "@/data/fieldNotes";

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

type WikiPage = {
  pageid: number;
  title: string;
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
    text?: {
      "*": string;
    };
  };
};

type RegionConfig = {
  categories: string[];
  prompt: string;
};

type DailyFieldNotesResponse = {
  date: string;
  refresh: string;
  source: string;
  cacheVersion: string;
  taiwan: FieldLocation;
  sfBay: FieldLocation;
};

const CACHE_VERSION = "field-notes-wiki-batched-v1";
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
    prompt:
      "Read the site through climate, infrastructure, material repair, movement, and everyday thresholds.",
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
    prompt:
      "Read the site through terrain, microclimate, movement systems, civic infrastructure, and informal edges.",
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
    .replaceAll("&gt;", ">");
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

function wikiPageToFieldLocation(
  page: WikiPage,
  member: WikiMember | undefined,
  region: FieldLocation["region"]
): FieldLocation {
  const imageUrl = page.thumbnail?.source;
  const coordinates = page.coordinates?.[0];

  return {
    id: `${region === "Taiwan" ? "tw" : "sf"}-${slugify(page.title || member?.title || String(page.pageid))}`,
    region,
    place: page.title || member?.title || "Wikipedia field note",
    prompt: REGION_CONFIG[region].prompt,
    coordinates: formatCoordinates(coordinates?.lat, coordinates?.lon),
    imageUrl,
    imageAlt: imageUrl ? page.title : undefined,
    source: `Wikipedia / ${region === "Taiwan" ? "Taiwan" : "SF Bay Area"}`,
    url: `https://en.wikipedia.org/?curid=${page.pageid}`,
  } satisfies FieldLocation;
}

async function fetchWikiPages(members: WikiMember[], region: FieldLocation["region"]) {
  const memberById = new Map(members.map((member) => [member.pageid, member]));
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "pageimages|coordinates",
    pageids: members.map((member) => member.pageid).join("|"),
    piprop: "thumbnail",
    pithumbsize: "900",
    colimit: "max",
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate },
    headers: {
      "User-Agent": "jcmchen.com field notes contact: portfolio",
    },
  });

  if (!response.ok) throw new Error(`Wikipedia page failed: ${response.status}`);

  const data = (await response.json().catch(() => ({}))) as WikiPageResponse;
  const pages = Object.values(data.query?.pages ?? {});
  const byPageId = new Map(
    pages.map((page) => [
      page.pageid,
      wikiPageToFieldLocation(page, memberById.get(page.pageid), region),
    ])
  );

  return members
    .map((member) => byPageId.get(member.pageid))
    .filter((place): place is FieldLocation => Boolean(place));
}

async function fetchWikiPage(member: WikiMember, region: FieldLocation["region"]) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "pageimages|coordinates",
    pageids: String(member.pageid),
    piprop: "thumbnail",
    pithumbsize: "900",
    colimit: "1",
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
    region,
    place: page.title || member.title,
    prompt: REGION_CONFIG[region].prompt,
    coordinates: formatCoordinates(coordinates?.lat, coordinates?.lon),
    imageUrl,
    imageAlt: imageUrl ? page.title : undefined,
    source: `Wikipedia / ${region === "Taiwan" ? "Taiwan" : "SF Bay Area"}`,
    url: `https://en.wikipedia.org/?curid=${page.pageid}`,
  } satisfies FieldLocation;
}

function hasResolvedWikiDetail(place: FieldLocation) {
  return place.coordinates !== "coordinate pending" && Boolean(place.imageUrl);
}

async function resolveRegion(region: FieldLocation["region"]) {
  const categories = rotateDaily(REGION_CONFIG[region].categories, `${region}-category`).slice(0, 4);
  const members = rotateDaily(await fetchCategoryPool(categories), region);
  if (!members.length) {
    throw new Error(`Wikipedia category pool is empty for ${region}`);
  }

  for (let index = 0; index < Math.min(members.length, 150); index += 50) {
    const batchedPlaces = await fetchWikiPages(members.slice(index, index + 50), region).catch(
      () => []
    );
    const resolvedPlace = batchedPlaces.find(hasResolvedWikiDetail);
    if (resolvedPlace) return resolvedPlace;
  }

  for (const member of members.slice(0, 12)) {
    const place = await fetchWikiPage(member, region).catch(() => undefined);
    if (place && hasResolvedWikiDetail(place)) return place;
  }

  throw new Error(`Wikipedia pages with image and coordinates could not be resolved for ${region}`);
}

export async function GET() {
  if (dailyCache?.date === dateKey() && dailyCache.cacheVersion === CACHE_VERSION) {
    return NextResponse.json(dailyCache);
  }

  const [taiwan, sfBay] = await Promise.all([
    resolveRegion("Taiwan"),
    resolveRegion("SF Bay Area"),
  ]);

  dailyCache = {
    date: dateKey(),
    refresh: "daily",
    source: "Wikipedia category pool",
    cacheVersion: CACHE_VERSION,
    taiwan,
    sfBay,
  };

  return NextResponse.json(dailyCache);
}
