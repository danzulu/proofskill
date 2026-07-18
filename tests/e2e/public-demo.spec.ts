import { expect, test } from "@playwright/test";

test("public demo is explicitly labeled as precomputed", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByText("Precomputed public demo")).toBeVisible();
  await expect(page.getByText("Overall score")).toBeVisible();
});

