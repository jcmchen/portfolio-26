import type { GeneratedFieldNote, ObservationFrame } from "../types";
import { isExcludedFieldNoteQuestion } from "../questionDiversity";
import type {
  FieldNoteQuestionGenerator,
  QuestionGenerationOptions,
} from "./QuestionGenerator";

function withoutLeadingArticle(value: string) {
  return value.replace(/^(?:a|an|the)\s+/i, "");
}

function naturalList(values: string[]) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function stableVariant(
  placeName: string,
  variants: string[],
  excludedQuestions: string[] = []
) {
  const available = variants.filter(
    (variant) => !isExcludedFieldNoteQuestion(variant, excludedQuestions)
  );
  if (!available.length) return null;
  const index = Array.from(placeName).reduce(
    (total, character) =>
      (total + character.codePointAt(0)!) % available.length,
    0
  );
  return available[index];
}

function generated(
  frame: ObservationFrame,
  templateId: string,
  question: string
): GeneratedFieldNote {
  return {
    question,
    evidenceIds: frame.evidenceIds,
    observableClues: frame.observableClues,
    generator: "template",
    templateId,
  };
}

export class TemplateQuestionGenerator implements FieldNoteQuestionGenerator {
  async generate(
    frame: ObservationFrame,
    options: QuestionGenerationOptions = {}
  ): Promise<GeneratedFieldNote | null> {
    if (!frame.evidenceIds.length || !frame.observableClues.length) return null;

    if (frame.spatialRelation) {
      const relationQuestion =
        frame.spatialRelation.kind === "connected-by"
          ? `How does ${frame.spatialRelation.connector} connect ${frame.spatialRelation.targets} here?`
          : frame.spatialRelation.kind === "organized-around"
            ? `How does ${frame.spatialRelation.connector} organize ${frame.spatialRelation.targets} here?`
            : `How does ${frame.spatialRelation.connector} define a boundary between ${frame.spatialRelation.targets}?`;
      return generated(
        frame,
        "explicit-spatial-relation",
        relationQuestion
      );
    }

    if (
      frame.frameType === "past-present-change" &&
      frame.pastState &&
      frame.presentState
    ) {
      if (
        frame.primaryTheme === "transportation" &&
        /\bmoving the railway underground\b/i.test(
          frame.historicalChange || ""
        )
      ) {
        return generated(
          frame,
          "underground-station-transformation",
          "What does moving the railway underground change about this station’s presence in the city?"
        );
      }
      if (
        frame.primaryTheme === "commerce" &&
        frame.secondaryThemes.includes("goodsMovement") &&
        /\briver\b/i.test(frame.pastState) &&
        /\bwholesale\b/i.test(frame.presentState)
      ) {
        return generated(
          frame,
          "commerce-river-trade",
          "Where does today’s wholesale street still reflect its river-trade past?"
        );
      }
      return generated(
        frame,
        "past-present-reflection",
        frame.visibleFeature
          ? `How does ${withoutLeadingArticle(frame.visibleFeature)} connect this place’s past and present?`
          : `Where is the shift from ${withoutLeadingArticle(frame.pastState)} to ${withoutLeadingArticle(frame.presentState)} visible?`
      );
    }

    if (
      frame.frameType === "preserved-survivor" &&
      frame.visibleFeature &&
      frame.historicalChange
    ) {
      return generated(
        frame,
        "preserved-survivor-change",
        frame.secondaryThemes.includes("publicSpace")
          ? "How does the surviving house reveal the shift from private mansions to public park?"
          : `What does the surviving ${withoutLeadingArticle(frame.visibleFeature)} reveal about its changed use?`
      );
    }

    if (frame.frameType === "industry-landscape" && frame.pastState && frame.visibleFeature) {
      return generated(
        frame,
        "industry-landscape-trace",
        `Where is ${frame.pastState} still visible in ${withoutLeadingArticle(frame.visibleFeature)}?`
      );
    }

    if (
      frame.frameType === "institutional-transition" &&
      frame.visibleFeature &&
      frame.historicalChange
    ) {
      return generated(
        frame,
        "former-institution-trace",
        /\baviation museum\b/i.test(frame.pastState || "")
          ? "What remains of the former aviation museum after its aircraft were relocated?"
          : "What remains of this former institution after its collection was relocated?"
      );
    }

    if (frame.frameType === "commercial-reading" && frame.historicalChange) {
      if (/\bhalal food\b/i.test(frame.historicalChange)) {
        return generated(
          frame,
          "market-offering-change",
          "Where does the shift toward halal food appear in today’s mix of stalls?"
        );
      }
      if (/\bfood stalls\b/i.test(frame.historicalChange)) {
        return generated(
          frame,
          "market-growth-reading",
          "How does today’s mix of stalls reveal the market’s growth from earlier food stalls?"
        );
      }
      return generated(
        frame,
        "market-mix-reading",
        "What does today’s mix of stalls reveal about this market’s role?"
      );
    }

    if (frame.frameType === "station-layout" && frame.visibleFeature) {
      if (/\bevent-only service pattern\b/i.test(frame.visibleFeature)) {
        return generated(
          frame,
          "event-only-station-service",
          "What reveals that this station serves large events rather than regular daily travel?"
        );
      }
      if (
        frame.observableClues.includes("the station’s terminal and starting roles")
      ) {
        return generated(
          frame,
          "station-line-role-reading",
          "Where is one line’s end and another’s beginning legible here?"
        );
      }
      const neutralStationQuestion = stableVariant(
        frame.placeName,
        [
          "Where does movement change between the street and the station?",
          "How does entering the station change the pace of movement?",
          "Where do arrivals and departures become most visible at the station?",
          "What changes as people move between the street and station?",
        ],
        options.excludedQuestions
      );
      return generated(
        frame,
        "station-layout-reading",
        frame.observableClues.includes("movement at the station threshold")
          ? neutralStationQuestion ||
            "Where does movement change between the street and the station?"
          : `How do ${withoutLeadingArticle(frame.visibleFeature)} organize movement through the station?`
      );
    }

    if (frame.frameType === "ecology-reading" && frame.visibleFeature) {
      return generated(
        frame,
        "habitat-observation",
        `Where can you best observe ${withoutLeadingArticle(frame.visibleFeature)} at this site?`
      );
    }

    if (frame.frameType === "public-space-reading" && frame.visibleFeature) {
      return generated(
        frame,
        "public-space-organization",
        frame.observableClues.includes("movement through the space")
          ? /\bpark\b/i.test(frame.placeName)
            ? "Where do people gather, pause, or move through this park?"
            : "Where do people gather, pause, or move through this space?"
          : `How do ${withoutLeadingArticle(frame.visibleFeature)} organize activity here?`
      );
    }

    if (frame.frameType === "geology-reading" && frame.visibleFeature) {
      return generated(
        frame,
        "geology-observation",
        `Where is the site’s geology most visible in ${frame.visibleFeature}?`
      );
    }

    if (frame.frameType === "terrain-reading" && frame.visibleFeature) {
      if (frame.primaryTheme === "water") {
        return generated(
          frame,
          "water-edge-reading",
          `Where are ${frame.visibleFeature} most legible?`
        );
      }
      const terrainFeatures = naturalList(
        frame.observableClues.map(withoutLeadingArticle)
      );
      return generated(
        frame,
        "terrain-relationship",
        `Where are ${terrainFeatures} most clearly visible?`
      );
    }

    if (frame.frameType === "historical-trace" && frame.pastState) {
      if (frame.primaryTheme === "goodsMovement") {
        return generated(
          frame,
          "goods-movement-trace",
          /\bsugar\b/i.test(frame.pastState)
            ? `Where does ${frame.placeName} still reveal Japanese-era sugar and cargo movement?`
            : "Where is the port’s former cargo role still visible?"
        );
      }

      if (frame.visibleFeature && frame.historicalChange) {
        return generated(
          frame,
          "infrastructure-layers",
          /\bparallel\b.{0,45}\bbridges?\b/i.test(frame.visibleFeature)
            ? "How do the parallel bridges show how this crossing expanded over time?"
            : `How does ${withoutLeadingArticle(frame.visibleFeature)} reveal change over time?`
        );
      }

      return generated(
        frame,
        "historical-role-trace",
        `Where is its former role as ${frame.pastState} still visible?`
      );
    }

    if (frame.frameType === "material-expression" && frame.visibleFeature) {
      if (frame.primaryTheme === "transportation") {
        return generated(
          frame,
          "transport-spatial-reading",
          `How do ${withoutLeadingArticle(frame.visibleFeature)} organize movement here?`
        );
      }
      return generated(
        frame,
        "material-or-form-reading",
        `What do ${withoutLeadingArticle(frame.visibleFeature)} reveal about how this place was built?`
      );
    }

    return null;
  }
}
