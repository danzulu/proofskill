import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CLIPS,
  requireCaptureCredentials,
  validateProbe,
} from "./capture-support.mjs";

const captureScript = readFileSync(new URL("./capture-demo-clips.mjs", import.meta.url), "utf8");

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

test("installs an exact paragraph email mask before the first navigation", () => {
  const maskIndex = captureScript.indexOf("await page.addInitScript");
  const navigationIndex = captureScript.indexOf('await page.goto("/login?next=/dashboard")');

  assert.ok(maskIndex >= 0, "expected a persistent page init script");
  assert.ok(maskIndex < navigationIndex, "expected the mask before the first navigation");
  assert.match(captureScript, /new MutationObserver/);
  assert.match(captureScript, /querySelectorAll\("p"\)/);
  assert.match(captureScript, /textContent\?\.trim\(\) === email/);
});

test("guards browser handles and attempts context and browser cleanup independently", () => {
  assert.match(captureScript, /let browser;\s+let context;\s+let page;/);
  assert.match(captureScript, /try \{\s+browser = await chromium\.launch/);
  assert.match(captureScript, /async function closeCaptureHandle\(handle\)/);
  assert.match(
    captureScript,
    /Promise\.allSettled\(\[\s*closeCaptureHandle\(context\),\s*closeCaptureHandle\(browser\),?\s*\]\)/,
  );
});
