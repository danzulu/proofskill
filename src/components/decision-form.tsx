"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ApiResult } from "@/lib/domain/assessment";
import {
  buildGuidedCriticalDecision,
  decisionDetailKeys,
  type GuidedDecisionSelections,
} from "@/lib/domain/critical-decision";
import { ECOMMERCE_SCENARIO } from "@/lib/domain/scenario";

type DecisionPhase = "idle" | "saving" | "evaluating" | "navigating";

const decisionReconciliationMessage =
  "ProofSkill could not confirm whether your critical decision was saved. Refreshing the session state so you can continue safely.";
const decisionConflictMessage =
  "Your session state changed before ProofSkill could confirm the critical decision save. Refreshing so you can continue safely.";

const evaluationProcessing = {
  saving: {
    title: "Saving your critical decision",
    description:
      "ProofSkill is preserving the trade-off, first action, and stop rule before evaluation.",
  },
  evaluating: {
    title: "GPT-5.6 is evaluating your evidence",
    description:
      "The model is reviewing the complete decision trail. This can take up to a minute.",
  },
  navigating: {
    title: "Report ready",
    description: "Opening the verified competency report and evidence trail.",
  },
} as const;

export function DecisionForm({ sessionId }: { sessionId: string }) {
  const [phase, setPhase] = useState<DecisionPhase>("idle");
  const [selections, setSelections] = useState<GuidedDecisionSelections>({
    choice: "",
    rationale: "",
    first_action: "",
    guardrail: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();
  const busy = phase !== "idle";
  const complete = Object.values(selections).every(Boolean);
  const processing = phase === "idle" ? null : evaluationProcessing[phase];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = buildGuidedCriticalDecision(selections);
    if (!body) {
      setError("Choose one option in every decision group.");
      return;
    }

    setPhase("saving");
    setError("");
    let decisionSaved = false;
    try {
      const decisionResponse = await fetch(`/api/sessions/${sessionId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const decision = (await decisionResponse.json()) as ApiResult<unknown>;
      if (decision.error) {
        setError(
          decision.error.code === "STATE_CONFLICT"
            ? decisionConflictMessage
            : decision.error.message,
        );
        setPhase("idle");
        if (decision.error.code === "STATE_CONFLICT") router.refresh();
        return;
      }

      decisionSaved = true;
      setPhase("evaluating");
      const evaluationResponse = await fetch(`/api/sessions/${sessionId}/evaluate`, {
        method: "POST",
      });
      const evaluation = (await evaluationResponse.json()) as ApiResult<unknown>;
      if (evaluation.error) {
        setError(evaluation.error.message);
        setPhase("idle");
        router.refresh();
        return;
      }

      setPhase("navigating");
      router.push(evaluation.next_path || `/results/${sessionId}`);
    } catch {
      setError(
        decisionSaved
          ? "The evaluation connection was interrupted. Refreshing the saved session state."
          : decisionReconciliationMessage,
      );
      setPhase("idle");
      router.refresh();
    }
  }

  return (
    <form aria-busy={busy} className="space-y-7" onSubmit={submit}>
      {processing && (
        <ProcessingOverlay
          description={processing.description}
          title={processing.title}
        />
      )}

      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Critical decision
        </p>
        <h1 className="mt-3 text-4xl tracking-[-0.04em]">
          {ECOMMERCE_SCENARIO.criticalDecision.prompt}
        </h1>
      </div>

      <fieldset className="space-y-4" disabled={busy}>
        <legend className="sr-only">{ECOMMERCE_SCENARIO.criticalDecision.prompt}</legend>
        <RadioGroup
          aria-label={ECOMMERCE_SCENARIO.criticalDecision.prompt}
          aria-required="true"
          className="grid gap-4 md:grid-cols-3"
          onValueChange={(choice) =>
            setSelections((current) => ({ ...current, choice }))
          }
          value={selections.choice}
        >
          {ECOMMERCE_SCENARIO.criticalDecision.choices.map((choice) => {
            const controlId = `choice-${choice.value}`;
            return (
              <Label
                className="min-h-44 cursor-pointer flex-col items-stretch rounded-xl border bg-card p-5 transition-all hover:border-primary/45 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary/35"
                htmlFor={controlId}
                key={choice.value}
              >
                <span className="flex items-center justify-between gap-3">
                  <Badge variant="outline">Strategic path</Badge>
                  <RadioGroupItem id={controlId} value={choice.value} />
                </span>
                <span className="mt-4 text-base font-semibold text-foreground">
                  {choice.label}
                </span>
                <span className="mt-2 text-sm font-normal leading-6 text-muted-foreground">
                  {choice.detail}
                </span>
              </Label>
            );
          })}
        </RadioGroup>
      </fieldset>

      {decisionDetailKeys.map((key) => {
        const detail = ECOMMERCE_SCENARIO.criticalDecision.details[key];
        return (
          <fieldset className="space-y-4" disabled={busy} key={key}>
            <legend className="text-xl font-semibold">{detail.prompt}</legend>
            <RadioGroup
              aria-label={detail.prompt}
              aria-required="true"
              className="grid gap-4 md:grid-cols-3"
              onValueChange={(value) =>
                setSelections((current) => ({ ...current, [key]: value }))
              }
              value={selections[key]}
            >
              {detail.choices.map((option) => (
                <Label
                  className="min-h-44 cursor-pointer flex-col items-stretch rounded-xl border bg-card p-5 transition-all hover:border-primary/45 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary/35"
                  htmlFor={`${key}-${option.id}`}
                  key={option.id}
                >
                  <span className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{option.tradeoff}</Badge>
                    <RadioGroupItem id={`${key}-${option.id}`} value={option.id} />
                  </span>
                  <span className="mt-4 text-base font-semibold text-foreground">
                    {option.title}
                  </span>
                  <span className="mt-2 text-sm font-normal leading-6 text-muted-foreground">
                    {option.response}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
        );
      })}

      {error && (
        <Alert aria-live="polite" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between border-t border-white/8 pt-6">
        <p className="max-w-xl text-sm text-muted-foreground">
          Submission triggers evaluation. The report stores conclusions and source quotes—not
          hidden reasoning.
        </p>
        <Button disabled={busy || !complete} size="lg" type="submit">
          {busy && <Loader2 className="animate-spin motion-reduce:animate-none" />}
          {busy ? "Evaluating…" : "Submit for evaluation"}
        </Button>
      </div>
    </form>
  );
}
