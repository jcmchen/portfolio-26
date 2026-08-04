import type { GeneratedFieldNote, ObservationFrame } from "../types";
import type { FieldNoteQuestionGenerator } from "./QuestionGenerator";

function withoutLeadingArticle(value: string) {
  return value.replace(/^(?:a|an|the)\s+/i, "");
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
  async generate(frame: ObservationFrame): Promise<GeneratedFieldNote | null> {
    if (!frame.evidenceIds.length || !frame.observableClues.length) return null;

    if (
      frame.frameType === "past-present-change" &&
      frame.pastState &&
      frame.presentState
    ) {
      if (
        frame.primaryTheme === "commerce" &&
        frame.secondaryThemes.includes("goodsMovement") &&
        /\briver\b/i.test(frame.pastState) &&
        /\bwholesale\b/i.test(frame.presentState)
      ) {
        return generated(
          frame,
          "commerce-river-trade",
          "How does today’s wholesale street still reflect its earlier role in river-based trade?"
        );
      }
      return generated(
        frame,
        "past-present-reflection",
        `How does today’s ${withoutLeadingArticle(frame.presentState)} still reflect its earlier role as ${frame.pastState}?`
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
        `How does the surviving ${withoutLeadingArticle(frame.visibleFeature)} reveal ${frame.historicalChange}?`
      );
    }

    if (frame.frameType === "industry-landscape" && frame.pastState && frame.visibleFeature) {
      return generated(
        frame,
        "industry-landscape-trace",
        `How is ${frame.pastState} still visible in the area’s ${withoutLeadingArticle(frame.visibleFeature)}?`
      );
    }

    if (frame.frameType === "terrain-reading" && frame.visibleFeature) {
      if (frame.primaryTheme === "water") {
        return generated(
          frame,
          "water-edge-reading",
          `Where are ${frame.visibleFeature} most legible at ${frame.placeName}?`
        );
      }
      return generated(
        frame,
        "terrain-relationship",
        `Where is the relationship between ${withoutLeadingArticle(frame.visibleFeature)} most visible across ${frame.placeName}?`
      );
    }

    if (frame.frameType === "historical-trace" && frame.pastState) {
      if (frame.primaryTheme === "goodsMovement") {
        return generated(
          frame,
          "goods-movement-trace",
          `Where can you still see traces of ${frame.placeName}’s earlier role in ${frame.pastState}?`
        );
      }

      if (frame.visibleFeature && frame.historicalChange) {
        return generated(
          frame,
          "infrastructure-layers",
          `What can ${withoutLeadingArticle(frame.visibleFeature)} reveal about ${frame.historicalChange}?`
        );
      }

      return generated(
        frame,
        "historical-role-trace",
        `Where can you still see traces of the place’s former role as ${frame.pastState}?`
      );
    }

    if (frame.frameType === "material-expression" && frame.visibleFeature) {
      if (frame.primaryTheme === "transportation") {
        return generated(
          frame,
          "transport-spatial-reading",
          `What do ${withoutLeadingArticle(frame.visibleFeature)} reveal about how movement is organized through ${frame.placeName}?`
        );
      }
      return generated(
        frame,
        "material-or-form-reading",
        `What do ${withoutLeadingArticle(frame.visibleFeature)} reveal about how ${frame.placeName} was built and used?`
      );
    }

    return null;
  }
}
