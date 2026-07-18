import { authenticateApi, fail, ok } from "@/lib/api";
import { getOwnedSession } from "@/lib/sessions";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await authenticateApi();
  if (!user) return fail("UNAUTHENTICATED", "Sign in to open this report.", 401);
  const { id } = await params;
  const session = await getOwnedSession(id, user.id);
  if (!session) return fail("NOT_FOUND", "Report not found.", 404);
  if (session.status !== "completed") return fail("REPORT_NOT_READY", "This report is not ready.", 409, true);
  const admin = getAdminClient();
  const [{ data: evaluation, error }, { data: evidence }] = await Promise.all([
    admin.from("evaluations").select("*").eq("session_id", id).single(),
    admin
      .from("evidence_items")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true }),
  ]);
  if (error || !evaluation) return fail("REPORT_NOT_READY", "This report is not ready.", 409, true);
  return ok({ session, evaluation, evidence: evidence || [] });
}

