import Link from "next/link";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import type { AssessmentStatus, RunMode } from "@/lib/domain/assessment";
import { nextAssessmentPath } from "@/lib/domain/state-machine";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DashboardSession = {
  id: string;
  status: AssessmentStatus;
  run_mode: RunMode;
  difficulty: string;
  created_at: string;
  completed_at: string | null;
  evaluations: Array<{ total_score: number; level: string }>;
};

function statusLabel(status: AssessmentStatus) {
  const labels: Record<AssessmentStatus, string> = {
    challenge: "Draft",
    initial_submitted: "Proposal saved",
    constraint_generating: "Generating",
    constraint: "Needs revision",
    revision_submitted: "Revision saved",
    critical_decision: "Needs decision",
    evaluating: "Evaluating",
    completed: "Completed",
  };
  return labels[status];
}

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_sessions")
    .select("id,status,run_mode,difficulty,created_at,completed_at,evaluations(total_score,level)")
    .order("created_at", { ascending: false });
  const sessions = (data || []) as DashboardSession[];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Private dashboard</p>
            <h1 className="mt-3 text-4xl tracking-[-0.04em]">Your proof, over time</h1>
            <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button asChild><Link href="/assessment/new"><Plus />New assessment</Link></Button>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Attempts</p><p className="mt-2 font-mono text-3xl">{sessions.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Completed</p><p className="mt-2 font-mono text-3xl">{sessions.filter((item) => item.status === "completed").length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Best score</p><p className="mt-2 font-mono text-3xl">{Math.max(0, ...sessions.flatMap((item) => item.evaluations.map((evaluation) => evaluation.total_score))) || "—"}</p></CardContent></Card>
        </div>

        <Card className="mt-8">
          <CardHeader><CardTitle>Assessment history</CardTitle></CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive">Could not load your assessment history.</p>
            ) : sessions.length === 0 ? (
              <div className="py-14 text-center"><Sparkles className="mx-auto size-8 text-primary" /><h2 className="mt-4 text-xl">No attempts yet</h2><p className="mt-2 text-sm text-muted-foreground">Your saved sessions and reports will appear here.</p><Button asChild className="mt-6"><Link href="/assessment/new">Start the first assessment</Link></Button></div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Result</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const evaluation = session.evaluations[0];
                    return <TableRow key={session.id}>
                      <TableCell className="font-mono text-xs">{new Date(session.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</TableCell>
                      <TableCell><Badge variant={session.run_mode === "live" ? "default" : "outline"}>{session.run_mode}</Badge></TableCell>
                      <TableCell>{statusLabel(session.status)}</TableCell>
                      <TableCell>{evaluation ? <span><span className="font-mono text-primary">{evaluation.total_score}</span> <span className="text-xs text-muted-foreground">{evaluation.level}</span></span> : "—"}</TableCell>
                      <TableCell className="text-right"><Button asChild variant="ghost" size="sm"><Link href={nextAssessmentPath(session.id, session.status)}>{session.status === "completed" ? "Open report" : "Continue"} <ArrowRight /></Link></Button></TableCell>
                    </TableRow>;
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

