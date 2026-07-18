import type { Evidence, EvaluationInput } from "./assessment";

function flattenSources(input: EvaluationInput): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.initial_canvas)) {
    output[`initial_canvas.${key}`] = value;
  }
  for (const [key, value] of Object.entries(input.revised_canvas)) {
    output[`revised_canvas.${key}`] = value;
  }
  for (const [key, value] of Object.entries(input.revision_strategy)) {
    if (typeof value === "string") output[`revision_strategy.${key}`] = value;
  }
  for (const [key, value] of Object.entries(input.revision_strategy.adaptations)) {
    output[`revision_strategy.adaptations.${key}`] = value;
  }
  for (const [key, value] of Object.entries(input.critical_decision)) {
    if (typeof value === "string") output[`critical_decision.${key}`] = value;
  }
  output["constraint.summary"] = input.constraint.summary;
  output["constraint.business_impact"] = input.constraint.business_impact;
  return output;
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en");
}

export function validateEvidence(input: EvaluationInput, evidence: Evidence) {
  const source = flattenSources(input)[evidence.source_path];
  return Boolean(source && normalize(source).includes(normalize(evidence.exact_quote)));
}

export function validateEvidenceSet(input: EvaluationInput, evidence: Evidence[]) {
  return evidence.map((item) => ({ ...item, valid: validateEvidence(input, item) }));
}

export function invalidPositiveRatio(
  validated: Array<Evidence & { valid: boolean }>,
) {
  const positive = validated.filter((item) => item.kind === "positive");
  if (positive.length === 0) return 1;
  return positive.filter((item) => !item.valid).length / positive.length;
}

