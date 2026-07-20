import { AssessmentStartPanel } from "@/components/assessment-start-panel";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { isLiveAIConfigured } from "@/lib/ai/availability";
import { requireUser } from "@/lib/auth";
import { ECOMMERCE_SCENARIO } from "@/lib/domain/scenario";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage() {
  await requireUser("/assessment/new");
  const liveConfigured = isLiveAIConfigured();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Choose your run</p>
        <h1 className="mt-3 text-4xl tracking-[-0.04em]">{ECOMMERCE_SCENARIO.title}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{ECOMMERCE_SCENARIO.brief}</p>
        <div className="mt-8 flex gap-2">
          <Badge>{ECOMMERCE_SCENARIO.category}</Badge>
          <Badge variant="outline">{ECOMMERCE_SCENARIO.difficulty}</Badge>
          <Badge variant="outline">~15 min</Badge>
        </div>
        <AssessmentStartPanel liveConfigured={liveConfigured} />
      </main>
    </div>
  );
}
