import { z } from "zod";
import { authenticateApi, fail, ok } from "@/lib/api";
import { canvasSchema, constraintSchema, revisionStrategySchema } from "@/lib/domain/assessment";
import { getOwnedSession } from "@/lib/sessions";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  revised_canvas: canvasSchema,
  revision_strategy: revisionStrategySchema,
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await authenticateApi();
  if (!user) return fail("UNAUTHENTICATED", "Sign in to continue.", 401);
  const { id } = await params;
  const session = await getOwnedSession(id, user.id);
  if (!session) return fail("NOT_FOUND", "Session not found.", 404);
  if (session.status !== "constraint") return fail("STATE_CONFLICT", "The constraint is not ready.", 409);
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("INVALID_REVISION", "Complete the revised canvas and strategy.", 400);
  const constraint = constraintSchema.parse(session.constraint_payload);
  const missing = constraint.affected_fields.filter(
    (field) => !parsed.data.revision_strategy.adaptations[field]?.trim(),
  );
  if (missing.length) {
    return fail("MISSING_ADAPTATIONS", "Explain an adaptation for every affected field.", 400);
  }

  const admin = getAdminClient();
  const { data: revision } = await admin
    .from("assessment_sessions")
    .update({
      revised_canvas: parsed.data.revised_canvas,
      revision_strategy: parsed.data.revision_strategy,
      status: "revision_submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "constraint")
    .select("id")
    .maybeSingle();
  if (!revision) return fail("STATE_CONFLICT", "The revision was already submitted.", 409);
  const { data, error } = await admin
    .from("assessment_sessions")
    .update({ status: "critical_decision", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "revision_submitted")
    .select("id,status")
    .single();
  if (error) return fail("DATABASE_ERROR", "Could not advance the session.", 500, true);
  return ok(data, "/assessment/" + id + "/decision");
}

