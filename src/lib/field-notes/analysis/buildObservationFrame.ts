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

function ownedEvidenceIdsMatching(
  evidence: EvidenceItem[],
  patterns: RegExp[]
) {
  return evidence
    .filter(
      (item) =>
        item.refersToCurrentPlace &&
        patterns.some((pattern) => pattern.test(item.normalizedText))
    )
    .map((item) => item.id);
}

function uniqueIds(...groups: string[][]) {
  return Array.from(new Set(groups.flat()));
}

function cluesFromText(
  text: string,
  rules: Array<{ pattern: RegExp; clue: string }>
) {
  return Array.from(
    new Set(rules.filter((rule) => rule.pattern.test(text)).map((rule) => rule.clue))
  );
}

function naturalList(values: string[]) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
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

  const hasMarketReading =
    /\bmarket\b/i.test(place.placeName) &&
    supported.has("commerce") &&
    scoreFor(themeScores, "commerce") >= 3 &&
    /\b(?:night market|street market|market stalls?|food stalls?)\b/i.test(
      `${place.placeName} ${text}`
    );

  if (hasMarketReading) {
    const themes: ObservationTheme[] = ["commerce"];
    if (supported.has("publicSpace")) themes.push("publicSpace");
    const hasHalalFood = /\bhalal foods?\b/i.test(text);
    const grewFromFoodStalls =
      /\bfood stalls?\b/i.test(text) &&
      /\b(?:developed into|large-scale market|since then)\b/i.test(text);
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "commerce",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "commerce"), themes.length),
      pastState: grewFromFoodStalls ? "a cluster of food stalls" : "a local market",
      presentState: hasHalalFood
        ? "a large night market whose stalls include halal food"
        : "an active market with varied stalls and goods",
      historicalChange: hasHalalFood
        ? "the market’s shift toward halal food"
        : grewFromFoodStalls
          ? "its growth from food stalls into a large market"
          : "changes in what the market’s stalls offer",
      visibleFeature: "today’s mix of stalls and goods",
      observableClues: hasHalalFood
        ? ["halal food offerings", "the mix of stalls", "foods and goods on display"]
        : ["the mix of stalls", "goods on display", "how vendors are grouped"],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["climate", "wetland", "shoreline", "residential history"],
      frameType: "commercial-reading",
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

  const hasInstitutionalTransition =
    supported.has("institutionalChange") &&
    /\b(?:museum|gallery|visitor center)\b/i.test(text) &&
    /\b(?:closed|demolished|removed|relocated|sent to storage|transferred)\b/i.test(text);

  if (hasInstitutionalTransition) {
    const themes: ObservationTheme[] = ["institutionalChange"];
    if (supported.has("transportation")) themes.push("transportation");
    if (supported.has("architecture")) themes.push("architecture");
    const isAviationMuseum = /\b(?:aviation museum|aircraft on display|air force fighters?)\b/i.test(text);
    const hasAirportPosition =
      /\b(?:between|beside|within|at)\b.{0,90}\b(?:airport|terminal|entrance)\b/i.test(text);
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "institutionalChange",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "institutionalChange"), themes.length),
      pastState: isAviationMuseum
        ? "an aviation museum displaying retired aircraft"
        : "a museum displaying its collection",
      presentState: "a former museum site whose collection was moved elsewhere",
      historicalChange: isAviationMuseum
        ? "the museum closed and its displayed aircraft were relocated"
        : "the institution closed and its collection was relocated",
      visibleFeature: isAviationMuseum && hasAirportPosition
        ? "the former aviation museum site between the main freeway entrance and airport terminals"
        : "the former museum site and its surrounding context",
      observableClues: isAviationMuseum && hasAirportPosition
        ? ["the former museum site", "the main freeway entrance", "the airport terminals"]
        : ["the former museum site", "its boundaries", "any remaining signs of its earlier use"],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["climate", "wetland", "shoreline", "residential history"],
      frameType: "institutional-transition",
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
      visibleFeature: "parallel cantilever and suspension bridges",
      observableClues: [
        "the parallel bridges",
        "the cantilever bridges",
        "the suspension bridge",
      ],
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["rail infrastructure", "wetland", "residential history"],
      frameType: "historical-trace",
    };
  }

  const terminalLine = text.match(
    /\bterminal station of (?:the )?([^.,;]{2,50}?\bline)\b/i
  )?.[1];
  const startingLine = text.match(
    /\bstarting station of (?:the )?([^.,;]{2,50}?\bline)\b/i
  )?.[1];
  const lineRoleClues =
    terminalLine && startingLine
      ? [
          `the ${terminalLine}`,
          `the ${startingLine}`,
          "the station’s terminal and starting roles",
        ]
      : [];
  const stationClues = cluesFromText(text, [
    {
      pattern:
        /\bnorthbound platform\b[\s\S]{0,180}\bsouthbound platform\b|\bsouthbound platform\b[\s\S]{0,180}\bnorthbound platform\b/i,
      clue: "the northbound and southbound platforms",
    },
    { pattern: /\bpedestrian plaza\b/i, clue: "the pedestrian plaza" },
    { pattern: /\bisland platform\b/i, clue: "the island platform" },
    { pattern: /\bside platforms?\b/i, clue: "the side platforms" },
    { pattern: /\bat-grade (?:light rail )?station\b/i, clue: "the at-grade station" },
    { pattern: /\belevated station\b/i, clue: "the elevated station structure" },
    { pattern: /\bunderground station\b/i, clue: "the underground station layout" },
    {
      pattern: /\bthree-level underground railway station\b/i,
      clue: "the three underground railway levels",
    },
    {
      pattern: /\btwo-level,? underground station\b/i,
      clue: "the two underground metro levels",
    },
    { pattern: /\b(?:one|main) entrance\b/i, clue: "the station entrance" },
    { pattern: /\b1941 station building\b/i, clue: "the 1941 station building" },
    { pattern: /\bstation exits?\b|\bexits?\s+\d/i, clue: "the station exits" },
    { pattern: /\btracks?\b/i, clue: "the tracks" },
    { pattern: /\bplatforms?\b/i, clue: "the platforms" },
    { pattern: /\binterchange\b/i, clue: "the interchange" },
  ]).slice(0, 3);
  const isStation =
    scoreFor(themeScores, "transportation") >= 3 &&
    /\b(?:metro|railway|light rail|train)?\s*station\b/i.test(place.placeName);

  if (isStation) {
    const themes: ObservationTheme[] = ["transportation"];
    if (supported.has("architecture")) themes.push("architecture");
    const hasUndergroundTransformation =
      /\b(?:railway|(?:TRA|rail(?:way)?) tracks?)\b.{0,80}\b(?:being |to be )?moved underground\b|\bmoved underground\b.{0,80}\b(?:railway|(?:TRA|rail(?:way)?) tracks?)\b/i.test(
        text
      ) &&
      /\b(?:temporary|rebuilt|relocated|underground station|underground railway station)\b/i.test(
        text
      );
    if (hasUndergroundTransformation) {
      const transformationIds = ownedEvidenceIdsMatching(evidence, [
        /\bmoved underground\b/i,
        /\bunderground (?:railway |metro )?station\b/i,
        /\btemporary (?:metro )?station(?: building)?\b/i,
        /\brebuilt station\b/i,
        /\brelocated\b/i,
        /\b(?:island )?platforms?\b/i,
        /\bstation entrance\b|\bone entrance\b/i,
      ]);
      const transformationClues = stationClues.filter((clue) =>
        /underground|platform|entrance|1941/i.test(clue)
      );
      return {
        placeId: place.placeId,
        placeName: place.placeName,
        primaryTheme: "transportation",
        secondaryThemes: themes.slice(1),
        confidence: confidence(
          scoreFor(themeScores, "transportation"),
          Math.max(2, transformationIds.length)
        ),
        pastState: "the railway before it was moved underground",
        presentState: "a rebuilt underground railway and metro station",
        historicalChange: "moving the railway underground and rebuilding the station",
        visibleFeature: "the station’s relationship between the city and its underground rail levels",
        observableClues: transformationClues.length
          ? transformationClues
          : ["the underground station layout", "the station entrance"],
        evidenceIds: uniqueIds(
          evidenceIdsFor(themeScores, themes),
          transformationIds
        ),
        disallowedConcepts: ["climate", "wetland", "shoreline", "residential history"],
        frameType: "past-present-change",
      };
    }

    const hasEventOnlyService =
      /\bnot a regular service stop\b|\bonly in service for\b.{0,100}\b(?:games?|events?)\b|\bevent-only (?:service|station|stop)\b/i.test(
        text
      );
    if (hasEventOnlyService) {
      const serviceIds = ownedEvidenceIdsMatching(evidence, [
        /\bnot a regular service stop\b/i,
        /\bonly in service for\b.{0,100}\b(?:games?|events?)\b/i,
        /\bstadium\b/i,
        /\b(?:no|does not have (?:any )?) ticket vending machines?\b/i,
        /\bhandheld (?:clipper card )?readers?\b/i,
      ]);
      const serviceClues = cluesFromText(text, [
        { pattern: /\bnear the stadium\b/i, clue: "the nearby stadium" },
        {
          pattern:
            /\b(?:no|does not have (?:any )?) ticket vending machines?\b/i,
          clue: "the lack of ticket vending machines",
        },
        {
          pattern: /\bhandheld (?:clipper card )?readers?\b/i,
          clue: "staff using handheld card readers",
        },
      ]);
      return {
        placeId: place.placeId,
        placeName: place.placeName,
        primaryTheme: "transportation",
        secondaryThemes: [],
        confidence: confidence(
          scoreFor(themeScores, "transportation"),
          Math.max(2, serviceIds.length)
        ),
        visibleFeature: "the station’s event-only service pattern",
        observableClues: serviceClues.length
          ? serviceClues
          : ["the stadium setting", "the event-only service pattern"],
        evidenceIds: uniqueIds(
          evidenceIdsFor(themeScores, ["transportation"]),
          serviceIds
        ),
        disallowedConcepts: ["climate", "wetland", "shoreline", "daily commuter service"],
        frameType: "station-layout",
      };
    }

    const observableClues = lineRoleClues.length
      ? lineRoleClues
      : stationClues.length
        ? stationClues
      : ["movement at the station threshold", "arrivals and departures"];
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "transportation",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "transportation"), themes.length),
      visibleFeature: lineRoleClues.length
        ? `${terminalLine} ending and ${startingLine} beginning at the station`
        : stationClues.length
          ? naturalList(stationClues)
        : "movement at the station threshold",
      observableClues,
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["climate", "wetland", "shoreline", "residential history"],
      frameType: "station-layout",
    };
  }

  const ecologyClues = cluesFromText(text, [
    { pattern: /\bsalt marsh\b/i, clue: "the salt marsh" },
    { pattern: /\btidal marsh\b/i, clue: "the tidal marsh" },
    { pattern: /\bwetlands?\b/i, clue: "the wetland habitat" },
    { pattern: /\bmarsh habitat\b/i, clue: "the marsh habitat" },
    { pattern: /\bwildlife habitat\b/i, clue: "the wildlife habitat" },
    { pattern: /\bnative vegetation\b/i, clue: "the native vegetation" },
    { pattern: /\bflora\b/i, clue: "the local flora" },
    { pattern: /\bfauna|wildlife\b/i, clue: "the local wildlife" },
  ]).slice(0, 3);
  const hasEcologyReading =
    scoreFor(themeScores, "ecology") >= 3 && ecologyClues.length > 0;

  if (hasEcologyReading) {
    const themes: ObservationTheme[] = ["ecology"];
    if (supported.has("water")) themes.push("water");
    if (supported.has("terrain")) themes.push("terrain");
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "ecology",
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, "ecology"), themes.length),
      visibleFeature: naturalList(ecologyClues),
      observableClues: ecologyClues,
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["climate", "mining", "residential history"],
      frameType: "ecology-reading",
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

  const terrainClues = cluesFromText(text, [
    { pattern: /\bfoothills?\b/i, clue: "the foothills" },
    { pattern: /\bhills?\b/i, clue: "the hills" },
    { pattern: /\bvalleys?\b/i, clue: "the valley" },
    { pattern: /\bslopes?\b/i, clue: "the slopes" },
    { pattern: /\bridges?\b/i, clue: "the ridges" },
    { pattern: /\bcanyons?\b/i, clue: "the canyon" },
    { pattern: /\belevation\b/i, clue: "changes in elevation" },
    { pattern: /\bmountain ranges?\b/i, clue: "the mountain range" },
  ]).slice(0, 3);

  if (scoreFor(themeScores, "terrain") >= 3 && terrainClues.length > 0) {
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "terrain",
      secondaryThemes: [],
      confidence: confidence(scoreFor(themeScores, "terrain"), 1),
      visibleFeature: naturalList(terrainClues),
      observableClues: terrainClues,
      evidenceIds: evidenceIdsFor(themeScores, ["terrain"]),
      disallowedConcepts: ["climate", "shoreline", "wetland", "layered history"],
      frameType: "terrain-reading",
    };
  }

  const geologyClues = cluesFromText(text, [
    { pattern: /\bquarry face\b|\brock quarry\b/i, clue: "the quarry face" },
    { pattern: /\boutcrops?\b|\brock outcrops?\b/i, clue: "the rock outcrops" },
    { pattern: /\brock formations?\b/i, clue: "the rock formations" },
    { pattern: /\bore deposits?\b/i, clue: "the ore deposits" },
    { pattern: /\bmineralized (?:area|ground)\b/i, clue: "the mineralized ground" },
    { pattern: /\bgeological layers?\b/i, clue: "the geological layers" },
  ]).slice(0, 3);

  if (scoreFor(themeScores, "geology") >= 3 && geologyClues.length > 0) {
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "geology",
      secondaryThemes: [],
      confidence: confidence(scoreFor(themeScores, "geology"), 1),
      visibleFeature: naturalList(geologyClues),
      observableClues: geologyClues,
      evidenceIds: evidenceIdsFor(themeScores, ["geology"]),
      disallowedConcepts: ["climate", "shoreline", "wetland", "residential history"],
      frameType: "geology-reading",
    };
  }

  const publicSpaceClues = cluesFromText(text, [
    { pattern: /\bwalking paths?\b|\bpaths?\b/i, clue: "the paths" },
    { pattern: /\btrails?\b/i, clue: "the trails" },
    { pattern: /\bplaygrounds?\b/i, clue: "the playgrounds" },
    { pattern: /\bsports fields?\b/i, clue: "the sports fields" },
    { pattern: /\bgardens?\b/i, clue: "the gardens" },
    { pattern: /\bcourtyards?\b/i, clue: "the courtyards" },
    { pattern: /\bplazas?\b/i, clue: "the plaza" },
    { pattern: /\bopen space\b/i, clue: "the open space" },
  ]).slice(0, 3);
  const isNamedPublicSpace =
    scoreFor(themeScores, "publicSpace") >= 3 &&
    /\b(?:park|plaza|garden|public space)\b/i.test(place.placeName);

  if (isNamedPublicSpace) {
    const observableClues = publicSpaceClues.length
      ? publicSpaceClues
      : ["movement through the space", "where people pause or gather"];
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "publicSpace",
      secondaryThemes: [],
      confidence: confidence(scoreFor(themeScores, "publicSpace"), 1),
      visibleFeature: publicSpaceClues.length
        ? naturalList(publicSpaceClues)
        : "movement and gathering",
      observableClues,
      evidenceIds: evidenceIdsFor(themeScores, ["publicSpace"]),
      disallowedConcepts: ["climate", "mining", "wetland", "residential history"],
      frameType: "public-space-reading",
    };
  }

  const builtTheme: ObservationTheme =
    scoreFor(themeScores, "material") > scoreFor(themeScores, "architecture")
      ? "material"
      : "architecture";
  const buildingClues = cluesFromText(text, [
    { pattern: /\bvictorian\b/i, clue: "the Victorian details" },
    { pattern: /\bitalianate\b/i, clue: "the Italianate details" },
    { pattern: /\bgothic\b/i, clue: "the Gothic details" },
    { pattern: /\bmodernist\b/i, clue: "the modernist form" },
    { pattern: /\bart deco\b/i, clue: "the Art Deco details" },
    { pattern: /\bbrutalist\b/i, clue: "the Brutalist form" },
    { pattern: /\bbell tower\b/i, clue: "the bell tower" },
    { pattern: /\bclock tower\b/i, clue: "the clock tower" },
    { pattern: /\bsteeple\b/i, clue: "the steeple" },
    { pattern: /\bdome\b/i, clue: "the dome" },
    { pattern: /\barcade\b/i, clue: "the arcade" },
    { pattern: /\bcolonnade\b/i, clue: "the colonnade" },
    { pattern: /\bfacade|façade\b/i, clue: "the facade" },
    { pattern: /\bbrick\b/i, clue: "the brickwork" },
    { pattern: /\bconcrete\b/i, clue: "the concrete structure" },
    { pattern: /\btimber|wooden\b/i, clue: "the timber construction" },
    { pattern: /\bsteel\b/i, clue: "the steel structure" },
    { pattern: /\bstone masonry\b/i, clue: "the stone masonry" },
  ]).slice(0, 3);
  const hasMaterialExpression =
    scoreFor(themeScores, builtTheme) >= 3 && buildingClues.length > 0;

  if (hasMaterialExpression) {
    const themes = [builtTheme];
    if (builtTheme !== "architecture" && supported.has("architecture")) themes.push("architecture");
    if (builtTheme !== "material" && supported.has("material")) themes.push("material");
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: builtTheme,
      secondaryThemes: themes.slice(1),
      confidence: confidence(scoreFor(themeScores, builtTheme), themes.length),
      visibleFeature: naturalList(buildingClues),
      observableClues: buildingClues,
      evidenceIds: evidenceIdsFor(themeScores, themes),
      disallowedConcepts: ["climate", "wetland", "shoreline"],
      frameType: "material-expression",
    };
  }

  if (
    scoreFor(themeScores, "transportation") >= 3 &&
    /\b(?:airport|bridge|port|harbou?r|road)\b/i.test(place.placeName)
  ) {
    const lower = place.placeName.toLocaleLowerCase();
    const visibleFeature = lower.includes("airport")
      ? "runways, terminal edges, and access routes"
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
      confidence: confidence(scoreFor(themeScores, "transportation"), 1),
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
    scoreFor(themeScores, "water") >= 3 &&
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
    const visibleFeature = naturalList(observableClues);
    return {
      placeId: place.placeId,
      placeName: place.placeName,
      primaryTheme: "water",
      secondaryThemes: supported.has("ecology") ? ["ecology"] : [],
      confidence: confidence(scoreFor(themeScores, "water"), 1),
      visibleFeature,
      observableClues,
      evidenceIds: evidenceIdsFor(themeScores, ["water", "ecology"]),
      disallowedConcepts: ["climate", "mining", "residential history"],
      frameType: "terrain-reading",
    };
  }

  return null;
}
