import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  CLIPS,
  PRODUCTION_URL,
  assertFreshOutputDirectory,
  requireCaptureCredentials,
} from "./capture-support.mjs";

const outputDirectory = path.resolve("submission-video/raw");
const dryRun = process.argv.includes("--dry-run");
const credentials = requireCaptureCredentials(process.env);
assertFreshOutputDirectory(outputDirectory);
await mkdir(outputDirectory, { recursive: true });

if (dryRun) {
  console.log(JSON.stringify({ baseURL: PRODUCTION_URL, clips: CLIPS }, null, 2));
  process.exit(0);
}

let browser;
let context;
let page;

async function closeCaptureHandle(handle) {
  if (handle) await handle.close();
}

async function hold(milliseconds = 900) {
  await page.waitForTimeout(milliseconds);
}

async function hideJudgeEmail() {
  await page.evaluate((email) => {
    for (const element of document.querySelectorAll("p")) {
      if (element.textContent?.trim() === email) element.textContent = "Private judge account";
    }
  }, credentials.email);
}

async function clip(name, scenario) {
  await page.screencast.start({
    path: path.join(outputDirectory, name),
    size: { width: 1920, height: 1080 },
    quality: 90,
  });
  try {
    await hold(1000);
    await scenario();
    await hold(1400);
  } finally {
    await page.screencast.stop();
  }
}

try {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    baseURL: PRODUCTION_URL,
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  page = await context.newPage();
  await page.addInitScript((email) => {
    const redact = () => {
      for (const element of document.querySelectorAll("p")) {
        if (element.textContent?.trim() === email) {
          element.textContent = "Private judge account";
        }
      }
    };

    new MutationObserver(redact).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    redact();
  }, credentials.email);

  await page.goto("/login?next=/dashboard");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await Promise.all([
    page.waitForURL("**/dashboard", { timeout: 30_000 }),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);

  let sessionId = "";

  await page.goto("/dashboard");
  await hideJudgeEmail();
  await clip(CLIPS[0], async () => {
    await expect(page.getByRole("heading", { name: "Your proof, over time" })).toBeVisible();
    await page.getByRole("link", { name: "New assessment" }).hover();
  });

  await page.goto("/assessment/new");
  await clip(CLIPS[1], async () => {
    await page.getByRole("button", { name: "Start live assessment" }).click();
    await page.waitForURL(/\/assessment\/[^/]+\/challenge$/, { timeout: 30_000 });
    sessionId = new URL(page.url()).pathname.split("/")[2];
    const choices = [
      "problem-mobile_friction",
      "target_customer-returning_mobile",
      "value_proposition-faster_checkout",
      "solution-express_checkout",
      "acquisition-checkout_trigger",
      "retention-remember_preferences",
      "revenue-conversion_without_discount",
      "success_metrics-completion_and_margin",
    ];
    for (const [index, id] of choices.entries()) {
      await page.locator(`label[for="${id}"]`).click();
      await hold(550);
      if (index < choices.length - 1) {
        await page.getByRole("button", { name: "Continue", exact: true }).click();
      }
    }
    await page.getByRole("button", { name: "Submit strategy" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "GPT-5.6 is creating your pressure test" }),
    ).toBeVisible({ timeout: 15_000 });
    await page.waitForURL(`**/assessment/${sessionId}/constraint`, { timeout: 90_000 });
  });

  await clip(CLIPS[2], async () => {
    await expect(page.getByText("New constraint", { exact: true })).toBeVisible();
    await expect(page.getByText("Business impact:", { exact: true })).toBeVisible();
    await hold(1800);
  });

  const revisionChoices = {
    "Open Problem": "field:problem-protect_economics",
    "Open Target customer": "field:target_customer-highest_intent",
    "Open Value proposition": "field:value_proposition-remove_effort",
    "Open Solution": "field:solution-reduce_scope",
    "Open Acquisition": "field:acquisition-intent_trigger",
    "Open Retention": "field:retention-reduce_next_effort",
    "Open Revenue logic": "field:revenue-margin_floor",
    "Open Success metrics": "field:success_metrics-signal_outcome_guardrail",
    "Open Keep": "strategy:keep-economic_guardrail",
    "Open Remove": "strategy:remove-bundled_scope",
    "Open Measure": "strategy:measure-control_comparison",
  };

  await clip(CLIPS[3], async () => {
    const stepButtons = page.locator('button[aria-label^="Open "]');
    const stepCount = await stepButtons.count();

    for (let index = 0; index < stepCount; index += 1) {
      const activeStep = page.locator('button[aria-label^="Open "][aria-current="step"]');
      const stepLabel = await activeStep.getAttribute("aria-label");
      const choiceId = revisionChoices[stepLabel];
      if (!choiceId) throw new Error(`No approved revision choice for ${stepLabel}`);

      await page.locator(`label[for="${choiceId}"]`).click();
      await hold(650);
      if (index < stepCount - 1) {
        await page.getByRole("button", { name: "Continue", exact: true }).click();
      }
    }

    const lockRevision = page.getByRole("button", { name: "Lock revision" });
    await expect(lockRevision).toBeEnabled();
    await lockRevision.click();
    await expect(page.getByRole("status").filter({ hasText: "Revision locked" })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForURL(`**/assessment/${sessionId}/decision`, { timeout: 30_000 });
  });

  await clip(CLIPS[4], async () => {
    for (const id of [
      "choice-balanced_experiment",
      "rationale-buy_evidence",
      "first_action-create_control",
      "guardrail-lift_not_reached",
    ]) {
      await page.locator(`label[for="${id}"]`).click();
      await hold(650);
    }
    await page.getByRole("button", { name: "Submit for evaluation" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "GPT-5.6 is evaluating your evidence" }),
    ).toBeVisible({ timeout: 15_000 });
    await page.waitForURL(`**/results/${sessionId}`, { timeout: 90_000 });
  });

  await clip(CLIPS[5], async () => {
    await expect(page.getByRole("heading", { name: "Your evidence report" })).toBeVisible();
    for (const label of ["Verified evidence", "Before → after", "Main gap", "Next challenge"]) {
      const section = page.getByText(label, { exact: true }).first();
      await expect(section).toBeVisible();
      await section.evaluate((element) =>
        element.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      await hold(1300);
    }
  });

  await clip(CLIPS[6], async () => {
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 30_000 }),
      page.getByRole("link", { name: "Back to dashboard" }).click(),
    ]);
    await hideJudgeEmail();
    await hold(1000);

    const savedReport = page.locator(`a[href="/results/${sessionId}"]`);
    await expect(savedReport).toBeVisible();
    await savedReport.hover();
    await hold(700);
    await Promise.all([
      page.waitForURL(`**/results/${sessionId}`, { timeout: 30_000 }),
      savedReport.click(),
    ]);
    await expect(page.getByRole("heading", { name: "Your evidence report" })).toBeVisible();
  });
} finally {
  await Promise.allSettled([
    closeCaptureHandle(context),
    closeCaptureHandle(browser),
  ]);
}
