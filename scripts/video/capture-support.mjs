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
  if (video[0] && !hasPositiveFrameRate(video[0].r_frame_rate)) errors.push("expected positive frame rate");
  if (!(Number(probe.format?.duration) > 0)) errors.push("expected positive duration");
  if ((probe.chapters?.length ?? 0) > 0) errors.push("expected no chapters");
  for (const tags of [probe.format?.tags, ...video.map((stream) => stream.tags)]) {
    for (const tag of Object.keys(tags ?? {})) {
      if (!isTechnicalTag(tag)) errors.push(`unexpected metadata tag: ${tag}`);
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
  return Number.isFinite(numerator) && Number.isFinite(denominator) && numerator > 0 && denominator > 0;
}

function isTechnicalTag(tag) {
  return ["encoder", "duration"].includes(tag.toLowerCase());
}
