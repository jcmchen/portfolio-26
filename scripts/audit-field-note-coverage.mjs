import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  FIELD_NOTE_ROTATION_DAYS,
  candidateRotationSlot,
  createFieldNoteFromEvidence,
  dailyRotationSlot,
} = require("../.field-note-test-build/src/lib/field-notes");

const configuredSample = Number(process.env.FIELD_NOTE_AUDIT_SAMPLE);
const SAMPLE_SIZE = Number.isFinite(configuredSample) && configuredSample > 0
  ? Math.max(5, configuredSample)
  : Number.POSITIVE_INFINITY;
const API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT = "jcmchen.com field-note coverage audit contact: portfolio";

const REGIONS = {
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
      [25.0375, 121.5637],
      [22.9999, 120.2269],
      [23.9911, 121.6112],
      [22.6273, 120.3014],
      [24.1477, 120.6736],
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
      [37.7749, -122.4194],
      [37.8044, -122.2712],
      [37.8715, -122.273],
      [37.3382, -121.8863],
      [37.9735, -122.5311],
      [37.4419, -122.143],
    ],
  },
};

async function fetchJson(params) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${API}?${new URLSearchParams(params)}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`Wikipedia HTTP ${response.status}`);
    }
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(retryAfter * 1000, 1000 * (attempt + 1)))
    );
  }
  throw new Error("Wikipedia request exhausted its retry budget");
}

function isLikelyPlace(title) {
  const lower = title.toLocaleLowerCase();
  return !(
    /^(?:list of|\d{4}\b)/i.test(title) ||
    /\b(?:association|foundation|society|organization|organisation|institute|bureau|department|ministry|agency|company|corporation|council|committee|club|office|festival|event|award|competition|university|college|school|casino|hotel|area codes?|attacks?|explosions?|administration)\b/i.test(lower)
  );
}

function isLikelyPlaceImage(filename = "") {
  return !/\b(?:map|logo|seal|flag|coat[ _-]of[ _-]arms|diagram|icon|route|location)\b/i.test(
    filename
  );
}

async function discoverMembers(config) {
  const collections = [];
  for (const category of config.categories) {
    try {
      const data = await fetchJson({
        action: "query",
        format: "json",
        list: "categorymembers",
        cmtitle: `Category:${category}`,
        cmtype: "page",
        cmlimit: "100",
      });
      collections.push(data.query?.categorymembers || []);
    } catch {
      collections.push([]);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  for (const [lat, lon] of config.seeds) {
    try {
      const data = await fetchJson({
        action: "query",
        format: "json",
        list: "geosearch",
        gscoord: `${lat}|${lon}`,
        gsradius: "10000",
        gslimit: "100",
        gsnamespace: "0",
      });
      collections.push(data.query?.geosearch || []);
    } catch {
      collections.push([]);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return Array.from(
    new Map(
      collections
        .flat()
        .filter((member) => member.pageid && isLikelyPlace(member.title))
        .map((member) => [member.pageid, member])
    ).values()
  );
}

async function resolveCandidatePages(members) {
  const pages = [];
  for (let index = 0; index < members.length; index += 20) {
    const batch = members.slice(index, index + 20);
    const data = await fetchJson({
      action: "query",
      format: "json",
      prop: "pageimages|coordinates|pageprops|extracts",
      pageids: batch.map((member) => member.pageid).join("|"),
      piprop: "thumbnail|name",
      pithumbsize: "900",
      colimit: "max",
      ppprop: "wikibase_item",
      exintro: "1",
      explaintext: "1",
      exlimit: "max",
    });
    pages.push(...Object.values(data.query?.pages || {}));
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return pages.filter(
    (page) =>
      page.pageid > 0 &&
      page.thumbnail?.source &&
      page.coordinates?.[0] &&
      isLikelyPlaceImage(page.pageimage)
  );
}

function hash(value) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function routeHash(value) {
  let result = 0;
  for (const character of value) {
    result = (result << 5) - result + character.charCodeAt(0);
    result |= 0;
  }
  return Math.abs(result);
}

function rotateDaily(items, key) {
  const day = Math.floor(Date.now() / 86400000);
  const index = (day + routeHash(key)) % items.length;
  return [...items.slice(index), ...items.slice(0, index)];
}

function samplePages(pages, region) {
  return [...pages]
    .sort((a, b) => hash(`${region}:${a.title}`) - hash(`${region}:${b.title}`))
    .slice(0, SAMPLE_SIZE);
}

function wilsonInterval(successes, total) {
  if (!total) return [0, 0];
  const z = 1.96;
  const proportion = successes / total;
  const denominator = 1 + (z * z) / total;
  const center = (proportion + (z * z) / (2 * total)) / denominator;
  const margin =
    (z * Math.sqrt((proportion * (1 - proportion)) / total + (z * z) / (4 * total * total))) /
    denominator;
  return [center - margin, center + margin].map((value) =>
    Number((Math.max(0, value) * 100).toFixed(1))
  );
}

async function auditRegion(region, config) {
  const date = new Date().toISOString().slice(0, 10);
  const dailyConfig = {
    categories: rotateDaily(config.categories, `${region}-category`).slice(0, 4),
    seeds: rotateDaily(config.seeds, `${region}-${date}-seed`).slice(0, 2),
  };
  const members = await discoverMembers(dailyConfig);
  const candidatePages = await resolveCandidatePages(members);
  const sample = samplePages(candidatePages, region);
  const results = [];

  for (const page of sample) {
    const progress = results.length + 1;
    if (
      process.env.FIELD_NOTE_AUDIT_VERBOSE === "1" ||
      progress === 1 ||
      progress === sample.length ||
      progress % 25 === 0
    ) {
      console.error(`[${region}] ${progress}/${sample.length}: ${page.title}`);
    }
    const place = {
      placeId: `${region === "Taiwan" ? "tw" : "sf"}-${page.pageid}`,
      pageId: page.pageid,
      placeName: page.title,
      wikidataId: page.pageprops?.wikibase_item,
    };
    try {
      const result = await createFieldNoteFromEvidence(
        place,
        page.extract?.trim()
          ? [{
              id: `summary-${page.pageid}`,
              source: "wikipedia-summary",
              label: `${page.title} summary`,
              text: page.extract,
            }]
          : []
      );
      results.push(
        result.ok
          ? {
              pageId: page.pageid,
              title: page.title,
              ok: true,
              question: result.generated.question,
              generator: result.generated.generator,
              operator: result.generated.operator,
              templateId: result.generated.templateId,
            }
          : {
              pageId: page.pageid,
              title: page.title,
              ok: false,
              reason: result.reason,
              topThemes: result.themeScores.slice(0, 3).map((score) => ({
                theme: score.theme,
                score: Number(score.score.toFixed(1)),
              })),
              frameType: result.frame?.frameType,
              details: result.details,
            }
      );
    } catch (error) {
      results.push({
        pageId: page.pageid,
        title: page.title,
        ok: false,
        reason: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        operationalFailure: true,
      });
    }
  }

  const evaluated = results.filter((result) => !result.operationalFailure);
  const accepted = evaluated.filter((result) => result.ok).length;
  const reasons = Object.fromEntries(
    Object.entries(
      evaluated
        .filter((result) => !result.ok)
        .reduce((counts, result) => {
          counts[result.reason] = (counts[result.reason] || 0) + 1;
          return counts;
        }, {})
    ).sort((a, b) => b[1] - a[1])
  );
  const rotationSlots = Array.from(
    { length: FIELD_NOTE_ROTATION_DAYS },
    (_, slot) => {
      const slotResults = evaluated.filter(
        (result) => candidateRotationSlot(result.pageId) === slot
      );
      const slotAccepted = slotResults.filter((result) => result.ok).length;
      return {
        slot,
        candidateCount: slotResults.length,
        accepted: slotAccepted,
        hasDailyCandidate: slotAccepted > 0,
      };
    }
  );
  const acceptedResults = evaluated.filter((result) => result.ok);
  const generatorCounts = acceptedResults.reduce((counts, result) => {
    counts[result.generator] = (counts[result.generator] || 0) + 1;
    return counts;
  }, {});
  const operatorCounts = acceptedResults.reduce((counts, result) => {
    if (result.operator) {
      counts[result.operator] = (counts[result.operator] || 0) + 1;
    }
    return counts;
  }, {});

  return {
    region,
    discoveredEntries: members.length,
    eligibleCandidatePool: candidatePages.length,
    sampleSize: sample.length,
    evaluatedSampleSize: evaluated.length,
    operationalFailures: results.length - evaluated.length,
    accepted,
    estimatedCoveragePercent: evaluated.length
      ? Number(((accepted / evaluated.length) * 100).toFixed(1))
      : 0,
    confidence95Percent: wilsonInterval(accepted, evaluated.length),
    generatorCounts,
    operatorCounts,
    rotation: {
      cycleDays: FIELD_NOTE_ROTATION_DAYS,
      todaySlot: dailyRotationSlot(),
      slotsWithAcceptedCandidate: rotationSlots.filter(
        (slot) => slot.hasDailyCandidate
      ).length,
      slots: rotationSlots,
    },
    rejectionReasons: reasons,
    acceptedExamples: results.filter((result) => result.ok).slice(0, 8),
    rejectedExamples: results.filter((result) => !result.ok).slice(0, 16),
  };
}

const reports = [];
for (const [region, config] of Object.entries(REGIONS)) {
  reports.push(await auditRegion(region, config));
}

console.log(JSON.stringify({
  sampledAt: new Date().toISOString(),
  sampleTarget: Number.isFinite(SAMPLE_SIZE) ? SAMPLE_SIZE : "all",
  reports,
}, null, 2));
