import {
  accessSync,
  constants,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  CLIPS,
  requirePositiveDecodedFrameCount,
  sanitizeProbeForManifest,
  validateProbe,
} from "./capture-support.mjs";

function fail(message) {
  throw new Error(`Clip verification failed: ${message}`);
}

function command(commandName, argumentsList) {
  const result = spawnSync(commandName, argumentsList, {
    encoding: "utf8",
    shell: false,
  });
  if (result.error) fail(`${commandName} could not run: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`${commandName} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  }
  return result.stdout;
}

function verifyInputDirectory(rawDirectory) {
  let entries;
  try {
    entries = readdirSync(rawDirectory);
  } catch (error) {
    if (error.code === "ENOENT") fail(`missing required clips: ${CLIPS.join(", ")}`);
    fail(`cannot read input directory: ${error.message}`);
  }

  const missing = CLIPS.filter((name) => !entries.includes(name));
  const unexpected = entries.filter((name) => !CLIPS.includes(name));
  if (missing.length || unexpected.length) {
    const problems = [];
    if (missing.length) problems.push(`missing required clips: ${missing.join(", ")}`);
    if (unexpected.length) problems.push(`unexpected clips: ${unexpected.join(", ")}`);
    fail(problems.join("; "));
  }
}

function readableClip(rawDirectory, name) {
  const clipPath = path.join(rawDirectory, name);
  try {
    if (!statSync(clipPath).isFile()) fail(`unreadable clip: ${name} is not a file`);
    accessSync(clipPath, constants.R_OK);
  } catch (error) {
    if (error.message.startsWith("Clip verification failed:")) throw error;
    fail(`unreadable clip: ${name} (${error.message})`);
  }
  return clipPath;
}

function inspectClip(rawDirectory, name, runCommand) {
  const clipPath = readableClip(rawDirectory, name);
  const stdout = runCommand("ffprobe", [
    "-v", "error",
    "-show_error",
    "-show_format",
    "-show_streams",
    "-show_chapters",
    "-of", "json",
    clipPath,
  ]);
  let probe;
  try {
    probe = JSON.parse(stdout);
  } catch {
    fail(`malformed ffprobe JSON for ${name}`);
  }
  const errors = validateProbe(probe);
  if (errors.length) fail(`${name}: ${errors.join("; ")}`);
  const decodeProgress = runCommand("ffmpeg", [
    "-v", "error",
    "-xerror",
    "-progress", "pipe:1",
    "-nostats",
    "-i", clipPath,
    "-map", "0:v:0",
    "-f", "null",
    "-",
  ]);
  try {
    requirePositiveDecodedFrameCount(decodeProgress);
  } catch (error) {
    fail(`${name}: ${error.message}`);
  }
  return { clipPath, probe };
}

function freshResultsDirectory(resultsRoot, now) {
  mkdirSync(resultsRoot, { recursive: true });
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  for (let suffix = 0; ; suffix += 1) {
    const directory = path.join(resultsRoot, suffix ? `${timestamp}-${suffix}` : timestamp);
    try {
      mkdirSync(directory);
      return directory;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
}

function sha256(clipPath) {
  return createHash("sha256").update(readFileSync(clipPath)).digest("hex");
}

function expectedFrameNames() {
  return CLIPS.flatMap((name) =>
    [10, 50, 90].map((percentage) => `${path.basename(name, ".webm")}-${percentage}.png`),
  );
}

function extractFrames(name, clipPath, duration, resultsDirectory, runCommand) {
  for (const percentage of [10, 50, 90]) {
    const timestamp = (duration * percentage / 100).toFixed(3);
    const framePath = path.join(resultsDirectory, `${path.basename(name, ".webm")}-${percentage}.png`);
    runCommand("ffmpeg", [
      "-v", "error",
      "-xerror",
      "-n",
      "-ss", timestamp,
      "-i", clipPath,
      "-map", "0:v:0",
      "-frames:v", "1",
      framePath,
    ]);
  }
}

function verifyFrameOutputs(resultsDirectory) {
  const expected = expectedFrameNames().sort();
  const actual = readdirSync(resultsDirectory)
    .filter((name) => path.extname(name).toLowerCase() === ".png")
    .sort();
  if (actual.length !== 21 || !expected.every((name, index) => name === actual[index])) {
    fail("expected exactly 21 expected PNG outputs");
  }
  for (const name of expected) {
    const frame = statSync(path.join(resultsDirectory, name));
    if (!frame.isFile() || frame.size <= 0) fail(`expected a non-empty PNG output: ${name}`);
  }
}

export function verifyDemoClips({
  rawDirectory = path.resolve("submission-video/raw"),
  resultsRoot = path.resolve("test-results/video-verification"),
  runCommand = command,
  now = new Date(),
} = {}) {
  verifyInputDirectory(rawDirectory);
  const clips = CLIPS.map((name) => ({
    name,
    ...inspectClip(rawDirectory, name, runCommand),
  }));
  const resultsDirectory = freshResultsDirectory(resultsRoot, now);
  const manifest = clips.map(({ name, clipPath, probe }) => {
    const duration = Number(probe.format.duration);
    extractFrames(name, clipPath, duration, resultsDirectory, runCommand);
    return {
      name,
      sha256: sha256(clipPath),
      duration,
      frameRate: probe.streams.find((stream) => stream.codec_type === "video").r_frame_rate,
      probe: sanitizeProbeForManifest(probe, name),
    };
  });
  verifyFrameOutputs(resultsDirectory);
  writeFileSync(
    path.join(resultsDirectory, "manifest.json"),
    `${JSON.stringify({ clips: manifest }, null, 2)}\n`,
  );
  return resultsDirectory;
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const resultsDirectory = verifyDemoClips();
  console.log(`Verified ${CLIPS.length} clips. QA frames and manifest: ${resultsDirectory}`);
}
