import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReportView, type ReportData } from "@/components/report-view";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { canvasSchema, competencyKeys, evidenceSchema } from "@/lib/domain/assessment";
import { nextAssessmentPath } from "@/lib/domain/state-machine";
import { getSessionForPage } from "@/lib/page-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  await requireUser("/results/" + sessionId);
  const session = await getSessionForPage(sessionId);
  if (session.status !== "completed") redirect(nextAssessmentPath(sessionId, session.status));
  const supabase = await createClient();
  const [{ data: evaluation }, { data: evidence }] = await Promise.all([
    supabase.from("evaluations").select("*").eq("session_id", sessionId).maybeSingle(),
    supabase.from("evidence_items").select("*").eq("session_id", sessionId).order("created_at"),
  ]);
  if (!evaluation) notFound();

  const report: ReportData = {
    total_score: evaluation.total_score,
    level: evaluation.level,
    competency_scores: Object.fromEntries(
      competencyKeys.map((key) => [key, Number(evaluation.competency_scores[key])]),
    ) as ReportData["competency_scores"],
    deterministic_adjustments: evaluation.deterministic_adjustments || [],
    contradictions: evaluation.contradictions || [],
    summary: evaluation.summary,
    main_gap: evaluation.main_gap,
    next_challenge: evaluation.next_challenge,
    evidence: (evidence || []).map((item) => ({
      ...evidenceSchema.parse(item),
      valid: item.valid,
    })),
  };
  const before = canvasSchema.parse(session.initial_canvas);
  const after = canvasSchema.parse(session.revised_canvas);
  const changes = Object.keys(before)
    .filter((key) => before[key as keyof typeof before] !== after[key as keyof typeof after])
    .map((key) => ({
      field: key,
      before: before[key as keyof typeof before],
      after: after[key as keyof typeof after],
    }));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <div className="mb-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex gap-2"><Badge>{session.run_mode === "live" ? "Live" : "Fixture"}</Badge><Badge variant="outline">{evaluation.model}</Badge></div>
            <h1 className="mt-4 text-4xl tracking-[-0.04em]">Your evidence report</h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">Rubric {evaluation.rubric_version} · {new Date(evaluation.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</p>
          </div>
          <div className="flex gap-2"><Button asChild variant="outline"><Link href="/dashboard">Back to dashboard</Link></Button><Button asChild><Link href="/assessment/new">Try again</Link></Button></div>
        </div>
        <ReportView report={report} mode={session.run_mode} changes={changes} />
      </main>
    </div>
  );
}

