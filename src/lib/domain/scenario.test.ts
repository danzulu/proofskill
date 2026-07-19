import { describe, expect, it } from "vitest";
import { canvasKeys, canvasSchema, revisionStrategySchema } from "./assessment";
import {
  ECOMMERCE_CANVAS_DECISIONS,
  ECOMMERCE_REVISION_DECISIONS,
  ECOMMERCE_REVISION_STRATEGIES,
} from "./scenario";

describe("guided e-commerce canvas", () => {
  it("offers three valid strategic choices for every canvas field", () => {
    const firstChoiceCanvas = Object.fromEntries(
      canvasKeys.map((key) => [key, ECOMMERCE_CANVAS_DECISIONS[key].choices[0].response]),
    );

    expect(canvasSchema.safeParse(firstChoiceCanvas).success).toBe(true);
    for (const key of canvasKeys) {
      const choices = ECOMMERCE_CANVAS_DECISIONS[key].choices;
      expect(choices).toHaveLength(3);
      expect(new Set(choices.map((choice) => choice.id)).size).toBe(3);
    }
  });

  it("offers valid guided revision moves for every field and strategy decision", () => {
    const revisedCanvas = Object.fromEntries(
      canvasKeys.map((key) => [
        key,
        `${ECOMMERCE_CANVAS_DECISIONS[key].choices[0].response} ${ECOMMERCE_REVISION_DECISIONS[key].choices[0].revision}`,
      ]),
    );
    const revisionStrategy = {
      adaptations: Object.fromEntries(
        canvasKeys.map((key) => [
          key,
          ECOMMERCE_REVISION_DECISIONS[key].choices[0].adaptation,
        ]),
      ),
      keep: ECOMMERCE_REVISION_STRATEGIES.keep.choices[0].response,
      remove: ECOMMERCE_REVISION_STRATEGIES.remove.choices[0].response,
      measure: ECOMMERCE_REVISION_STRATEGIES.measure.choices[0].response,
    };

    expect(canvasSchema.safeParse(revisedCanvas).success).toBe(true);
    expect(revisionStrategySchema.safeParse(revisionStrategy).success).toBe(true);
    for (const key of canvasKeys) {
      const choices = ECOMMERCE_REVISION_DECISIONS[key].choices;
      expect(choices).toHaveLength(3);
      expect(new Set(choices.map((choice) => choice.id)).size).toBe(3);
    }
    for (const decision of Object.values(ECOMMERCE_REVISION_STRATEGIES)) {
      expect(decision.choices).toHaveLength(3);
      expect(new Set(decision.choices.map((choice) => choice.id)).size).toBe(3);
    }
  });
});
