import { describe, expect, it } from "vitest";
import { validateEvidence, validateEvidenceSet } from "./evidence";
import type { EvaluationInput } from "./assessment";

const text = "Mobile shoppers abandon checkout after unexpected delivery costs appear.";
const input = {
  scenario: "E-commerce scenario",
  initial_canvas: {
    problem: text,
    target_customer: "Mobile shoppers making a first purchase during a high-intent session.",
    value_proposition: "Make the full cost and delivery promise clear before checkout begins.",
    solution: "Add early delivery-cost guidance and a simplified mobile checkout flow.",
    acquisition: "Reach existing high-intent visitors through owned onsite placements.",
    retention: "Use a reliable delivery promise to build confidence after the first order.",
    revenue: "Increase completed full-margin orders without a blanket discount.",
    success_metrics: "Track checkout completion, contribution margin, and refund rate.",
  },
  constraint: {
    title: "Paid acquisition is paused",
    summary: "Finance freezes paid acquisition for thirty days after costs rise again.",
    affected_fields: ["acquisition", "solution"] as const,
    business_impact: "The plan loses its largest traffic lever and must use owned channels.",
    time_pressure: "Launch one experiment in fourteen days.",
  },
  revised_canvas: {
    problem: text,
    target_customer: "Mobile shoppers making a first purchase during a high-intent session.",
    value_proposition: "Make the full cost and delivery promise clear before checkout begins.",
    solution: "Ship delivery-cost guidance to high-intent mobile sessions first.",
    acquisition: "Use owned cart recovery and onsite placements instead of paid media.",
    retention: "Use a reliable delivery promise to build confidence after the first order.",
    revenue: "Increase completed full-margin orders without a blanket discount.",
    success_metrics: "Track checkout completion, contribution margin, and refund rate.",
  },
  revision_strategy: {
    adaptations: {
      acquisition: "Replace paid traffic with owned cart recovery and onsite placements.",
      solution: "Limit the first release to mobile delivery-cost guidance.",
    },
    keep: "Keep the segment and margin guardrail.",
    remove: "Remove the paid traffic dependency.",
    measure: "Compare checkout completion and contribution margin.",
  },
  critical_decision: {
    choice: "balanced_experiment" as const,
    rationale: "A bounded experiment preserves learning while protecting the margin guardrail.",
    first_action: "Instrument the eligible mobile cohort and baseline metrics.",
    guardrail: "Stop if contribution margin falls more than two percentage points.",
  },
} satisfies EvaluationInput;

describe("evidence verification", () => {
  it("accepts exact source substrings and rejects invented quotes", () => {
    const valid = {
      competency: "problem_framing" as const,
      kind: "positive" as const,
      source_path: "initial_canvas.problem",
      exact_quote: "unexpected delivery costs",
      explanation: "The proposal identifies the checkout friction.",
    };
    expect(validateEvidence(input, valid)).toBe(true);
    expect(validateEvidence(input, { ...valid, exact_quote: "invented sentence" })).toBe(false);
    expect(validateEvidenceSet(input, [valid])[0].valid).toBe(true);
  });
});

