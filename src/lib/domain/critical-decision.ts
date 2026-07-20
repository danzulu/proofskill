import type { CriticalDecision } from "./assessment";
import { criticalDecisionSchema } from "./assessment";
import { ECOMMERCE_SCENARIO } from "./scenario";

export const decisionDetailKeys = ["rationale", "first_action", "guardrail"] as const;
export type DecisionDetailKey = (typeof decisionDetailKeys)[number];

export type GuidedDecisionSelections = {
  choice: string;
  rationale: string;
  first_action: string;
  guardrail: string;
};

export function buildGuidedCriticalDecision(
  selections: GuidedDecisionSelections,
): CriticalDecision | null {
  const detailResponses = Object.fromEntries(
    decisionDetailKeys.map((key) => [
      key,
      ECOMMERCE_SCENARIO.criticalDecision.details[key].choices.find(
        (choice) => choice.id === selections[key],
      )?.response ?? "",
    ]),
  );
  const parsed = criticalDecisionSchema.safeParse({
    choice: selections.choice,
    ...detailResponses,
  });
  return parsed.success ? parsed.data : null;
}
