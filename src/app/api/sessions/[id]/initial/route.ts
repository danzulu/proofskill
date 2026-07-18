import { authenticateApi, fail, ok } from "@/lib/api";
import { canvasSchema } from "@/lib/domain/assessment";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await authenticateApi();
  if (!user) return fail("UNAUTHENTICATED", "Sign in to continue.", 401);
  const { id } = await params;
  const parsed = canvasSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail("INVALID_CANVAS", "Complete every canvas field with a specific answer.", 400);
  }

  const { data, error } = await getAdminClient()
    .from("assessment_sessions")
    .update({
      initial_canvas: parsed.data,
      status: "initial_submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "challenge")
    .select("id,status")
    .maybeSingle();
  if (error) return fail("DATABASE_ERROR", "Could not save the canvas.", 500, true);
  if (!data) return fail("STATE_CONFLICT", "This step was already submitted or is not yours.", 409);
  return ok(data);
}

