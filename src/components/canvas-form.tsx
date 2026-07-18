"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult, Canvas, CanvasKey } from "@/lib/domain/assessment";
import { canvasKeys } from "@/lib/domain/assessment";

const labels: Record<CanvasKey, { label: string; prompt: string }> = {
  problem: { label: "Problem", prompt: "What specific behavior and business outcome must change?" },
  target_customer: { label: "Target customer", prompt: "Who experiences this most acutely, and in what context?" },
  value_proposition: { label: "Value proposition", prompt: "Why would this customer change behavior now?" },
  solution: { label: "Solution", prompt: "What will you ship or change first?" },
  acquisition: { label: "Acquisition", prompt: "How will the right customer encounter the intervention?" },
  retention: { label: "Retention", prompt: "How does the plan create durable value after the first conversion?" },
  revenue: { label: "Revenue logic", prompt: "How does the plan improve economics without hiding the trade-off?" },
  success_metrics: { label: "Success metrics", prompt: "Which leading, outcome, and guardrail metrics determine success?" },
};

export function CanvasForm({ sessionId, initial }: { sessionId: string; initial?: Canvas | null }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    const canvas = Object.fromEntries(canvasKeys.map((key) => [key, formData.get(key)]));
    const initialResponse = await fetch("/api/sessions/" + sessionId + "/initial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(canvas),
    });
    const initialResult = (await initialResponse.json()) as ApiResult<unknown>;
    if (initialResult.error) {
      setError(initialResult.error.message);
      setPending(false);
      return;
    }
    const constraintResponse = await fetch("/api/sessions/" + sessionId + "/constraint", {
      method: "POST",
    });
    const constraintResult = (await constraintResponse.json()) as ApiResult<unknown>;
    if (constraintResult.error) {
      setError(constraintResult.error.message);
      setPending(false);
      return;
    }
    router.push(constraintResult.next_path || "/assessment/" + sessionId + "/constraint");
  }
  return (
    <form action={submit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        {canvasKeys.map((key) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{labels[key].label}</CardTitle>
              <p className="text-sm leading-5 text-muted-foreground">{labels[key].prompt}</p>
            </CardHeader>
            <CardContent>
              <Label className="sr-only" htmlFor={key}>{labels[key].label}</Label>
              <Textarea id={key} name={key} defaultValue={initial?.[key]} minLength={20} rows={5} required />
            </CardContent>
          </Card>
        ))}
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex items-center justify-between border-t border-white/8 pt-6">
        <p className="max-w-lg text-sm text-muted-foreground">Your proposal is saved before the adaptive constraint is generated.</p>
        <Button disabled={pending} size="lg">
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Generating pressure test…" : "Submit proposal"}
        </Button>
      </div>
    </form>
  );
}

