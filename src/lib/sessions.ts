import "server-only";

import type { AssessmentStatus, RunMode } from "@/lib/domain/assessment";
import { getAdminClient } from "@/lib/supabase/admin";

export type SessionRecord = {
  id: string;
  user_id: string;
  scenario_id: string;
  scenario_version: string;
  difficulty: "Intermediate";
  run_mode: RunMode;
  status: AssessmentStatus;
  initial_canvas: unknown | null;
  constraint_payload: unknown | null;
  revised_canvas: unknown | null;
  revision_strategy: unknown | null;
  critical_decision: unknown | null;
  evaluation_claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getOwnedSession(sessionId: string, userId: string) {
  const { data, error } = await getAdminClient()
    .from("assessment_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as SessionRecord | null;
}

export async function recordAIRun(input: {
  sessionId: string;
  kind: "constraint" | "evaluation";
  runMode: RunMode;
  status: "succeeded" | "failed";
  latencyMs: number;
  errorCode?: string;
}) {
  const model =
    input.runMode === "fixture"
      ? "fixture-v1"
      : process.env.OPENAI_MODEL || "gpt-5.6-sol";
  await getAdminClient().from("ai_runs").insert({
    session_id: input.sessionId,
    kind: input.kind,
    model,
    run_mode: input.runMode,
    status: input.status,
    latency_ms: input.latencyMs,
    error_code: input.errorCode ?? null,
  });
}

