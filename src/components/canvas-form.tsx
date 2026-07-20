"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2, PencilLine, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult, Canvas, CanvasKey } from "@/lib/domain/assessment";
import { canvasKeys } from "@/lib/domain/assessment";
import { ECOMMERCE_CANVAS_DECISIONS } from "@/lib/domain/scenario";
import { cn } from "@/lib/utils";

const CUSTOM_CHOICE = "custom";

const initialReconciliationMessage =
  "ProofSkill could not confirm whether your strategy was saved. Refreshing the session state so you can continue safely.";
const initialConflictMessage =
  "Your session state changed before ProofSkill could confirm the strategy save. Refreshing so you can continue safely.";
const constraintReconciliationMessage =
  "ProofSkill could not confirm whether the pressure test was created. Refreshing the saved session state so you can continue safely.";

type GuidedAnswer = {
  choiceId: string;
  detail: string;
};

type GuidedAnswers = Record<CanvasKey, GuidedAnswer>;

type CanvasPhase = "idle" | "saving" | "generating" | "navigating";

function createInitialAnswers(initial?: Canvas | null): GuidedAnswers {
  return Object.fromEntries(
    canvasKeys.map((key) => {
      const saved = initial?.[key] ?? "";
      const match = ECOMMERCE_CANVAS_DECISIONS[key].choices.find((choice) =>
        saved.startsWith(choice.response),
      );
      return [
        key,
        match
          ? { choiceId: match.id, detail: saved.slice(match.response.length).trim() }
          : { choiceId: saved ? CUSTOM_CHOICE : "", detail: saved },
      ];
    }),
  ) as GuidedAnswers;
}

function composeAnswer(key: CanvasKey, answer: GuidedAnswer) {
  const detail = answer.detail.trim();
  if (answer.choiceId === CUSTOM_CHOICE) return detail;
  const choice = ECOMMERCE_CANVAS_DECISIONS[key].choices.find(
    (candidate) => candidate.id === answer.choiceId,
  );
  if (!choice) return "";
  return detail ? `${choice.response} ${detail}` : choice.response;
}

export function CanvasForm({ sessionId, initial }: { sessionId: string; initial?: Canvas | null }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<GuidedAnswers>(() => createInitialAnswers(initial));
  const [phase, setPhase] = useState<CanvasPhase>("idle");
  const [error, setError] = useState("");
  const router = useRouter();
  const busy = phase !== "idle";
  const activeKey = canvasKeys[activeIndex];
  const decision = ECOMMERCE_CANVAS_DECISIONS[activeKey];
  const activeAnswer = answers[activeKey];
  const currentValue = composeAnswer(activeKey, activeAnswer);
  const completedCount = canvasKeys.filter((key) => composeAnswer(key, answers[key]).length >= 20).length;
  const isLastDecision = activeIndex === canvasKeys.length - 1;

  function updateActiveAnswer(next: Partial<GuidedAnswer>) {
    setAnswers((current) => ({
      ...current,
      [activeKey]: { ...current[activeKey], ...next },
    }));
    setError("");
  }

  async function submit(formData: FormData) {
    setPhase("saving");
    setError("");
    let initialSaved = false;
    try {
      const canvas = Object.fromEntries(canvasKeys.map((key) => [key, formData.get(key)]));
      const initialResponse = await fetch(`/api/sessions/${sessionId}/initial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(canvas),
      });
      const initialResult = (await initialResponse.json()) as ApiResult<unknown>;
      if (initialResult.error) {
        setError(
          initialResult.error.code === "STATE_CONFLICT"
            ? initialConflictMessage
            : initialResult.error.message,
        );
        setPhase("idle");
        if (initialResult.error.code === "STATE_CONFLICT") router.refresh();
        return;
      }
      initialSaved = true;
      setPhase("generating");
      const constraintResponse = await fetch(`/api/sessions/${sessionId}/constraint`, {
        method: "POST",
      });
      const constraintResult = (await constraintResponse.json()) as ApiResult<unknown>;
      if (constraintResult.error) {
        setError(constraintResult.error.message);
        setPhase("idle");
        router.refresh();
        return;
      }
      setPhase("navigating");
      router.push(constraintResult.next_path || `/assessment/${sessionId}/constraint`);
    } catch {
      setError(initialSaved ? constraintReconciliationMessage : initialReconciliationMessage);
      setPhase("idle");
      router.refresh();
    }
  }

  return (
    <form
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
    >
      {phase === "saving" && (
        <ProcessingOverlay
          description="ProofSkill is securely saving your eight decisions before the pressure test begins."
          title="Saving your strategy"
        />
      )}
      {phase === "generating" && (
        <ProcessingOverlay
          description="The model is reviewing the full strategy and generating a material constraint. This can take several seconds."
          title="GPT-5.6 is creating your pressure test"
        />
      )}
      {phase === "navigating" && (
        <ProcessingOverlay
          description="Opening the adaptive constraint and the decisions it affects."
          title="Pressure test ready"
        />
      )}

      <fieldset className="m-0 min-w-0 space-y-6 border-0 p-0" disabled={busy}>
        {canvasKeys.map((key) => (
          <input key={key} name={key} type="hidden" value={composeAnswer(key, answers[key])} />
        ))}

      <Card className="overflow-hidden border-primary/20 bg-card/85">
        <CardHeader className="space-y-5 border-b border-white/8 bg-primary/[0.035]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary">
                <Sparkles /> Guided strategy canvas
              </Badge>
              <span className="text-sm text-muted-foreground">
                Decision {activeIndex + 1} of {canvasKeys.length}
              </span>
            </div>
            <span className="text-sm font-medium">{completedCount} complete</span>
          </div>
          <Progress
            aria-label={`${completedCount} of ${canvasKeys.length} decisions complete`}
            value={(completedCount / canvasKeys.length) * 100}
          />
          <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
            {canvasKeys.map((key, index) => {
              const isComplete = composeAnswer(key, answers[key]).length >= 20;
              const isActive = index === activeIndex;
              return (
                <button
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Open ${ECOMMERCE_CANVAS_DECISIONS[key].label}`}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/10 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                  key={key}
                  onClick={() => setActiveIndex(index)}
                  title={ECOMMERCE_CANVAS_DECISIONS[key].label}
                  type="button"
                >
                  {isComplete && !isActive ? <Check className="size-3.5 text-primary" /> : index + 1}
                  <span className="hidden xl:inline">{ECOMMERCE_CANVAS_DECISIONS[key].label}</span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-5 md:p-8">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              {decision.label}
            </p>
            <h2 className="mt-2 max-w-3xl text-2xl tracking-[-0.03em] md:text-3xl">
              {decision.prompt}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {decision.coaching}
            </p>

            <RadioGroup
              aria-label={decision.prompt}
              className="mt-7 grid gap-3 md:grid-cols-3"
              onValueChange={(choiceId) => updateActiveAnswer({ choiceId, detail: "" })}
              value={activeAnswer.choiceId}
            >
              {decision.choices.map((choice) => {
                const selected = activeAnswer.choiceId === choice.id;
                const controlId = `${activeKey}-${choice.id}`;
                return (
                  <Label
                    className={cn(
                      "group min-h-60 cursor-pointer flex-col items-stretch gap-0 rounded-xl border bg-background/45 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/[0.035]",
                      selected && "border-primary bg-primary/[0.07] ring-1 ring-primary/35",
                    )}
                    htmlFor={controlId}
                    key={choice.id}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <Badge variant="outline" className="font-normal">{choice.tradeoff}</Badge>
                      <RadioGroupItem id={controlId} value={choice.id} />
                    </span>
                    <span className="mt-5 block text-lg font-semibold text-foreground">{choice.title}</span>
                    <span className="mt-2 block text-sm font-normal leading-6 text-muted-foreground">
                      {choice.response}
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>

            <button
              aria-pressed={activeAnswer.choiceId === CUSTOM_CHOICE}
              className={cn(
                "mt-3 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-left text-sm transition-colors hover:border-primary/45 hover:bg-primary/[0.035]",
                activeAnswer.choiceId === CUSTOM_CHOICE && "border-primary bg-primary/[0.07]",
              )}
              onClick={() => updateActiveAnswer({ choiceId: CUSTOM_CHOICE, detail: "" })}
              type="button"
            >
              <span className="rounded-lg bg-muted p-2"><PencilLine className="size-4" /></span>
              <span>
                <span className="block font-medium">None of these fit? Build your own answer</span>
                <span className="text-muted-foreground">You can still respond freely when your strategy needs a different direction.</span>
              </span>
            </button>

            {activeAnswer.choiceId && (
              <div className="mt-6 rounded-xl border border-white/10 bg-muted/25 p-5">
                {activeAnswer.choiceId === CUSTOM_CHOICE ? (
                  <>
                    <Label htmlFor={`${activeKey}-custom`}>Your answer</Label>
                    <Textarea
                      autoFocus
                      className="mt-2 min-h-28"
                      id={`${activeKey}-custom`}
                      maxLength={1500}
                      minLength={20}
                      onChange={(event) => updateActiveAnswer({ detail: event.target.value })}
                      placeholder="State the choice and the business outcome it should create."
                      value={activeAnswer.detail}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">Minimum 20 characters.</p>
                  </>
                ) : (
                  <>
                    <Label htmlFor={`${activeKey}-detail`}>Add your angle <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input
                      className="mt-2"
                      id={`${activeKey}-detail`}
                      maxLength={300}
                      onChange={(event) => updateActiveAnswer({ detail: event.target.value })}
                      placeholder="One detail that makes this choice yours"
                      value={activeAnswer.detail}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert aria-live="polite" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Choose a direction; add detail only when it improves the answer.</p>
          <p className="mt-1 text-sm text-muted-foreground">Your eight decisions are saved together before the pressure test begins.</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={activeIndex === 0 || busy}
            onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            type="button"
            variant="outline"
          >
            <ChevronLeft /> Back
          </Button>
          {isLastDecision ? (
            <Button disabled={busy || completedCount !== canvasKeys.length} size="lg" type="submit">
              {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Sparkles />}
              {busy ? "Generating pressure test…" : "Submit strategy"}
            </Button>
          ) : (
            <Button
              disabled={currentValue.length < 20 || busy}
              onClick={() => setActiveIndex((index) => Math.min(canvasKeys.length - 1, index + 1))}
              size="lg"
              type="button"
            >
              Continue <ChevronRight />
            </Button>
          )}
        </div>
      </div>
      </fieldset>
    </form>
  );
}
