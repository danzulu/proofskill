import { redirect } from "next/navigation";
import { AssessmentShell } from "@/components/assessment-shell";
import { DecisionForm } from "@/components/decision-form";
import { EvaluateRetryButton } from "@/components/evaluate-retry-button";
import { requireUser } from "@/lib/auth";
import { nextAssessmentPath } from "@/lib/domain/state-machine";
import { getSessionForPage } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  await requireUser("/assessment/" + sessionId + "/decision");
  const session = await getSessionForPage(sessionId);
  if (!["critical_decision", "evaluating"].includes(session.status)) redirect(nextAssessmentPath(sessionId, session.status));
  return (
    <AssessmentShell currentStep={2} runMode={session.run_mode} sessionId={sessionId}>
      {session.status === "evaluating" ? <EvaluateRetryButton sessionId={sessionId} /> : <DecisionForm sessionId={sessionId} />}
    </AssessmentShell>
  );
}
