import { describe, expect, it } from "vitest";
import { canTransition, isClaimStale, nextAssessmentPath } from "./state-machine";

describe("assessment state machine", () => {
  it("allows only the expected next state", () => {
    expect(canTransition("challenge", "initial_submitted")).toBe(true);
    expect(canTransition("challenge", "completed")).toBe(false);
    expect(canTransition("completed", "challenge")).toBe(false);
  });

  it("maps resumable states to the correct private route", () => {
    expect(nextAssessmentPath("abc", "constraint")).toBe("/assessment/abc/constraint");
    expect(nextAssessmentPath("abc", "critical_decision")).toBe("/assessment/abc/decision");
    expect(nextAssessmentPath("abc", "completed")).toBe("/results/abc");
  });

  it("detects only claims older than the recovery threshold", () => {
    const now = new Date("2026-07-17T20:00:00Z").getTime();
    expect(isClaimStale("2026-07-17T19:57:00Z", now)).toBe(true);
    expect(isClaimStale("2026-07-17T19:59:00Z", now)).toBe(false);
  });
});
