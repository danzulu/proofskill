# ProofSkill Demo Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record and verify seven clean 1920x1080 WebM clips that show one real authenticated ProofSkill Production assessment from dashboard through persisted report.

**Architecture:** The Codex in-app browser stages and visually verifies each Production scene. A standalone Playwright 1.61 script authenticates before recording and then uses `page.screencast.start()` / `stop()` on one in-memory session so credentials never enter a clip or storage-state file. A separate Node verification script uses FFprobe/FFmpeg 8.1.2 to validate and decode every clip and extract representative QA frames.

**Tech Stack:** Node.js 22, Playwright 1.61.1 Chromium, Playwright page screencast, FFmpeg/FFprobe 8.1.2, Node test runner, PowerShell, ProofSkill Production.

## Global Constraints

- Use only `https://proofskill-blond.vercel.app`.
- Use the existing `JUDGE_EMAIL` and `JUDGE_PASSWORD` from `.env.local`; never print them or write browser storage state to disk.
- Create at most one new Live AI assessment.
- Produce exactly seven files in `submission-video/raw/` using the approved names.
- Capture 1920x1080, 16:9, without browser chrome, desktop notifications, credentials, secrets, or unrelated windows.
- Show processing states briefly and wait semantically for transitions; never replay a non-idempotent action after an ambiguous failure.
- Do not upload to YouTube or mutate Devpost in this plan.
- Generated video and QA artifacts stay out of Git.

---

### Task 1: Capture contract and secret-safe validation

**Files:**
- Create: `scripts/video/capture-support.mjs`
- Create: `scripts/video/capture-support.test.mjs`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Produces: `CLIPS`, `PRODUCTION_URL`, `requireCaptureCredentials(env)`, `assertFreshOutputDirectory(path)`, and `validateProbe(probe)`.
- Consumes: Node `fs`, `path`, and `process.env` only; no application secrets are serialized.

- [ ] **Step 1: Write the failing Node tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  CLIPS,
  requireCaptureCredentials,
  validateProbe,
} from "./capture-support.mjs";

test("defines exactly seven unique approved WebM clips", () => {
  assert.equal(CLIPS.length, 7);
  assert.equal(new Set(CLIPS).size, 7);
  assert.ok(CLIPS.every((name) => /^0[1-7]-[a-z-]+\.webm$/.test(name)));
});

test("requires judge credentials without including values in the error", () => {
  assert.throws(
    () => requireCaptureCredentials({ JUDGE_EMAIL: "", JUDGE_PASSWORD: "" }),
    /JUDGE_EMAIL and JUDGE_PASSWORD are required/,
  );
});

test("accepts one 1920x1080 VP8 video stream with positive duration", () => {
  assert.deepEqual(
    validateProbe({
      streams: [{ codec_type: "video", codec_name: "vp8", width: 1920, height: 1080, r_frame_rate: "25/1" }],
      format: { duration: "4.2", tags: { ENCODER: "Lavf" } },
      chapters: [],
    }),
    [],
  );
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test scripts/video/capture-support.test.mjs`

Expected: FAIL because `capture-support.mjs` does not exist.

- [ ] **Step 3: Implement the minimal support module**

```js
import { existsSync, readdirSync } from "node:fs";

export const PRODUCTION_URL = "https://proofskill-blond.vercel.app";
export const CLIPS = Object.freeze([
  "01-dashboard.webm",
  "02-guided-strategy.webm",
  "03-adaptive-constraint.webm",
  "04-guided-revision.webm",
  "05-critical-decision.webm",
  "06-evidence-report.webm",
  "07-persistence.webm",
]);

export function requireCaptureCredentials(env) {
  const email = env.JUDGE_EMAIL?.trim();
  const password = env.JUDGE_PASSWORD;
  if (!email || !password) {
    throw new Error("JUDGE_EMAIL and JUDGE_PASSWORD are required in .env.local");
  }
  return { email, password };
}

export function assertFreshOutputDirectory(directory) {
  if (!existsSync(directory)) return;
  const conflicts = readdirSync(directory).filter((name) => CLIPS.includes(name));
  if (conflicts.length) {
    throw new Error(`Refusing to overwrite existing clips: ${conflicts.join(", ")}`);
  }
}

export function validateProbe(probe) {
  const errors = [];
  const video = probe.streams?.filter((stream) => stream.codec_type === "video") ?? [];
  const other = probe.streams?.filter((stream) => stream.codec_type !== "video") ?? [];
  if (video.length !== 1) errors.push("expected exactly one video stream");
  if (other.length) errors.push("expected no non-video streams");
  if (video[0] && !["vp8", "vp9", "av1"].includes(video[0].codec_name)) errors.push("unexpected video codec");
  if (video[0] && (video[0].width !== 1920 || video[0].height !== 1080)) errors.push("expected 1920x1080");
  if (!(Number(probe.format?.duration) > 0)) errors.push("expected positive duration");
  if ((probe.chapters?.length ?? 0) > 0) errors.push("expected no chapters");
  return errors;
}
```

Add scripts to `package.json`:

```json
"video:test": "node --test scripts/video/capture-support.test.mjs",
"video:capture": "node --env-file=.env.local scripts/video/capture-demo-clips.mjs",
"video:verify": "node scripts/video/verify-demo-clips.mjs"
```

Add to `.gitignore`:

```gitignore
/submission-video/raw/
```

- [ ] **Step 4: Run GREEN verification**

Run: `npm.cmd run video:test`

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```powershell
git add .gitignore package.json scripts/video/capture-support.mjs scripts/video/capture-support.test.mjs
git commit -m "Add demo capture contract"
```

### Task 2: Production capture automation

**Files:**
- Create: `scripts/video/capture-demo-clips.mjs`

**Interfaces:**
- Consumes: `PRODUCTION_URL`, `CLIPS`, `requireCaptureCredentials`, and `assertFreshOutputDirectory` from Task 1.
- Produces: seven WebM files in `submission-video/raw/` and no persistent auth-state file.

- [ ] **Step 1: Add a dry-run mode before browser implementation**

The script must parse `--dry-run`, validate credentials and output conflicts, print only the Production URL and seven filenames, and exit without launching Chromium.

- [ ] **Step 2: Run dry-run and verify it fails before implementation**

Run: `npm.cmd run video:capture -- --dry-run`

Expected: FAIL because the capture script does not exist.

- [ ] **Step 3: Implement one-session screencast capture**

Use this structure exactly:

```js
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

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  baseURL: PRODUCTION_URL,
  viewport: { width: 1920, height: 1080 },
  screen: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
});
const page = await context.newPage();

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

await page.goto("/login?next=/dashboard");
await page.getByLabel("Email").fill(credentials.email);
await page.getByLabel("Password").fill(credentials.password);
await Promise.all([
  page.waitForURL("**/dashboard", { timeout: 30_000 }),
  page.getByRole("button", { name: "Sign in" }).click(),
]);
```

Then record the approved sequence with semantic locators:

```js
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
  await expect(page.getByRole("status").filter({ hasText: "GPT-5.6 is creating your pressure test" })).toBeVisible({ timeout: 15_000 });
  await page.waitForURL(`**/assessment/${sessionId}/constraint`, { timeout: 90_000 });
});

await clip(CLIPS[2], async () => {
  await expect(page.getByText("New constraint", { exact: true })).toBeVisible();
  await expect(page.getByText("Business impact:", { exact: true })).toBeVisible();
  await hold(1800);
});
```

For revision, loop over the visible `button[aria-label^="Open "]` steps. For each active step, read its `aria-label`, use the approved ID map from the design review, click `label[for="..."]`, and click Continue until `Lock revision` is enabled. The exact map is:

```js
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
```

Record clip 4 through the `Revision locked` status and `/decision`; record clip 5 using:

```js
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
await expect(page.getByRole("status").filter({ hasText: "GPT-5.6 is evaluating your evidence" })).toBeVisible({ timeout: 15_000 });
await page.waitForURL(`**/results/${sessionId}`, { timeout: 90_000 });
```

Record clip 6 by verifying `Your evidence report`, slowly scrolling to `Verified evidence`, `Before → after`, `Main gap`, and `Next challenge`. Record clip 7 by following `Back to dashboard` and the exact `a[href="/results/${sessionId}"]` link. Close context/browser in `finally`; if an ambiguous transition occurs, stop without replaying it and preserve completed clips.

- [ ] **Step 4: Run dry-run GREEN verification**

Run: `npm.cmd run video:capture -- --dry-run`

Expected: Production URL plus exactly seven names; no browser launch and no credential values.

- [ ] **Step 5: Commit**

```powershell
git add scripts/video/capture-demo-clips.mjs
git commit -m "Add Production demo recorder"
```

### Task 3: Clip verification and QA frames

**Files:**
- Create: `scripts/video/verify-demo-clips.mjs`
- Modify: `scripts/video/capture-support.test.mjs`

**Interfaces:**
- Consumes: the seven ignored WebM files and `validateProbe`.
- Produces: timestamped metadata JSON and early/middle/late PNG frames under `test-results/video-verification/<timestamp>/`.

- [ ] **Step 1: Add failing validation tests**

Add cases asserting rejection of 1280x720, an audio stream, zero duration, chapters, unknown codecs, a zero or malformed frame rate, and free-form metadata such as `title`, `comment`, or `description`. The last two cases must fail against the Task 1 implementation so this step genuinely starts RED.

- [ ] **Step 2: Run RED verification**

Run: `npm.cmd run video:test`

Expected: the new cases fail until `validateProbe` covers every condition.

- [ ] **Step 3: Implement the verifier**

Extend `validateProbe` so `r_frame_rate` parses to a finite positive value and so container/stream tags allow only technical encoder metadata (`ENCODER`, `DURATION`, and their lowercase forms). Use `spawnSync` with argument arrays, never shell-built commands. Require exactly the seven approved filenames, run FFprobe with `-show_error -show_format -show_streams -show_chapters -of json`, pass parsed JSON to `validateProbe`, fully decode with `ffmpeg -xerror -i <clip> -map 0:v:0 -f null NUL`, calculate SHA-256, and extract frames at 10%, 50%, and 90% with `-n` into a fresh timestamped QA directory. Fail on missing, unexpected, unreadable, malformed, or metadata-bearing clips.

- [ ] **Step 4: Run GREEN verification against a deliberate empty fixture directory**

Run: `npm.cmd run video:test`

Expected: all support tests pass.

Run: `npm.cmd run video:verify` before capture

Expected: safe failure stating that the seven clips are missing.

- [ ] **Step 5: Commit**

```powershell
git add scripts/video/verify-demo-clips.mjs scripts/video/capture-support.test.mjs scripts/video/capture-support.mjs
git commit -m "Add demo clip verification"
```

### Task 4: Stage, record, inspect, and close Google acceptance

**Files:**
- Generate (ignored): `submission-video/raw/*.webm`
- Generate (ignored): `test-results/video-verification/<timestamp>/**`
- Modify: `docs/PRODUCTION_CHECKLIST.md`
- Modify: `BUILD_WEEK_LOG.md`

**Interfaces:**
- Consumes: Tasks 1–3 and the approved capture design.
- Produces: verified clips plus documentary evidence that Google OAuth and capture passed.

- [ ] **Step 1: Stage the seven scenes in the Codex in-app browser**

Open Production, authenticate if needed, inspect dashboard, assessment entry, and the existing report. Confirm no browser-level warnings or layout breakage at a 1920x1080 viewport. Do not create a new assessment during staging.

- [ ] **Step 2: Execute exactly one capture run**

Run: `npm.cmd run video:capture`

Expected: seven success messages and exactly seven WebM files. If the run stops after a non-idempotent request, inspect the saved dashboard state before any continuation; never rerun the whole script blindly.

- [ ] **Step 3: Verify binaries and metadata**

Run: `npm.cmd run video:verify`

Expected: seven VP8/VP9/AV1 clips, exactly 1920x1080, positive duration, no audio or chapters, successful full decode, SHA-256 manifest, and 21 representative PNG frames.

- [ ] **Step 4: Inspect representative frames**

Open early/middle/late frames for all clips. Reject any clip containing credentials, personal email, desktop content, unreadable text, incomplete loading, error UI, or an incorrect route. Re-record only a safe scene that does not repeat a state mutation; use the persisted report/dashboard for clips 6–7.

- [ ] **Step 5: Run repository checks**

Run: `npm.cmd run video:test`

Expected: all video support tests pass.

Run: `npm.cmd run lint`

Expected: no errors.

- [ ] **Step 6: Update acceptance records and commit**

Mark Google OAuth Production login complete, record the seven verified clips and QA timestamp, and keep the YouTube/upload boxes unchecked.

```powershell
git add docs/PRODUCTION_CHECKLIST.md BUILD_WEEK_LOG.md
git commit -m "Record verified demo capture"
```
