import { randomBytes, randomUUID } from "node:crypto";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const siteUrl = process.env.SECURITY_TEST_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;

if (!supabaseUrl || !publishableKey || !secretKey || !siteUrl) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, and NEXT_PUBLIC_SITE_URL (or SECURITY_TEST_BASE_URL).",
  );
}

const origin = new URL(siteUrl).origin;
const runId = randomUUID().replaceAll("-", "");
const emailPrefix = `proofskill-security-${runId}`;
const password = `${randomBytes(24).toString("base64url")}Aa1!`;
const createdUsers = [];
const signedInClients = [];
let browser;
let assertionsPassed = false;

const admin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function userClient() {
  return createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createTemporaryUser(label) {
  const email = `${emailPrefix}-${label}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: `ProofSkill security test ${label}` },
  });
  if (error || !data.user) throw error || new Error(`Could not create user ${label}.`);
  createdUsers.push({ id: data.user.id, email });
  return { id: data.user.id, email };
}

async function signIn(email) {
  const client = userClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  signedInClients.push(client);
  return client;
}

async function expectVisible(client, table, column, value, expected, label) {
  const { data, error } = await client.from(table).select("id").eq(column, value);
  assert(!error, `${label}: unexpected SELECT error: ${error?.message}`);
  assert(data?.length === expected, `${label}: expected ${expected} row(s), received ${data?.length}.`);
}

try {
  const userA = await createTemporaryUser("a");
  const userB = await createTemporaryUser("b");
  const clientA = await signIn(userA.email);
  const clientB = await signIn(userB.email);

  const canvasKeys = [
    "problem",
    "target_customer",
    "value_proposition",
    "solution",
    "acquisition",
    "retention",
    "revenue",
    "success_metrics",
  ];
  const initialCanvas = Object.fromEntries(
    canvasKeys.map((key) => [key, `Temporary valid security test answer for ${key}.`]),
  );

  const { data: sessions, error: sessionsError } = await admin
    .from("assessment_sessions")
    .insert([
      {
        user_id: userA.id,
        scenario_id: "ecommerce-cart-recovery",
        scenario_version: "2026-07-17.1",
        difficulty: "Intermediate",
        run_mode: "fixture",
        status: "challenge",
      },
      {
        user_id: userB.id,
        scenario_id: "ecommerce-cart-recovery",
        scenario_version: "2026-07-17.1",
        difficulty: "Intermediate",
        run_mode: "fixture",
        status: "challenge",
      },
      {
        user_id: userB.id,
        scenario_id: "ecommerce-cart-recovery",
        scenario_version: "2026-07-17.1",
        difficulty: "Intermediate",
        run_mode: "fixture",
        status: "completed",
        completed_at: new Date().toISOString(),
      },
    ])
    .select("id,user_id,status");
  if (sessionsError) throw sessionsError;
  const sessionA = sessions?.find((session) => session.user_id === userA.id);
  const sessionBChallenge = sessions?.find(
    (session) => session.user_id === userB.id && session.status === "challenge",
  );
  const sessionBReport = sessions?.find(
    (session) => session.user_id === userB.id && session.status === "completed",
  );
  assert(sessionA && sessionBChallenge && sessionBReport, "Could not resolve all temporary sessions.");

  const { data: evaluation, error: evaluationError } = await admin
    .from("evaluations")
    .insert({
      session_id: sessionBReport.id,
      total_score: 50,
      level: "Developing",
      competency_scores: {},
      rubric_version: "security-test",
      model: "fixture-security-test",
      deterministic_adjustments: [],
      contradictions: [],
      summary: "Temporary isolation test evaluation record.",
      main_gap: "Temporary isolation test gap.",
      next_challenge: "Temporary isolation test challenge.",
    })
    .select("id")
    .single();
  if (evaluationError) throw evaluationError;

  const [{ error: evidenceError }, { error: aiRunError }] = await Promise.all([
    admin.from("evidence_items").insert({
      evaluation_id: evaluation.id,
      session_id: sessionBReport.id,
      competency: "decision_quality",
      kind: "positive",
      source_path: "critical_decision.rationale",
      exact_quote: "Temporary isolation evidence.",
      valid: true,
      explanation: "Created only to verify child-table isolation.",
    }),
    admin.from("ai_runs").insert({
      session_id: sessionBReport.id,
      kind: "evaluation",
      model: "fixture-security-test",
      run_mode: "fixture",
      status: "succeeded",
      latency_ms: 0,
    }),
  ]);
  if (evidenceError) throw evidenceError;
  if (aiRunError) throw aiRunError;

  await expectVisible(clientA, "assessment_sessions", "id", sessionA.id, 1, "A reads A session");
  await expectVisible(clientA, "assessment_sessions", "id", sessionBReport.id, 0, "A cannot read B session");
  await expectVisible(clientB, "assessment_sessions", "id", sessionBReport.id, 1, "B reads B session");
  await expectVisible(clientB, "assessment_sessions", "id", sessionA.id, 0, "B cannot read A session");
  await expectVisible(clientA, "evaluations", "session_id", sessionBReport.id, 0, "A cannot read B evaluation");
  await expectVisible(clientB, "evaluations", "session_id", sessionBReport.id, 1, "B reads B evaluation");
  await expectVisible(clientA, "evidence_items", "session_id", sessionBReport.id, 0, "A cannot read B evidence");
  await expectVisible(clientB, "evidence_items", "session_id", sessionBReport.id, 1, "B reads B evidence");
  await expectVisible(clientA, "ai_runs", "session_id", sessionBReport.id, 0, "A cannot read B AI run");
  await expectVisible(clientB, "ai_runs", "session_id", sessionBReport.id, 1, "B reads B AI run");

  const directMutation = await clientA
    .from("assessment_sessions")
    .update({ status: "initial_submitted" })
    .eq("id", sessionBChallenge.id)
    .select("id");
  assert(directMutation.error, "A direct UPDATE against B must be rejected.");

  const directScoreWrite = await clientA.from("evaluations").insert({
    session_id: sessionA.id,
    total_score: 100,
    level: "Advanced",
    competency_scores: {},
    rubric_version: "forged",
    model: "forged",
    deterministic_adjustments: [],
    contradictions: [],
    summary: "This forged score must never be written.",
    main_gap: "This forged gap must never be written.",
    next_challenge: "This forged challenge must never be written.",
  });
  assert(directScoreWrite.error, "An authenticated user must not be able to forge a score.");

  browser = await chromium.launch({ headless: true });
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto(`${origin}/login?next=/dashboard`, { waitUntil: "domcontentloaded" });
  await pageA.getByLabel("Email").fill(userA.email);
  await pageA.getByLabel("Password").fill(password);
  await Promise.all([
    pageA.waitForURL((url) => url.pathname === "/dashboard"),
    pageA.getByRole("button", { name: "Sign in", exact: true }).click(),
  ]);

  const routeResults = await pageA.evaluate(async ({ reportId, evaluateId, mutationId, canvas }) => {
    const request = async (path, init) => {
      const response = await fetch(path, { cache: "no-store", ...init });
      const body = await response.json();
      return { status: response.status, code: body?.error?.code };
    };
    return {
      report: await request(`/api/sessions/${reportId}/report`),
      evaluate: await request(`/api/sessions/${evaluateId}/evaluate`, { method: "POST" }),
      mutate: await request(`/api/sessions/${mutationId}/initial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(canvas),
      }),
    };
  }, {
    reportId: sessionBReport.id,
    evaluateId: sessionBReport.id,
    mutationId: sessionBChallenge.id,
    canvas: initialCanvas,
  });

  assert(
    routeResults.report.status === 404 && routeResults.report.code === "NOT_FOUND",
    `Cross-user report returned ${routeResults.report.status}/${routeResults.report.code}.`,
  );
  assert(
    routeResults.evaluate.status === 404 && routeResults.evaluate.code === "NOT_FOUND",
    `Cross-user evaluation returned ${routeResults.evaluate.status}/${routeResults.evaluate.code}.`,
  );
  assert(
    routeResults.mutate.status === 409 && routeResults.mutate.code === "STATE_CONFLICT",
    `Cross-user mutation returned ${routeResults.mutate.status}/${routeResults.mutate.code}.`,
  );

  const [challengeState, evaluationState, evaluationCount, evidenceCount, aiRunCount] = await Promise.all([
    admin
      .from("assessment_sessions")
      .select("status,initial_canvas")
      .eq("id", sessionBChallenge.id)
      .single(),
    admin
      .from("assessment_sessions")
      .select("status")
      .eq("id", sessionBReport.id)
      .single(),
    admin
      .from("evaluations")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionBReport.id),
    admin
      .from("evidence_items")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionBReport.id),
    admin
      .from("ai_runs")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionBReport.id),
  ]);
  for (const result of [challengeState, evaluationState, evaluationCount, evidenceCount, aiRunCount]) {
    if (result.error) throw result.error;
  }
  assert(
    challengeState.data.status === "challenge" && challengeState.data.initial_canvas === null,
    "B's session changed during the cross-user mutation test.",
  );
  assert(
    evaluationState.data.status === "completed" &&
      evaluationCount.count === 1 &&
      evidenceCount.count === 1 &&
      aiRunCount.count === 1,
    "A changed B's completed report or its evaluation artifacts.",
  );

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto(`${origin}/login?next=/dashboard`, { waitUntil: "domcontentloaded" });
  await pageB.getByLabel("Email").fill(userB.email);
  await pageB.getByLabel("Password").fill(password);
  await Promise.all([
    pageB.waitForURL((url) => url.pathname === "/dashboard"),
    pageB.getByRole("button", { name: "Sign in", exact: true }).click(),
  ]);

  const ownerRouteResults = await pageB.evaluate(async ({ reportId, evaluateId }) => {
    const request = async (path, init) => {
      const response = await fetch(path, { cache: "no-store", ...init });
      const body = await response.json();
      return { status: response.status, code: body?.error?.code };
    };
    return {
      report: await request(`/api/sessions/${reportId}/report`),
      evaluate: await request(`/api/sessions/${evaluateId}/evaluate`, { method: "POST" }),
    };
  }, { reportId: sessionBReport.id, evaluateId: sessionBReport.id });
  assert(
    ownerRouteResults.report.status === 200,
    `Owner report returned ${ownerRouteResults.report.status}/${ownerRouteResults.report.code}.`,
  );
  assert(
    ownerRouteResults.evaluate.status === 200,
    `Owner evaluation returned ${ownerRouteResults.evaluate.status}/${ownerRouteResults.evaluate.code}.`,
  );

  const [completedState, completedEvaluation] = await Promise.all([
    admin
      .from("assessment_sessions")
      .select("status")
      .eq("id", sessionBReport.id)
      .single(),
    admin
      .from("evaluations")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionBReport.id),
  ]);
  if (completedState.error) throw completedState.error;
  if (completedEvaluation.error) throw completedEvaluation.error;
  assert(
    completedState.data.status === "completed" && completedEvaluation.count === 1,
    "B could not reopen the same owned completed evaluation route denied to A.",
  );
  assertionsPassed = true;
} finally {
  const cleanupErrors = [];
  if (browser) await browser.close().catch(() => undefined);
  for (const client of signedInClients) {
    const { error } = await client.auth.signOut({ scope: "global" });
    if (error) cleanupErrors.push(new Error(`Could not revoke a temporary session: ${error.message}`));
  }
  for (const user of createdUsers) {
    if (!user.email.startsWith(emailPrefix)) {
      throw new Error("Refusing to delete a user that was not created by this security test.");
    }
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) cleanupErrors.push(new Error(`Could not delete a temporary user: ${error.message}`));
  }
  if (cleanupErrors.length) throw new AggregateError(cleanupErrors, "Security-test cleanup failed.");
}

if (assertionsPassed) {
  console.log("PASS: owner rows are visible only to their owner.");
  console.log("PASS: child evaluation, evidence, and AI-run rows are isolated.");
  console.log("PASS: direct authenticated mutations and forged scores are rejected.");
  console.log("PASS: cross-user routes make no changes, while the owner can open and evaluate the same sessions.");
  console.log("PASS: temporary sessions were revoked and generated users were deleted.");
}
