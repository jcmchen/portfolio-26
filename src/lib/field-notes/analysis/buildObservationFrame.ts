import type {
  EvidenceItem,
  EvidencePlace,
  ObservationFrame,
  ObservationTheme,
  ThemeScore,
} from "../types";

function scoreFor(scores: ThemeScore[], theme: ObservationTheme) {
  return scores.find((item) => item.theme === theme)?.score || 0;
}

function evidenceIdsFor(scores: ThemeScore[], themes: ObservationTheme[]) {
  return Array.from(
    new Set(
      scores
        .filter((score) => themes.includes(score.theme))
        .flatMap((score) => score.evidenceIds)
    )
  );
}

function evidenceText(evidence: EvidenceItem[]) {
  return evidence
    .filter((item) => item.refersToCurrentPlace)
    .map((item) => item.normalizedText)
    .join(" ");
}

function confidence(primaryScore: number, supportCount: number) {
  return Number(Math.min(0.96, 0.56 + primaryScore * 0.035 + supportCount * 0.04).toFixed(2));
}

export function buildObservationFrame(
  place: EvidencePlace,
  evidence: EvidenceItem[],
  themeScores: ThemeScore[]
): ObservationFrame | null {
  const text = evidenceText(evidence);
  const supported = new Set(themeScores.map((score) => score.theme));
  const strongest = themeScores[0];

  if (!strongest) return null;

  const hasCommerceChange =
    supported.has("commerce") &&
    supported.has("goodsMovement") &&
    /\b(?:wholesale|commercial street|shops?)\b/i.test(text) &&
    /\b(?:river|cargo|imported|transported|carrying)\b/i.test(text);

  if (hasCommerceChange) {
    const themes: ObservationTheme[] = ["commerce", "goodsMovement"];
    if (supported.has("water")) themes.push("water");
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "commerce",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "commerce"), themes.length),
      pastState: /\briver\b/i.test(text)
        ? "a trading street supplied by goods moved along the nearby river"
        : "a street supplied through the movement of imported goods",
      presentState: /\bwholesale\b/i.test(text)
        ? "a wholesale center for food and general goods"
        : "an active commercial street",
      historicalChange: "river-based trade developing into a specialized wholesale district",
      visibleFeature: "continuous wholesale storefronts",
      observableClues: [
        "wholesale storefronts",
        "goods displayed along the street",
        "the continuous commercial street",
      ],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["climate", "ecology", "shoreline", "wetland", "stonework"],
      frameType: "past-present-change",
    };
  }

  const hasPreservedResidentialTransition =
    supported.has("preservation") &&
    supported.has("residentialHistory") &&
    (supported.has("museumConversion") || supported.has("publicSpace"));

  if (hasPreservedResidentialTransition) {
    const themes: ObservationTheme[] = [
      "preservation",
      "residentialHistory",
      ...(supported.has("museumConversion") ? (["museumConversion"] as ObservationTheme[]) : []),
      ...(supported.has("publicSpace") ? (["publicSpace"] as ObservationTheme[]) : []),
      ...(supported.has("architecture") ? (["architecture"] as ObservationTheme[]) : []),
    ];
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "preservation",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "preservation"), themes.length),
      pastState: /\b(?:mansion|private residence)\b/i.test(text)
        ? "private mansions around Lake Merritt"
        : "a private residence",
      presentState: supported.has("publicSpace")
        ? "a public park with one surviving historic house"
        : "a preserved house used as a museum",
      historicalChange: supported.has("publicSpace")
        ? "the shift from private mansions to Lakeside Park"
        : "the change from a private residence to a public museum",
      visibleFeature: /\bvictorian\b/i.test(text)
        ? "Victorian house beside the public park"
        : "historic house in its public setting",
      observableClues: [
        "the preserved mansion",
        "the surrounding park",
        "the contrast between the single house and the public landscape",
      ],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["wetland", "marsh", "stonework", "stone construction", "climate"],
      frameType: "preserved-survivor",
    };
  }

  const hasMiningLandscape =
    supported.has("mining") && (supported.has("terrain") || supported.has("geology"));

  if (hasMiningLandscape) {
    const themes: ObservationTheme[] = [
      "mining",
      ...(supported.has("geology") ? (["geology"] as ObservationTheme[]) : []),
      ...(supported.has("terrain") ? (["terrain"] as ObservationTheme[]) : []),
      ...(supported.has("industry") ? (["industry"] as ObservationTheme[]) : []),
    ];
    const mercury = /\b(?:mercury|cinnabar|quicksilver)\b/i.test(text);
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "mining",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "mining"), themes.length),
      pastState: mercury ? "mercury and cinnabar mining" : "mineral extraction",
      presentState: "a landscape of mine remains and reused ground",
      historicalChange: "the transition from an extractive settlement to the present landscape",
      visibleFeature: "hills, mine remains, and altered ground",
      observableClues: ["mine openings", "altered slopes", "remaining industrial structures"],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["shoreline", "coastline", "tidal", "wetland"],
      frameType: "industry-landscape",
    };
  }

  const hasPortHistory =
    supported.has("goodsMovement") &&
    supported.has("transportation") &&
    /\b(?:port|harbou?r|wharf|cargo)\b/i.test(text);

  if (hasPortHistory) {
    const themes: ObservationTheme[] = ["goodsMovement", "transportation"];
    if (supported.has("water")) themes.push("water");
    const carriedSugar = /\b(?:sugar|granulated sugar)\b/i.test(text);
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "goodsMovement",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "goodsMovement"), themes.length),
      pastState: carriedSugar
        ? "moving sugar and island cargo during Japanese rule"
        : "moving cargo through the working port",
      presentState: "an active port and working waterfront",
      historicalChange: "the port’s changing role in regional goods movement",
      visibleFeature: "wharves, breakwaters, and working edges",
      observableClues: ["working wharves", "cargo edges", "breakwaters"],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["wetland", "residential history"],
      frameType: "historical-trace",
    };
  }

  const hasBridgeLayers =
    supported.has("transportation") &&
    /\b(?:parallel|original|replacement|built|completed).{0,80}\b(?:bridge|span)\b|\b(?:bridge|span).{0,80}\b(?:parallel|original|replacement|built|completed)\b/i.test(text);

  if (hasBridgeLayers) {
    const themes: ObservationTheme[] = ["transportation"];
    if (supported.has("architecture")) themes.push("architecture");
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "transportation",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "transportation"), themes.length),
      pastState: "successive bridge spans built for changing traffic needs",
      presentState: "parallel spans from different construction periods",
      historicalChange: "how the crossing expanded through successive structures",
      visibleFeature: "parallel bridge spans with different structural systems",
      observableClues: ["the parallel spans", "contrasting structural systems", "different bridge profiles"],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["rail infrastructure", "wetland", "residential history"],
      frameType: "historical-trace",
    };
  }

  const hasTerrainReading =
    supported.has("terrain") && (supported.has("geology") || supported.has("water"));

  if (hasTerrainReading) {
    const themes: ObservationTheme[] = ["terrain"];
    if (supported.has("geology")) themes.push("geology");
    if (supported.has("water")) themes.push("water");
    const hasRivers = /\b(?:river|rivers|creek|stream)\b/i.test(text);
    const isCreek = /\bcreek\b/i.test(place.placeName);
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "terrain",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "terrain"), themes.length),
      visibleFeature: hasRivers
        ? isCreek
          ? "foothills and the creek’s course"
          : "foothills and river courses"
        : "slopes and geological landforms",
      observableClues: hasRivers
        ? ["foothill slopes", isCreek ? "the creek channel" : "river channels", "changes in elevation"]
        : ["slopes", "rock exposures", "changes in elevation"],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["layered history", "shoreline", "wetland", "climate"],
      frameType: "terrain-reading",
    };
  }

  const hasMaterialExpression =
    (supported.has("architecture") || supported.has("material")) &&
    scoreFor(themeScores, strongest.theme) >= 4;

  if (hasMaterialExpression) {
    const themes = [strongest.theme];
    if (strongest.theme !== "architecture" && supported.has("architecture")) themes.push("architecture");
    if (strongest.theme !== "material" && supported.has("material")) themes.push("material");
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: strongest.theme,
      secondaryThemes: themes.slice(1),
      confidence: confidence(strongest.score, themes.length),
      visibleFeature: supported.has("material") ? "construction details and material joints" : "building form and architectural details",
      observableClues: supported.has("material")
        ? ["material joints", "surface changes", "repair details"]
        : ["building profile", "structural rhythm", "architectural details"],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["climate", "wetland", "shoreline"],
      frameType: "material-expression",
    };
  }

  if (
    strongest.theme === "transportation" &&
    strongest.score >= 3 &&
    /\b(?:airport|station|bridge|port|harbou?r|railway|road)\b/i.test(`${place.placeName} ${text}`)
  ) {
    const lower = place.placeName.toLocaleLowerCase();
    const visibleFeature = lower.includes("airport")
      ? "runways, terminal edges, and access routes"
      : lower.includes("station")
        ? "platforms, tracks, and station approaches"
        : lower.includes("bridge")
          ? "bridge structure, approaches, and crossing"
          : lower.includes("port") || lower.includes("harbor")
            ? "working edges, routes, and harbor structures"
            : "routes, thresholds, and access points";
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "transportation",
      secondaryThemes: supported.has("architecture") ? ["architecture"] : [],
      confidence: confidence(strongest.score, 1),
      visibleFeature,
      observableClues: visibleFeature.split(", "),
      evidenceIds: evidenceIdsFor(themeScores, ["transportation", "architecture"]),
      disallowedConcepts: ["climate", "wetland", "shoreline", "residential history"],
      frameType: "material-expression",
    };
  }

  if (
    strongest.theme === "residentialHistory" &&
    strongest.score >= 3.5 &&
    /\b(?:house|home|mansion|residence|villa)\b/i.test(`${place.placeName} ${text}`)
  ) {
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "residentialHistory",
      secondaryThemes: supported.has("architecture") ? ["architecture"] : [],
      confidence: confidence(strongest.score, 1),
      pastState: "a historic private residence",
      visibleFeature: "house exterior, residential scale, and street-facing form",
      observableClues: ["house exterior", "residential scale", "street-facing form"],
      evidenceIds: evidenceIdsFor(themeScores, ["residentialHistory", "architecture"]),
      disallowedConcepts: ["museum", "public park", "wetland", "stonework", "climate"],
      frameType: "historical-trace",
    };
  }

  if (
    strongest.theme === "water" &&
    strongest.score >= 3 &&
    /\b(?:creek|river|bay|beach|shore|waterfront)\b/i.test(`${place.placeName} ${text}`)
  ) {
    const lower = place.placeName.toLocaleLowerCase();
    const observableClues = /\b(?:creek|river)\b/.test(lower)
      ? [
          lower.includes("creek") ? "the creek channel" : "the river channel",
          ...( /\b(?:joins?|confluence|tributary|mouth)\b/i.test(text)
            ? ["its tributary junction"]
            : []),
          ...( /\bflows?\b/i.test(text) ? ["flow direction"] : []),
          ...( /\bbanks?\b/i.test(text) ? ["the banks"] : []),
          ...( /\bcrossings?\b/i.test(text) ? ["crossings"] : []),
        ]
      : /\bbeach\b/.test(lower)
        ? ["the shoreline", "beach material", "the water’s edge"]
        : ["the shoreline", "water edges", "changing water conditions"];
    const visibleFeature = observableClues.join(", ").replace(/, ([^,]+)$/, ", and $1");
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "water",
      secondaryThemes: supported.has("ecology") ? ["ecology"] : [],
      confidence: confidence(strongest.score, 1),
      visibleFeature,
      observableClues,
      evidenceIds: evidenceIdsFor(themeScores, ["water", "ecology"]),
      disallowedConcepts: ["climate", "mining", "residential history"],
      frameType: "terrain-reading",
    };
  }

  return null;
}
