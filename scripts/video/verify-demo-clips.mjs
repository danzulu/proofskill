import { accessSync, constants, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { CLIPS, validateProbe } from "./capture-support.mjs";

const rawDirectory = path.resolve("submission-video/raw");
const resultsRoot = path.resolve("test-results/video-verification");

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

function verifyInputDirectory() {
  let entries;
  try {
    entries = readdirSync(rawDirectory);
  } catch (error) {
    if (error.code === "ENOENT") fail(`missing required clips: ${CLIPS.join(", ")}`);
    fail(`cannot read ${rawDirectory}: ${error.message}`);
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

function readableClip(name) {
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

function inspectClip(name) {
  const clipPath = readableClip(name);
  const stdout = command("ffprobe", [
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
  command("ffmpeg", ["-xerror", "-i", clipPath, "-map", "0:v:0", "-f", "null", "NUL"]);
  return { clipPath, probe };
}

function freshResultsDirectory() {
  mkdirSync(resultsRoot, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
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

function extractFrames(name, clipPath, duration, resultsDirectory) {
  for (const percentage of [10, 50, 90]) {
    const timestamp = (duration * percentage / 100).toFixed(3);
    const framePath = path.join(resultsDirectory, `${path.basename(name, ".webm")}-${percentage}.png`);
    command("ffmpeg", [
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

verifyInputDirectory();
const clips = CLIPS.map((name) => ({ name, ...inspectClip(name) }));
const resultsDirectory = freshResultsDirectory();
const manifest = clips.map(({ name, clipPath, probe }) => {
  const duration = Number(probe.format.duration);
  extractFrames(name, clipPath, duration, resultsDirectory);
  return {
    name,
    sha256: sha256(clipPath),
    duration,
    frameRate: probe.streams.find((stream) => stream.codec_type === "video").r_frame_rate,
    probe,
  };
});
writeFileSync(path.join(resultsDirectory, "manifest.json"), `${JSON.stringify({ clips: manifest }, null, 2)}\n`);
console.log(`Verified ${manifest.length} clips. QA frames and manifest: ${resultsDirectory}`);
