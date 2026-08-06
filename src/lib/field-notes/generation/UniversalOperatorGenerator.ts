import type {
  AtomicEvidence,
  DocumentTopic,
  EvidencePlace,
  GenerativeObservationCandidate,
} from "../types";
import { selectBestGenerativeCandidate } from "./generativeValidation";

function naturalList(values: string[]) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function withoutLeadingArticle(value: string) {
  return value.replace(/^(?:a|an|the)\s+/i, "").trim();
}

function historicalSubject(text: string) {
  const usedToBe = text.match(
    /\bused to be (?:the (?:site|area) of )?((?:an?|the)\s+[^.;]{3,65})/i
  )?.[1];
  if (usedToBe) return usedToBe.trim();

  const former = text.match(
    /\b(?:former|formerly an?|once an?)\s+([^.;,]{3,55})/i
  )?.[1];
  return former ? `a former ${former.trim()}` : null;
}

function candidate(
  input: GenerativeObservationCandidate
): GenerativeObservationCandidate {
  return input;
}

export function generateUniversalOperatorObservation(
  _place: EvidencePlace,
  atoms: AtomicEvidence[],
  topics: DocumentTopic[] = []
) {
  const candidates: GenerativeObservationCandidate[] = [];

  const formerRiverTrade = atoms.find(
    (atom) =>
      /\briver\b/i.test(atom.text) &&
      /\b(?:ago|formerly|used to|there was|merchants?|imported|goods)\b/i.test(
        atom.text
      )
  );
  const presentCommerceAtoms = atoms.filter(
    (atom) =>
      atom.evidenceId !== formerRiverTrade?.evidenceId &&
      /\b(?:wholesale|shopping area|shops?)\b/i.test(atom.text)
  );
  const presentWholesale =
    presentCommerceAtoms.find((atom) => /\bwholesale\b/i.test(atom.text)) ||
    presentCommerceAtoms.find((atom) => /\bshopping area\b/i.test(atom.text)) ||
    presentCommerceAtoms[0];
  if (formerRiverTrade && presentWholesale) {
    candidates.push({
      question: "How does today’s wholesale street differ from its river-trade past?",
      operator: "use_behavior",
      evidenceIds: [formerRiverTrade.evidenceId, presentWholesale.evidenceId],
      presuppositions: [formerRiverTrade.text, presentWholesale.text],
      observableClues: ["the wholesale center", "the former river"],
    });
  }

  const historicalCargo = atoms.find(
    (atom) =>
      /\b(?:cargo|goods|sugar)\b/i.test(atom.text) &&
      (atom.operators.some((item) => item.operator === "historical_trace") ||
        /\b(?:formerly|historically|originally|Japanese rule|constructed|built)\b/i.test(
          atom.text
        ))
  );
  const presentCargo = atoms.find(
    (atom) =>
      atom.evidenceId !== historicalCargo?.evidenceId &&
      /\b(?:currently|today|now|mainly)\b.{0,80}\b(?:transports?|cargo|goods)\b|\b(?:transports?|cargo|goods)\b.{0,80}\b(?:currently|today|now|mainly)\b/i.test(
        atom.text
      )
  );
  if (historicalCargo && presentCargo) {
    candidates.push({
      question: "How does cargo movement today compare with its earlier role here?",
      operator: "use_behavior",
      evidenceIds: [historicalCargo.evidenceId, presentCargo.evidenceId],
      presuppositions: [historicalCargo.text, presentCargo.text],
      observableClues: ["cargo movement"],
    });
  } else if (historicalCargo) {
    const currentPort = atoms.find(
      (atom) =>
        atom.evidenceId !== historicalCargo.evidenceId &&
        /\b(?:port|harbou?r|wharves?)\b/i.test(atom.text)
    );
    if (currentPort) {
      candidates.push({
        question: "How does the port’s cargo role compare with its earlier purpose?",
        operator: "use_behavior",
        evidenceIds: [historicalCargo.evidenceId, currentPort.evidenceId],
        presuppositions: [historicalCargo.text, currentPort.text],
        observableClues: ["cargo movement", "the port"],
      });
    }
  }

  atoms.forEach((atom) => {
    const historical = historicalSubject(atom.text);
    if (historical) {
      const readable = withoutLeadingArticle(historical);
      const presentContext = /\b(?:islands?|marsh|bay|wetlands?|shore|rivers?|creeks?|foothills?|hills?|valleys?|landscape|terrain)\b/i.test(
        `${historical} ${atom.text}`
      )
        ? "today’s landscape"
        : "today’s layout";
      candidates.push(
        candidate({
          question: `Is the ${readable} still legible in ${presentContext}?`,
          operator: "historical_trace",
          evidenceIds: [atom.evidenceId],
          presuppositions: [`This site used to be the ${readable}.`],
          observableClues: [historical, presentContext],
        })
      );
    }

    const clues = atom.observableClues.slice(0, 2);
    const spatialFeatures = clues.filter((clue) =>
      /\b(?:plaza|courtyard|street|paths?|trails?|platforms?|exits?|stalls?|wharves?|pond|tower|facade|façade)\b/i.test(
        clue
      )
    );
    if (
      spatialFeatures.length >= 2 &&
      atom.operators.some((item) => item.operator === "spatial_organization")
    ) {
      const features = naturalList(spatialFeatures.map(withoutLeadingArticle));
      candidates.push(
        candidate({
          question: `How do the ${features} organize movement through this place?`,
          operator: "spatial_organization",
          evidenceIds: [atom.evidenceId],
          presuppositions: [`The place contains ${features}.`],
          observableClues: spatialFeatures,
        })
      );
    }

    const material = clues.find((clue) =>
      /brick|concrete|timber|steel|stone|facade/i.test(clue)
    );
    if (material) {
      candidates.push(
        candidate({
          question: `What does ${material} reveal about how this place was built?`,
          operator: "material_expression",
          evidenceIds: [atom.evidenceId],
          presuppositions: [`The place includes ${material}.`],
          observableClues: [material],
        })
      );
    }

    const environment = clues.find((clue) =>
      /wetland|marsh|shore|river|creek|hill|slope|quarry|outcrop|habitat|vegetation/i.test(clue)
    );
    const isOnlyHistoricalEnvironment =
      environment &&
      /\b(?:ago|formerly|used to|there was|once stood|no longer)\b/i.test(
        atom.text
      );
    if (environment && !isOnlyHistoricalEnvironment) {
      candidates.push(
        candidate({
          question: `Where is ${environment} most clearly visible at this site?`,
          operator: "environment_relation",
          evidenceIds: [atom.evidenceId],
          presuppositions: [`The site contains ${environment}.`],
          observableClues: [environment],
        })
      );
    }

    const stalls = clues.find((clue) => /stalls?|vendors?/i.test(clue));
    if (stalls) {
      candidates.push(
        candidate({
          question: `How do ${stalls} shape where people move and gather here?`,
          operator: "use_behavior",
          evidenceIds: [atom.evidenceId],
          presuppositions: [`The place contains ${stalls}.`],
          observableClues: [stalls],
        })
      );
    }
  });

  return selectBestGenerativeCandidate(candidates, atoms, topics);
}
