import { CheckCircle2 } from "lucide-react";
import { StartAssessmentButton } from "@/components/start-assessment-button";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { areFixturesEnabled, isLiveAIConfigured } from "@/lib/ai/availability";
import { requireUser } from "@/lib/auth";
import { ECOMMERCE_SCENARIO } from "@/lib/domain/scenario";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage() {
  await requireUser("/assessment/new");
  const fixturesEnabled = areFixturesEnabled();
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
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className={fixturesEnabled ? "border-primary/25" : undefined}>
            <CardHeader>
              <CardTitle>Guided fixture rehearsal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">
                Use the complete assessment flow with deterministic responses while preparing or demoing the product. Reports are clearly labeled as fixtures.
              </p>
              <ul className="space-y-2 text-sm">
                {["Adaptive pressure test", "Verified evidence", "Saved private report"].map((item) => (
                  <li className="flex gap-2" key={item}>
                    <CheckCircle2 className="size-4 text-primary" />{item}
                  </li>
                ))}
              </ul>
              {fixturesEnabled ? (
                <StartAssessmentButton runMode="fixture" />
              ) : (
                <p className="text-sm text-muted-foreground">Fixture mode is disabled in this environment.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Live AI status</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {liveConfigured ? (
                <>
                  <p className="text-sm leading-6 text-muted-foreground">The OpenAI key is configured. Start a real adaptive assessment powered by GPT-5.6.</p>
                  <StartAssessmentButton runMode="live" />
                </>
              ) : (
                <Alert>
                  <AlertTitle>OpenAI is not configured yet</AlertTitle>
                  <AlertDescription>
                    Add <code>OPENAI_API_KEY</code> to this Vercel environment and redeploy to enable live assessments. Fixture mode remains available for testing.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
