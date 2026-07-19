import { describe, expect, it } from "vitest";
import type { RawDashboardSession } from "./dashboard";
import { getBestDashboardScore, normalizeDashboardSessions } from "./dashboard";

function session(
  evaluations: RawDashboardSession["evaluations"],
  id = "session-1",
): RawDashboardSession {
  return {
    id,
    status: evaluations ? "completed" : "challenge",
    run_mode: "fixture",
    difficulty: "Intermediate",
    created_at: "2026-07-19T00:00:00.000Z",
    completed_at: evaluations ? "2026-07-19T00:10:00.000Z" : null,
    evaluations,
  };
}

describe("dashboard session normalization", () => {
  it("turns a missing one-to-one evaluation into an empty list", () => {
    const [normalized] = normalizeDashboardSessions([session(null)]);
    expect(normalized.evaluations).toEqual([]);
    expect(getBestDashboardScore([normalized])).toBeNull();
  });

  it("normalizes a one-to-one evaluation object and calculates the best score", () => {
    const sessions = normalizeDashboardSessions([
      session({ total_score: 74, level: "Practitioner" }),
      session({ total_score: 88, level: "Adaptive strategist" }, "session-2"),
    ]);
    expect(sessions[0].evaluations).toEqual([{ total_score: 74, level: "Practitioner" }]);
    expect(getBestDashboardScore(sessions)).toBe(88);
  });
});
