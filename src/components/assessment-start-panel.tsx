import { CheckCircle2 } from "lucide-react";
import { StartAssessmentButton } from "@/components/start-assessment-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AssessmentStartPanel({ liveConfigured }: { liveConfigured: boolean }) {
  return (
    <Card className="mt-10 border-primary/25">
      <CardHeader>
        <CardTitle><h2>Live AI Assessment</h2></CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Complete a real adaptive assessment powered by GPT-5.6. Your report remains private and saved to your dashboard.
        </p>
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          {["Adaptive pressure test", "Verified evidence", "Saved private report"].map((item) => (
            <li className="flex gap-2" key={item}>
              <CheckCircle2 className="size-4 text-primary" />
              {item}
            </li>
          ))}
        </ul>
        {liveConfigured ? (
          <StartAssessmentButton />
        ) : (
          <Alert>
            <AlertTitle>OpenAI is not configured yet</AlertTitle>
            <AlertDescription>Add OPENAI_API_KEY to this environment and redeploy before starting a live assessment.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
