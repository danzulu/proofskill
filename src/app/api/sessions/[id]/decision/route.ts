import { authenticateApi, fail, ok } from "@/lib/api";
import { criticalDecisionSchema } from "@/lib/domain/assessment";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await authenticateApi();
  if (!user) return fail("UNAUTHENTICATED", "Sign in to continue.", 401);
  const { id } = await params;
  const parsed = criticalDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("INVALID_DECISION", "Make the decision and explain the trade-off.", 400);
  const { data, error } = await getAdminClient()
    .from("assessment_sessions")
    .update({
      critical_decision: parsed.data,
      status: "evaluating",
      evaluation_claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "critical_decision")
    .select("id,status")
    .maybeSingle();
  if (error) return fail("DATABASE_ERROR", "Could not save the decision.", 500, true);
  if (!data) return fail("STATE_CONFLICT", "The decision was already submitted.", 409);
  return ok(data);
}

