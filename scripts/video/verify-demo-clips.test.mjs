import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CLIPS } from "./capture-support.mjs";

const verifierPath = new URL("./verify-demo-clips.mjs", import.meta.url);
const verifierSource = readFileSync(verifierPath, "utf8");

function validProbe(filename) {
  return {
    streams: [{
      codec_type: "video",
      codec_name: "vp8",
      width: 1920,
      height: 1080,
      sample_aspect_ratio: "1:1",
      display_aspect_ratio: "16:9",
      r_frame_rate: "25/1",
      tags: { ENCODER: "Lavc61.3.100 libvpx", DURATION: "00:00:02.400000000" },
    }],
    format: {
      filename,
      format_name: "matroska,webm",
      duration: "2.4",
      tags: { ENCODER: "Lavf61.1.100" },
    },
    chapters: [],
  };
}

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "proofskill-video-verifier-"));
  const rawDirectory = path.join(root, "raw");
  const resultsRoot = path.join(root, "results");
  mkdirSync(rawDirectory);
  for (const name of CLIPS) writeFileSync(path.join(rawDirectory, name), `fixture:${name}`);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { rawDirectory, resultsRoot };
}

async function loadVerifier() {
  assert.match(verifierSource, /export function verifyDemoClips/);
  return import(`${verifierPath.href}?test=${Date.now()}-${Math.random()}`);
}

function successfulCommandRunner({ emptyFrame = false, decodedFrames = 12, extraFrame = false } = {}) {
  let wroteExtraFrame = false;
  return (commandName, argumentsList) => {
    if (commandName === "ffprobe") {
      const clipPath = argumentsList.at(-1);
      return JSON.stringify(validProbe(clipPath));
    }
    if (argumentsList.includes("null")) {
      return `frame=${decodedFrames}\nprogress=end\n`;
    }
    const framePath = argumentsList.at(-1);
    writeFileSync(framePath, emptyFrame ? "" : "png fixture");
    if (extraFrame && !wroteExtraFrame) {
      writeFileSync(path.join(path.dirname(framePath), "unexpected.png"), "png fixture");
      wroteExtraFrame = true;
    }
    return "";
  };
}

test("executes the verifier through a process seam and writes a sanitized 21-frame manifest", async (t) => {
  const { rawDirectory, resultsRoot } = fixture(t);
  const { verifyDemoClips } = await loadVerifier();

  const resultsDirectory = verifyDemoClips({
    rawDirectory,
    resultsRoot,
    runCommand: successfulCommandRunner(),
    now: new Date("2026-07-20T12:00:00.000Z"),
  });

  const pngs = readdirSync(resultsDirectory).filter((name) => name.endsWith(".png"));
  assert.equal(pngs.length, 21);
  assert.ok(pngs.every((name) => statSync(path.join(resultsDirectory, name)).size > 0));

  const manifestText = readFileSync(path.join(resultsDirectory, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.clips.length, 7);
  assert.deepEqual(
    manifest.clips.map((clip) => clip.probe.format.filename),
    CLIPS,
  );
  assert.equal(manifestText.includes(rawDirectory), false);
});

test("rejects a successful full-decode process that reports zero decoded frames", async (t) => {
  const { rawDirectory, resultsRoot } = fixture(t);
  const { verifyDemoClips } = await loadVerifier();

  assert.throws(
    () => verifyDemoClips({
      rawDirectory,
      resultsRoot,
      runCommand: successfulCommandRunner({ decodedFrames: 0 }),
    }),
    /positive decoded-frame count/,
  );
});

test("rejects empty extracted PNG outputs even when frame extraction reports success", async (t) => {
  const { rawDirectory, resultsRoot } = fixture(t);
  const { verifyDemoClips } = await loadVerifier();

  assert.throws(
    () => verifyDemoClips({
      rawDirectory,
      resultsRoot,
      runCommand: successfulCommandRunner({ emptyFrame: true }),
    }),
    /non-empty PNG/,
  );
});

test("rejects PNG output sets other than the 21 expected filenames", async (t) => {
  const { rawDirectory, resultsRoot } = fixture(t);
  const { verifyDemoClips } = await loadVerifier();

  assert.throws(
    () => verifyDemoClips({
      rawDirectory,
      resultsRoot,
      runCommand: successfulCommandRunner({ extraFrame: true }),
    }),
    /exactly 21 expected PNG/,
  );
});
