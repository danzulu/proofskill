import { describe, expect, it } from "vitest";
import { criticalDecisionSchema } from "./assessment";
import { buildGuidedCriticalDecision } from "./critical-decision";
import { ECOMMERCE_SCENARIO } from "./scenario";

const details = ECOMMERCE_SCENARIO.criticalDecision.details;
const selections = {
  choice: "balanced_experiment",
  rationale: details.rationale.choices[0].id,
  first_action: details.first_action.choices[0].id,
  guardrail: details.guardrail.choices[0].id,
};

describe("guided critical decision", () => {
  it("maps client option ids to the durable prose payload", () => {
    const result = buildGuidedCriticalDecision(selections);
    expect(result).toEqual({
      choice: "balanced_experiment",
      rationale: details.rationale.choices[0].response,
      first_action: details.first_action.choices[0].response,
      guardrail: details.guardrail.choices[0].response,
    });
    expect(criticalDecisionSchema.safeParse(result).success).toBe(true);
  });

  it("rejects incomplete and unknown guided selections", () => {
    expect(buildGuidedCriticalDecision({ ...selections, rationale: "" })).toBeNull();
    expect(buildGuidedCriticalDecision({ ...selections, guardrail: "unknown" })).toBeNull();
  });

  it("keeps legacy authored prose schema-compatible", () => {
    expect(
      criticalDecisionSchema.safeParse({
        choice: "protect_margin",
        rationale: "Protecting contribution quality keeps the experiment economically defensible.",
        first_action: "Define the eligible cohort and baseline performance first.",
        guardrail: "Stop if contribution margin falls below the agreed floor.",
      }).success,
    ).toBe(true);
  });
});
