import { getAssessmentAI } from "@/lib/ai";
import { AssessmentAIError } from "@/lib/ai/live";
import { authenticateApi, fail, ok } from "@/lib/api";
import { canvasSchema, constraintSchema } from "@/lib/domain/assessment";
import { scenarioPrompt } from "@/lib/domain/scenario";
import { isClaimStale } from "@/lib/domain/state-machine";
import { getOwnedSession, recordAIRun } from "@/lib/sessions";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const started = Date.now();
  const { user } = await authenticateApi();
  if (!user) return fail("UNAUTHENTICATED", "Sign in to continue.", 401);
  const { id } = await params;
  const session = await getOwnedSession(id, user.id);
  if (!session) return fail("NOT_FOUND", "Session not found.", 404);
  if (session.status === "constraint" && session.constraint_payload) {
    return ok(constraintSchema.parse(session.constraint_payload), "/assessment/" + id + "/constraint");
  }
  let currentStatus = session.status;
  if (currentStatus === "constraint_generating") {
    if (!isClaimStale(session.updated_at)) {
      return fail("GENERATION_IN_PROGRESS", "Constraint generation is already in progress.", 409, true);
    }
    const { data: recovered } = await getAdminClient()
      .from("assessment_sessions")
      .update({ status: "initial_submitted", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "constraint_generating")
      .select("id")
      .maybeSingle();
    if (!recovered) return fail("STATE_CONFLICT", "The session changed while recovering.", 409, true);
    currentStatus = "initial_submitted";
  }
  if (currentStatus !== "initial_submitted") {
    return fail("STATE_CONFLICT", "The initial proposal must be saved first.", 409);
  }

  const { data: claim } = await getAdminClient()
    .from("assessment_sessions")
    .update({ status: "constraint_generating", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "initial_submitted")
    .select("id")
    .maybeSingle();
  if (!claim) return fail("STATE_CONFLICT", "Constraint generation is already in progress.", 409, true);

  try {
    const initial_canvas = canvasSchema.parse(session.initial_canvas);
    const constraint = await getAssessmentAI(session.run_mode).generateConstraint(
      { scenario: scenarioPrompt(), initial_canvas },
      user.id,
    );
    const { data, error } = await getAdminClient()
      .from("assessment_sessions")
      .update({
        constraint_payload: constraint,
        status: "constraint",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "constraint_generating")
      .select("id,status")
      .single();
    if (error) throw error;
    await recordAIRun({
      sessionId: id,
      kind: "constraint",
      runMode: session.run_mode,
      status: "succeeded",
      latencyMs: Date.now() - started,
    });
    return ok({ ...data, constraint }, "/assessment/" + id + "/constraint");
  } catch (error) {
    await getAdminClient()
      .from("assessment_sessions")
      .update({ status: "initial_submitted", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "constraint_generating");
    const aiError = error instanceof AssessmentAIError ? error : null;
    await recordAIRun({
      sessionId: id,
      kind: "constraint",
      runMode: session.run_mode,
      status: "failed",
      latencyMs: Date.now() - started,
      errorCode: aiError?.code || "CONSTRAINT_FAILED",
    });
    return fail(
      aiError?.code || "CONSTRAINT_FAILED",
      aiError?.message || "Could not generate the constraint.",
      502,
      aiError?.retryable ?? true,
    );
  }
}
