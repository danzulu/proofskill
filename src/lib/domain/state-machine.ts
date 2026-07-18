import type { AssessmentStatus } from "./assessment";

const transitions: Record<AssessmentStatus, readonly AssessmentStatus[]> = {
  challenge: ["initial_submitted"],
  initial_submitted: ["constraint_generating"],
  constraint_generating: ["constraint", "initial_submitted"],
  constraint: ["revision_submitted"],
  revision_submitted: ["critical_decision"],
  critical_decision: ["evaluating"],
  evaluating: ["completed", "critical_decision"],
  completed: [],
};

export function canTransition(from: AssessmentStatus, to: AssessmentStatus) {
  return transitions[from].includes(to);
}

export function isClaimStale(
  updatedAt: string,
  now = Date.now(),
  thresholdMs = 2 * 60 * 1_000,
) {
  const updated = new Date(updatedAt).getTime();
  return Number.isFinite(updated) && now - updated > thresholdMs;
}

export function nextAssessmentPath(sessionId: string, status: AssessmentStatus) {
  if (status === "challenge" || status === "initial_submitted" || status === "constraint_generating") {
    return `/assessment/${sessionId}/challenge`;
  }
  if (status === "constraint" || status === "revision_submitted") {
    return `/assessment/${sessionId}/constraint`;
  }
  if (status === "critical_decision" || status === "evaluating") {
    return `/assessment/${sessionId}/decision`;
  }
  return `/results/${sessionId}`;
}
