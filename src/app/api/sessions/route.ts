import { z } from "zod";
import { authenticateApi, fail, ok } from "@/lib/api";
import { ECOMMERCE_SCENARIO } from "@/lib/domain/scenario";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({ run_mode: z.enum(["live", "fixture"]).default("live") });

export async function POST(request: Request) {
  const { user } = await authenticateApi();
  if (!user) return fail("UNAUTHENTICATED", "Sign in to start an assessment.", 401);
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("INVALID_REQUEST", "Invalid run mode.", 400);
  if (parsed.data.run_mode === "fixture" && process.env.ENABLE_AI_FIXTURES !== "true") {
    return fail("FIXTURES_DISABLED", "Fixture assessments are disabled.", 403);
  }

  const { data, error } = await getAdminClient()
    .from("assessment_sessions")
    .insert({
      user_id: user.id,
      scenario_id: ECOMMERCE_SCENARIO.id,
      scenario_version: ECOMMERCE_SCENARIO.version,
      difficulty: ECOMMERCE_SCENARIO.difficulty,
      run_mode: parsed.data.run_mode,
      status: "challenge",
    })
    .select("id,status,run_mode")
    .single();
  if (error) return fail("DATABASE_ERROR", "Could not create the session.", 500, true);
  return ok(data, "/assessment/" + data.id + "/challenge", { status: 201 });
}

