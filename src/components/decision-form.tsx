"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult } from "@/lib/domain/assessment";
import { ECOMMERCE_SCENARIO } from "@/lib/domain/scenario";

export function DecisionForm({ sessionId }: { sessionId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    const body = {
      choice: formData.get("choice"),
      rationale: formData.get("rationale"),
      first_action: formData.get("first_action"),
      guardrail: formData.get("guardrail"),
    };
    const decisionResponse = await fetch("/api/sessions/" + sessionId + "/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const decision = (await decisionResponse.json()) as ApiResult<unknown>;
    if (decision.error) {
      setError(decision.error.message);
      setPending(false);
      return;
    }
    const evaluationResponse = await fetch("/api/sessions/" + sessionId + "/evaluate", { method: "POST" });
    const evaluation = (await evaluationResponse.json()) as ApiResult<unknown>;
    if (evaluation.error) {
      setError(evaluation.error.message);
      setPending(false);
      router.refresh();
      return;
    }
    router.push(evaluation.next_path || "/results/" + sessionId);
  }
  return (
    <form action={submit} className="space-y-7">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Critical decision</p>
        <h1 className="mt-3 text-4xl tracking-[-0.04em]">{ECOMMERCE_SCENARIO.criticalDecision.prompt}</h1>
      </div>
      <RadioGroup name="choice" required className="grid gap-4 md:grid-cols-3">
        {ECOMMERCE_SCENARIO.criticalDecision.choices.map((choice) => (
          <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-card p-5 has-[[data-state=checked]]:border-primary/50" htmlFor={choice.value} key={choice.value}>
            <RadioGroupItem id={choice.value} value={choice.value} />
            <span><span className="block text-base text-foreground">{choice.label}</span><span className="mt-2 block text-sm font-normal leading-5 text-muted-foreground">{choice.detail}</span></span>
          </Label>
        ))}
      </RadioGroup>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="rationale">Why this trade-off?</Label><Textarea id="rationale" name="rationale" minLength={30} rows={6} required /></div>
        <div className="space-y-2"><Label htmlFor="first_action">What happens in the first 48 hours?</Label><Textarea id="first_action" name="first_action" minLength={15} rows={6} required /></div>
        <div className="space-y-2"><Label htmlFor="guardrail">What makes you stop?</Label><Textarea id="guardrail" name="guardrail" minLength={15} rows={6} required /></div>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex items-center justify-between border-t border-white/8 pt-6">
        <p className="max-w-xl text-sm text-muted-foreground">Submission triggers evaluation. The report stores conclusions and source quotes—not hidden reasoning.</p>
        <Button disabled={pending} size="lg">{pending && <Loader2 className="animate-spin" />}{pending ? "Evaluating…" : "Submit for evaluation"}</Button>
      </div>
    </form>
  );
}

