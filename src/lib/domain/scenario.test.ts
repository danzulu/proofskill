import { describe, expect, it } from "vitest";
import { canvasKeys, canvasSchema } from "./assessment";
import { ECOMMERCE_CANVAS_DECISIONS } from "./scenario";

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
});
