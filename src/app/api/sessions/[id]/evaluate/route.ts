import { getAssessmentAI } from "@/lib/ai";
import { AssessmentAIError } from "@/lib/ai/live";
import { authenticateApi, fail, ok } from "@/lib/api";
import {
  canvasSchema,
  constraintSchema,
  criticalDecisionSchema,
  evaluationInputSchema,
  revisionStrategySchema,
} from "@/lib/domain/assessment";
import { invalidPositiveRatio, validateEvidenceSet } from "@/lib/domain/evidence";
import { scenarioPrompt } from "@/lib/domain/scenario";
import { RUBRIC_VERSION, scoreEvaluation } from "@/lib/domain/scoring";
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
  if (session.status === "completed") return ok({ id }, "/results/" + id);
  if (session.status !== "evaluating") {
    return fail("STATE_CONFLICT", "Submit the critical decision first.", 409);
  }

  try {
    const input = evaluationInputSchema.parse({
      scenario: scenarioPrompt(),
      initial_canvas: canvasSchema.parse(session.initial_canvas),
      constraint: constraintSchema.parse(session.constraint_payload),
      revised_canvas: canvasSchema.parse(session.revised_canvas),
      revision_strategy: revisionStrategySchema.parse(session.revision_strategy),
      critical_decision: criticalDecisionSchema.parse(session.critical_decision),
    });
    const ai = getAssessmentAI(session.run_mode);
    let draft = await ai.evaluate(input, user.id);
    let validated = validateEvidenceSet(input, draft.evidence);
    if (invalidPositiveRatio(validated) > 0.3) {
      draft = await ai.evaluate(input, user.id);
      validated = validateEvidenceSet(input, draft.evidence);
    }
    const hasInvalidPositive = validated.some(
      (item) => item.kind === "positive" && !item.valid,
    );
    const scored = scoreEvaluation(
      draft,
      input.constraint,
      input.revision_strategy,
      hasInvalidPositive,
    );
    const admin = getAdminClient();
    const model =
      session.run_mode === "fixture"
        ? "fixture-v1"
        : process.env.OPENAI_MODEL || "gpt-5.6-sol";
    const { data: evaluation, error: evaluationError } = await admin
      .from("evaluations")
      .upsert(
        {
          session_id: id,
          total_score: scored.total_score,
          level: scored.level,
          competency_scores: scored.competency_scores,
          rubric_version: RUBRIC_VERSION,
          model,
          deterministic_adjustments: scored.deterministic_adjustments,
          contradictions: scored.contradictions,
          summary: scored.summary,
          main_gap: scored.main_gap,
          next_challenge: scored.next_challenge,
        },
        { onConflict: "session_id", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();
    if (evaluationError) throw evaluationError;
    const evaluationId =
      evaluation?.id ||
      (
        await admin
          .from("evaluations")
          .select("id")
          .eq("session_id", id)
          .single()
      ).data?.id;
    if (!evaluationId) throw new Error("Evaluation idempotency lookup failed.");

    const { count } = await admin
      .from("evidence_items")
      .select("id", { count: "exact", head: true })
      .eq("evaluation_id", evaluationId);
    if (!count) {
      const { error: evidenceError } = await admin.from("evidence_items").insert(
        validated.map((item) => ({
          evaluation_id: evaluationId,
          session_id: id,
          competency: item.competency,
          kind: item.kind,
          source_path: item.source_path,
          exact_quote: item.exact_quote,
          valid: item.valid,
          explanation: item.explanation,
        })),
      );
      if (evidenceError) throw evidenceError;
    }

    const { error: completionError } = await admin
      .from("assessment_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "evaluating");
    if (completionError) throw completionError;
    await recordAIRun({
      sessionId: id,
      kind: "evaluation",
      runMode: session.run_mode,
      status: "succeeded",
      latencyMs: Date.now() - started,
    });
    return ok(
      { total_score: scored.total_score, level: scored.level },
      "/results/" + id,
    );
  } catch (error) {
    const aiError = error instanceof AssessmentAIError ? error : null;
    await getAdminClient()
      .from("assessment_sessions")
      .update({
        status: "critical_decision",
        evaluation_claimed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "evaluating");
    await recordAIRun({
      sessionId: id,
      kind: "evaluation",
      runMode: session.run_mode,
      status: "failed",
      latencyMs: Date.now() - started,
      errorCode: aiError?.code || "EVALUATION_FAILED",
    });
    return fail(
      aiError?.code || "EVALUATION_FAILED",
      aiError?.message || "The evaluation could not be completed.",
      502,
      aiError?.retryable ?? true,
    );
  }
}

