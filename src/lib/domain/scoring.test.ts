import { describe, expect, it } from "vitest";
import type { EvaluationDraft } from "./assessment";
import { scoreEvaluation } from "./scoring";

const draft: EvaluationDraft = {
  competency_scores: {
    problem_framing: 90,
    customer_insight: 90,
    strategic_coherence: 90,
    adaptability: 95,
    prioritization: 90,
    measurement: 90,
    decision_quality: 90,
  },
  evidence: [],
  contradictions: [],
  main_gap: "A sufficiently specific gap for this deterministic scoring test.",
  next_challenge: "A sufficiently specific next challenge for the learner.",
  summary: "A sufficiently detailed evaluation summary for the scoring test.",
};

describe("deterministic scoring", () => {
  it("caps unverifiable positive reports below proficient", () => {
    const result = scoreEvaluation(
      draft,
      {
        title: "Constraint title",
        summary: "A material constraint changes the available acquisition channel.",
        affected_fields: ["acquisition", "solution"],
        business_impact: "The original plan can no longer rely on its primary growth lever.",
        time_pressure: "Launch within fourteen days.",
      },
      {
        adaptations: {
          acquisition: "Move the experiment to an owned lifecycle channel.",
          solution: "Reduce the first release to a checkout guidance test.",
        },
        keep: "Keep the high-intent customer segment and margin guardrail.",
        remove: "Remove the broad discount that obscures causal learning.",
        measure: "Measure checkout completion and contribution margin.",
      },
      true,
    );
    expect(result.total_score).toBe(69);
    expect(result.level).toBe("Developing");
    expect(result.deterministic_adjustments[0]).toContain("evidence");
  });
});

