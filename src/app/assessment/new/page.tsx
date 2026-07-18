import { CheckCircle2 } from "lucide-react";
import { StartAssessmentButton } from "@/components/start-assessment-button";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { ECOMMERCE_SCENARIO } from "@/lib/domain/scenario";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage() {
  await requireUser("/assessment/new");
  const fixturesEnabled = process.env.ENABLE_AI_FIXTURES === "true";
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
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="border-primary/25">
            <CardHeader><CardTitle>Live assessment</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">GPT‑5.6 Sol generates the adaptive constraint and evidence draft. Deterministic code verifies quotes and calculates the final score.</p>
              <ul className="space-y-2 text-sm">
                {["Personalized constraint", "Verified evidence", "Saved private report"].map((item) => <li className="flex gap-2" key={item}><CheckCircle2 className="size-4 text-primary" />{item}</li>)}
              </ul>
              <StartAssessmentButton runMode="live" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Fixture rehearsal</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">A deterministic simulation for development and demo rehearsal. Every report is clearly labeled as a fixture.</p>
              {fixturesEnabled ? <StartAssessmentButton runMode="fixture" /> : <p className="text-sm text-muted-foreground">Disabled in this environment.</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

