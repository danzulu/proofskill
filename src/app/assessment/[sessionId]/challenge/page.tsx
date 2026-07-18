import { redirect } from "next/navigation";
import { AssessmentShell } from "@/components/assessment-shell";
import { CanvasForm } from "@/components/canvas-form";
import { GenerateConstraintButton } from "@/components/generate-constraint-button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { canvasSchema } from "@/lib/domain/assessment";
import { ECOMMERCE_SCENARIO } from "@/lib/domain/scenario";
import { nextAssessmentPath } from "@/lib/domain/state-machine";
import { getSessionForPage } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  await requireUser("/assessment/" + sessionId + "/challenge");
  const session = await getSessionForPage(sessionId);
  if (!["challenge", "initial_submitted", "constraint_generating"].includes(session.status)) {
    redirect(nextAssessmentPath(sessionId, session.status));
  }
  return (
    <AssessmentShell currentStep={0} runMode={session.run_mode} sessionId={sessionId}>
      <div className="mb-8">
        <div className="flex flex-wrap gap-2"><Badge>{ECOMMERCE_SCENARIO.category}</Badge><Badge variant="outline">{ECOMMERCE_SCENARIO.difficulty}</Badge></div>
        <h1 className="mt-5 max-w-3xl text-4xl tracking-[-0.045em]">{ECOMMERCE_SCENARIO.title}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{ECOMMERCE_SCENARIO.brief}</p>
        <ul className="mt-6 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          {ECOMMERCE_SCENARIO.context.map((item) => <li className="rounded-lg border border-white/8 bg-card/50 p-3" key={item}>{item}</li>)}
        </ul>
      </div>
      {session.status === "challenge" ? (
        <CanvasForm sessionId={sessionId} initial={session.initial_canvas ? canvasSchema.parse(session.initial_canvas) : null} />
      ) : (
        <GenerateConstraintButton sessionId={sessionId} />
      )}
    </AssessmentShell>
  );
}

