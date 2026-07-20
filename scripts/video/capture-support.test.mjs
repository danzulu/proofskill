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

test("rejects invalid demo clip probe data", () => {
  const validVideo = {
    codec_type: "video",
    codec_name: "vp8",
    width: 1920,
    height: 1080,
    r_frame_rate: "25/1",
  };
  const validProbe = {
    streams: [validVideo],
    format: { duration: "4.2", tags: { ENCODER: "Lavf" } },
    chapters: [],
  };
  const cases = [
    ["1280x720", { ...validProbe, streams: [{ ...validVideo, width: 1280, height: 720 }] }, /1920x1080/],
    ["audio stream", { ...validProbe, streams: [validVideo, { codec_type: "audio", codec_name: "opus" }] }, /no non-video/],
    ["zero duration", { ...validProbe, format: { ...validProbe.format, duration: "0" } }, /positive duration/],
    ["chapters", { ...validProbe, chapters: [{ id: 1 }] }, /no chapters/],
    ["unknown codec", { ...validProbe, streams: [{ ...validVideo, codec_name: "h264" }] }, /unexpected video codec/],
    ["zero frame rate", { ...validProbe, streams: [{ ...validVideo, r_frame_rate: "0/1" }] }, /positive frame rate/],
    ["malformed frame rate", { ...validProbe, streams: [{ ...validVideo, r_frame_rate: "not-a-rate" }] }, /positive frame rate/],
    ["container title", { ...validProbe, format: { ...validProbe.format, tags: { title: "private" } } }, /unexpected metadata tag/],
    ["stream comment", { ...validProbe, streams: [{ ...validVideo, tags: { COMMENT: "private" } }] }, /unexpected metadata tag/],
    ["stream description", { ...validProbe, streams: [{ ...validVideo, tags: { description: "private" } }] }, /unexpected metadata tag/],
  ];

  for (const [name, probe, expected] of cases) {
    assert.match(validateProbe(probe).join("\n"), expected, name);
  }
});

test("rejects an infinite duration", () => {
  assert.match(
    validateProbe({
      streams: [{ codec_type: "video", codec_name: "vp8", width: 1920, height: 1080, r_frame_rate: "25/1" }],
      format: { duration: "Infinity", tags: { ENCODER: "Lavf" } },
      chapters: [],
    }).join("\n"),
    /positive duration/,
  );
});

test("rejects a frame rate whose quotient is infinite", () => {
  const numerator = `1${"0".repeat(308)}`;
  const denominator = `0.${"0".repeat(307)}1`;
  assert.match(
    validateProbe({
      streams: [{ codec_type: "video", codec_name: "vp8", width: 1920, height: 1080, r_frame_rate: `${numerator}/${denominator}` }],
      format: { duration: "4.2", tags: { ENCODER: "Lavf" } },
      chapters: [],
    }).join("\n"),
    /positive frame rate/,
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
