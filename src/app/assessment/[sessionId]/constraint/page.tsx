import { redirect } from "next/navigation";
import { AssessmentShell } from "@/components/assessment-shell";
import { RevisionForm } from "@/components/revision-form";
import { requireUser } from "@/lib/auth";
import { canvasSchema, constraintSchema } from "@/lib/domain/assessment";
import { nextAssessmentPath } from "@/lib/domain/state-machine";
import { getSessionForPage } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function ConstraintPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  await requireUser("/assessment/" + sessionId + "/constraint");
  const session = await getSessionForPage(sessionId);
  if (session.status !== "constraint") redirect(nextAssessmentPath(sessionId, session.status));
  return (
    <AssessmentShell currentStep={1} runMode={session.run_mode} sessionId={sessionId}>
      <RevisionForm
        sessionId={sessionId}
        initial={canvasSchema.parse(session.initial_canvas)}
        constraint={constraintSchema.parse(session.constraint_payload)}
      />
    </AssessmentShell>
  );
}

