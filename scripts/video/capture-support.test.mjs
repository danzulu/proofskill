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
