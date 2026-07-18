import type {
  CompetencyKey,
  Constraint,
  EvaluationDraft,
  RevisionStrategy,
} from "./assessment";

export const RUBRIC_VERSION = "education-ecommerce-v1";

const weights: Record<CompetencyKey, number> = {
  problem_framing: 0.14,
  customer_insight: 0.14,
  strategic_coherence: 0.16,
  adaptability: 0.2,
  prioritization: 0.14,
  measurement: 0.1,
  decision_quality: 0.12,
};

export type ScoredEvaluation = EvaluationDraft & {
  total_score: number;
  level: "Foundational" | "Developing" | "Proficient" | "Advanced";
  deterministic_adjustments: string[];
};

function levelFor(score: number): ScoredEvaluation["level"] {
  if (score < 50) return "Foundational";
  if (score < 70) return "Developing";
  if (score < 85) return "Proficient";
  return "Advanced";
}

export function scoreEvaluation(
  draft: EvaluationDraft,
  constraint: Constraint,
  revision: RevisionStrategy,
  hasInvalidPositiveEvidence: boolean,
): ScoredEvaluation {
  const scores = { ...draft.competency_scores };
  const adjustments: string[] = [];
  const missingAdaptations = constraint.affected_fields.filter(
    (key) => !revision.adaptations[key]?.trim(),
  );

  if (missingAdaptations.length > 0 && scores.adaptability > 60) {
    scores.adaptability = 60;
    adjustments.push(
      `Adaptability capped at 60: missing adaptations for ${missingAdaptations.join(", ")}.`,
    );
  }

  let total = Math.round(
    Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + scores[key as CompetencyKey] * weight,
      0,
    ),
  );

  if (hasInvalidPositiveEvidence && total > 69) {
    total = 69;
    adjustments.push("Overall score capped at 69 because positive evidence was not verifiable.");
  }

  return {
    ...draft,
    competency_scores: scores,
    total_score: total,
    level: levelFor(total),
    deterministic_adjustments: adjustments,
  };
}

