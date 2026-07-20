import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

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

export function isExpectedProductionRoute(url, productionOrigin, expectedPathname) {
  const candidate = url instanceof URL ? url : new URL(url);
  const pathnameMatches = expectedPathname instanceof RegExp
    ? expectedPathname.test(candidate.pathname)
    : candidate.pathname === expectedPathname;
  return candidate.origin === productionOrigin && pathnameMatches;
}

export function assertExpectedProductionRoute(url, productionOrigin, expectedPathname) {
  if (!isExpectedProductionRoute(url, productionOrigin, expectedPathname)) {
    throw new Error("Refusing to continue after an unexpected origin or pathname");
  }
}

export async function completeClipCapture({ scenario, stop, onSuccess }) {
  let scenarioFailure;
  let stopFailure;
  try {
    await scenario();
  } catch (error) {
    scenarioFailure = error;
  }
  try {
    await stop();
  } catch (error) {
    stopFailure = error;
  }
  if (scenarioFailure) throw scenarioFailure;
  if (stopFailure) throw stopFailure;
  await onSuccess?.();
}

export function sanitizeProbeForManifest(probe, clipName) {
  const sanitized = JSON.parse(JSON.stringify(probe));
  sanitized.format ??= {};
  sanitized.format.filename = path.basename(clipName);
  return sanitized;
}

export function requirePositiveDecodedFrameCount(progressOutput) {
  const frameCounts = [...progressOutput.matchAll(/^frame=(\d+)$/gm)]
    .map((match) => Number(match[1]));
  const decodedFrames = frameCounts.at(-1);
  if (!Number.isSafeInteger(decodedFrames) || decodedFrames <= 0) {
    throw new Error("expected a positive decoded-frame count from full decode");
  }
  return decodedFrames;
}

export function validateProbe(probe) {
  const errors = [];
  const duration = Number(probe.format?.duration);
  const video = probe.streams?.filter((stream) => stream.codec_type === "video") ?? [];
  const other = probe.streams?.filter((stream) => stream.codec_type !== "video") ?? [];
  const formatNames = probe.format?.format_name?.split(",") ?? [];
  if (video.length !== 1) errors.push("expected exactly one video stream");
  if (other.length) errors.push("expected no non-video streams");
  if (!formatNames.includes("webm")) errors.push("expected WebM container");
  if (video[0] && !["vp8", "vp9", "av1"].includes(video[0].codec_name)) errors.push("unexpected video codec");
  if (video[0] && (video[0].width !== 1920 || video[0].height !== 1080)) errors.push("expected 1920x1080");
  if (video[0] && video[0].sample_aspect_ratio !== "1:1") errors.push("expected sample aspect ratio 1:1");
  if (video[0] && video[0].display_aspect_ratio !== "16:9") errors.push("expected display aspect ratio 16:9");
  if (video[0] && !hasPositiveFrameRate(video[0].r_frame_rate)) errors.push("expected positive frame rate");
  if (video[0] && hasNonZeroRotationOrTransform(video[0])) errors.push("expected no non-zero rotation or transform metadata");
  if (!Number.isFinite(duration) || duration <= 0) errors.push("expected positive duration");
  if ((probe.chapters?.length ?? 0) > 0) errors.push("expected no chapters");
  for (const tags of [probe.format?.tags, ...video.map((stream) => stream.tags)]) {
    for (const [tag, value] of Object.entries(tags ?? {})) {
      if (!isTechnicalTag(tag)) {
        errors.push(`unexpected metadata tag: ${tag}`);
      } else if (!isTechnicalMetadataValue(tag, value)) {
        errors.push(`invalid ${tag.toUpperCase()} metadata`);
      }
    }
  }
  return errors;
}

function hasPositiveFrameRate(frameRate) {
  if (typeof frameRate !== "string") return false;
  const match = /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(frameRate);
  if (!match) return false;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  const rate = numerator / denominator;
  return Number.isFinite(numerator) && numerator > 0
    && Number.isFinite(denominator) && denominator > 0
    && Number.isFinite(rate) && rate > 0;
}

function isTechnicalTag(tag) {
  return ["encoder", "duration"].includes(tag.toLowerCase());
}

function isTechnicalMetadataValue(tag, value) {
  if (typeof value !== "string") return false;
  if (tag.toLowerCase() === "encoder") {
    return /^Lav[fc]\d+(?:\.\d+){2}(?: lib(?:vpx(?:-vp9)?|aom-av1))?$/.test(value);
  }
  const duration = /^(\d{2,}):([0-5]\d):([0-5]\d)\.(\d{1,9})$/.exec(value);
  return duration !== null;
}

function hasNonZeroRotationOrTransform(stream) {
  return Object.entries(stream).some(([key, value]) => {
    if (/^(?:rotate|rotation|transform|display_?matrix)$/i.test(key)) {
      return containsNonZeroValue(value);
    }
    return value !== null && typeof value === "object"
      ? hasNonZeroRotationOrTransform(value)
      : false;
  });
}

function containsNonZeroValue(value) {
  if (value !== null && typeof value === "object") {
    return Object.values(value).some(containsNonZeroValue);
  }
  if (typeof value === "number") return !Number.isFinite(value) || value !== 0;
  if (typeof value !== "string" || value.trim() === "") return true;
  const numericValues = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  return numericValues.length === 0 || numericValues.some((numeric) => numeric !== 0);
}
