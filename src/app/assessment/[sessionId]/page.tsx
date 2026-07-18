import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { nextAssessmentPath } from "@/lib/domain/state-machine";
import { getSessionForPage } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function AssessmentRouter({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  await requireUser("/assessment/" + sessionId);
  const session = await getSessionForPage(sessionId);
  redirect(nextAssessmentPath(sessionId, session.status));
}

