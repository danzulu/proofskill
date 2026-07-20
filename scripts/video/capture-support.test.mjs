import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as captureSupport from "./capture-support.mjs";

const {
  CLIPS,
  PRODUCTION_URL,
  requireCaptureCredentials,
  validateProbe,
} = captureSupport;

const captureScript = readFileSync(new URL("./capture-demo-clips.mjs", import.meta.url), "utf8");

test("defines exactly seven unique approved WebM clips", () => {
  assert.deepEqual(CLIPS, [
    "01-dashboard.webm",
    "02-guided-strategy.webm",
    "03-adaptive-constraint.webm",
    "04-guided-revision.webm",
    "05-critical-decision.webm",
    "06-evidence-report.webm",
    "07-persistence.webm",
  ]);
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
      streams: [{
        codec_type: "video",
        codec_name: "vp8",
        width: 1920,
        height: 1080,
        sample_aspect_ratio: "1:1",
        display_aspect_ratio: "16:9",
        r_frame_rate: "25/1",
        tags: { ENCODER: "Lavc61.3.100 libvpx", DURATION: "00:00:04.200000000" },
      }],
      format: {
        format_name: "matroska,webm",
        duration: "4.2",
        tags: { ENCODER: "Lavf61.1.100" },
      },
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
    sample_aspect_ratio: "1:1",
    display_aspect_ratio: "16:9",
    r_frame_rate: "25/1",
    tags: { ENCODER: "Lavc61.3.100 libvpx", DURATION: "00:00:04.200000000" },
  };
  const validProbe = {
    streams: [validVideo],
    format: {
      format_name: "matroska,webm",
      duration: "4.2",
      tags: { ENCODER: "Lavf61.1.100" },
    },
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
    ["Matroska without WebM", { ...validProbe, format: { ...validProbe.format, format_name: "matroska" } }, /WebM container/],
    ["non-square pixels", { ...validProbe, streams: [{ ...validVideo, sample_aspect_ratio: "4:3" }] }, /sample aspect ratio 1:1/],
    ["wrong display ratio", { ...validProbe, streams: [{ ...validVideo, display_aspect_ratio: "4:3" }] }, /display aspect ratio 16:9/],
    ["rotation", { ...validProbe, streams: [{ ...validVideo, side_data_list: [{ rotation: 90 }] }] }, /rotation or transform/],
    ["transform", { ...validProbe, streams: [{ ...validVideo, transform: "1" }] }, /rotation or transform/],
    ["container title", { ...validProbe, format: { ...validProbe.format, tags: { title: "private" } } }, /unexpected metadata tag/],
    ["stream comment", { ...validProbe, streams: [{ ...validVideo, tags: { COMMENT: "private" } }] }, /unexpected metadata tag/],
    ["stream description", { ...validProbe, streams: [{ ...validVideo, tags: { description: "private" } }] }, /unexpected metadata tag/],
    ["email hidden under encoder", { ...validProbe, format: { ...validProbe.format, tags: { ENCODER: "judge@example.com" } } }, /invalid ENCODER metadata/],
    ["secret hidden under encoder", { ...validProbe, streams: [{ ...validVideo, tags: { ENCODER: "secret-token" } }] }, /invalid ENCODER metadata/],
    ["password hidden under duration", { ...validProbe, streams: [{ ...validVideo, tags: { DURATION: "password123" } }] }, /invalid DURATION metadata/],
    ["invalid clock duration", { ...validProbe, streams: [{ ...validVideo, tags: { DURATION: "00:61:00.000" } }] }, /invalid DURATION metadata/],
  ];

  for (const [name, probe, expected] of cases) {
    assert.match(validateProbe(probe).join("\n"), expected, name);
  }
});

test("rejects an infinite duration", () => {
  assert.match(
    validateProbe({
      streams: [{ codec_type: "video", codec_name: "vp8", width: 1920, height: 1080, sample_aspect_ratio: "1:1", display_aspect_ratio: "16:9", r_frame_rate: "25/1" }],
      format: { format_name: "matroska,webm", duration: "Infinity", tags: { ENCODER: "Lavf61.1.100" } },
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
      streams: [{ codec_type: "video", codec_name: "vp8", width: 1920, height: 1080, sample_aspect_ratio: "1:1", display_aspect_ratio: "16:9", r_frame_rate: `${numerator}/${denominator}` }],
      format: { format_name: "matroska,webm", duration: "4.2", tags: { ENCODER: "Lavf61.1.100" } },
      chapters: [],
    }).join("\n"),
    /positive frame rate/,
  );
});

test("matches only the expected pathname on the exact Production origin", () => {
  assert.equal(typeof captureSupport.isExpectedProductionRoute, "function");
  const productionOrigin = new URL(PRODUCTION_URL).origin;

  assert.equal(
    captureSupport.isExpectedProductionRoute(
      new URL(`${productionOrigin}/assessment/session-1/challenge`),
      productionOrigin,
      /^\/assessment\/[^/]+\/challenge$/,
    ),
    true,
  );
  assert.equal(
    captureSupport.isExpectedProductionRoute(
      new URL("https://attacker.example/assessment/session-1/challenge"),
      productionOrigin,
      /^\/assessment\/[^/]+\/challenge$/,
    ),
    false,
  );
  assert.equal(
    captureSupport.isExpectedProductionRoute(
      new URL(`${productionOrigin}/login-redirect`),
      productionOrigin,
      "/login",
    ),
    false,
  );
});

test("preserves the scenario failure when screencast stop also fails", async () => {
  assert.equal(typeof captureSupport.completeClipCapture, "function");
  const scenarioFailure = new Error("ambiguous mutation");
  let stopAttempted = false;

  await assert.rejects(
    captureSupport.completeClipCapture({
      scenario: async () => { throw scenarioFailure; },
      stop: async () => {
        stopAttempted = true;
        throw new Error("stop failed");
      },
    }),
    (error) => error === scenarioFailure,
  );
  assert.equal(stopAttempted, true);
});

test("fails a clip when screencast stop is the only failure", async () => {
  assert.equal(typeof captureSupport.completeClipCapture, "function");
  const stopFailure = new Error("stop failed");

  await assert.rejects(
    captureSupport.completeClipCapture({
      scenario: async () => {},
      stop: async () => { throw stopFailure; },
    }),
    (error) => error === stopFailure,
  );
});

test("announces clip success only after scenario and stop succeed", async () => {
  assert.equal(typeof captureSupport.completeClipCapture, "function");
  const events = [];

  await captureSupport.completeClipCapture({
    scenario: async () => events.push("scenario"),
    stop: async () => events.push("stop"),
    onSuccess: () => events.push("success"),
  });
  assert.deepEqual(events, ["scenario", "stop", "success"]);

  for (const failingStep of ["scenario", "stop"]) {
    const failureEvents = [];
    await assert.rejects(
      captureSupport.completeClipCapture({
        scenario: async () => {
          failureEvents.push("scenario");
          if (failingStep === "scenario") throw new Error("scenario failed");
        },
        stop: async () => {
          failureEvents.push("stop");
          if (failingStep === "stop") throw new Error("stop failed");
        },
        onSuccess: () => failureEvents.push("success"),
      }),
    );
    assert.equal(failureEvents.includes("success"), false, failingStep);
  }
});

test("sanitizes the probe filename without mutating the original probe", () => {
  assert.equal(typeof captureSupport.sanitizeProbeForManifest, "function");
  const probe = {
    format: { filename: "C:\\private\\capture\\01-dashboard.webm", duration: "2.4" },
    streams: [{ codec_type: "video" }],
  };

  const sanitized = captureSupport.sanitizeProbeForManifest(probe, "01-dashboard.webm");

  assert.equal(sanitized.format.filename, "01-dashboard.webm");
  assert.equal(probe.format.filename, "C:\\private\\capture\\01-dashboard.webm");
  assert.doesNotMatch(JSON.stringify(sanitized), /C:\\\\private/);
});

test("requires full decode progress to report a positive final frame count", () => {
  assert.equal(typeof captureSupport.requirePositiveDecodedFrameCount, "function");
  assert.equal(
    captureSupport.requirePositiveDecodedFrameCount("frame=1\nframe=42\nprogress=end\n"),
    42,
  );
  assert.equal(
    captureSupport.requirePositiveDecodedFrameCount("frame=1\r\nframe=42\r\nprogress=end\r\n"),
    42,
  );
  assert.throws(
    () => captureSupport.requirePositiveDecodedFrameCount("frame=0\nprogress=end\n"),
    /positive decoded-frame count/,
  );
  assert.throws(
    () => captureSupport.requirePositiveDecodedFrameCount("progress=end\n"),
    /positive decoded-frame count/,
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

test("checks the exact Production origin and login pathname before filling credentials", () => {
  const originIndex = captureScript.indexOf("new URL(PRODUCTION_URL).origin");
  const loginCheckIndex = captureScript.indexOf(
    'assertExpectedProductionRoute(new URL(page.url()), productionOrigin, "/login")',
  );
  const emailFillIndex = captureScript.indexOf('getByLabel("Email").fill(credentials.email)');

  assert.ok(originIndex >= 0, "expected the exact Production origin");
  assert.ok(loginCheckIndex > originIndex, "expected the login route check after origin setup");
  assert.ok(emailFillIndex > loginCheckIndex, "expected route validation before credential fill");
});

test("uses origin-aware predicates for every asynchronous URL transition", () => {
  const waitCount = captureScript.match(/page\.waitForURL\(/g)?.length ?? 0;
  const guardedWaitCount = captureScript.match(
    /page\.waitForURL\(\s*\(url\) => isExpectedProductionRoute\(/g,
  )?.length ?? 0;

  assert.ok(waitCount >= 7, "expected all route transitions");
  assert.equal(guardedWaitCount, waitCount);
  assert.doesNotMatch(captureScript, /page\.waitForURL\(["'`]/);
});

test("emits a per-clip success message through the post-stop success hook", () => {
  assert.match(
    captureScript,
    /onSuccess: \(\) => console\.log\(`Captured \$\{name\}`\)/,
  );
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
