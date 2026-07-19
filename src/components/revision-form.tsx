"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LockKeyhole,
  PencilLine,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type {
  ApiResult,
  Canvas,
  CanvasKey,
  Constraint,
  RevisionStrategy,
} from "@/lib/domain/assessment";
import {
  ECOMMERCE_REVISION_DECISIONS,
  ECOMMERCE_REVISION_STRATEGIES,
  type RevisionStrategyKey,
} from "@/lib/domain/scenario";
import { cn } from "@/lib/utils";

const CUSTOM_CHOICE = "custom";
const strategyKeys: RevisionStrategyKey[] = ["keep", "remove", "measure"];

const labels: Record<CanvasKey, string> = {
  problem: "Problem",
  target_customer: "Target customer",
  value_proposition: "Value proposition",
  solution: "Solution",
  acquisition: "Acquisition",
  retention: "Retention",
  revenue: "Revenue logic",
  success_metrics: "Success metrics",
};

type RevisionStep =
  | { id: string; kind: "field"; key: CanvasKey }
  | { id: string; kind: "strategy"; key: RevisionStrategyKey };

type GuidedRevisionAnswer = {
  choiceId: string;
  detail: string;
  customValue: string;
  customAdaptation: string;
};

type GuidedRevisionAnswers = Record<string, GuidedRevisionAnswer>;

const emptyAnswer = (): GuidedRevisionAnswer => ({
  choiceId: "",
  detail: "",
  customValue: "",
  customAdaptation: "",
});

function buildSteps(constraint: Constraint): RevisionStep[] {
  return [
    ...constraint.affected_fields.map((key) => ({
      id: `field:${key}`,
      kind: "field" as const,
      key,
    })),
    ...strategyKeys.map((key) => ({
      id: `strategy:${key}`,
      kind: "strategy" as const,
      key,
    })),
  ];
}

function createInitialAnswers(steps: RevisionStep[]): GuidedRevisionAnswers {
  return Object.fromEntries(steps.map((step) => [step.id, emptyAnswer()]));
}

function combineText(parts: string[], maxLength: number) {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, maxLength)
    .trim();
}

function composeFieldRevision(
  key: CanvasKey,
  initial: Canvas,
  answer: GuidedRevisionAnswer,
) {
  if (answer.choiceId === CUSTOM_CHOICE) {
    return {
      value: answer.customValue.trim(),
      adaptation: answer.customAdaptation.trim(),
    };
  }

  const choice = ECOMMERCE_REVISION_DECISIONS[key].choices.find(
    (candidate) => candidate.id === answer.choiceId,
  );
  if (!choice) return { value: "", adaptation: "" };

  const revision = combineText([choice.revision, answer.detail], 1_500);
  const availableForOriginal = Math.max(0, 1_500 - revision.length - 1);
  const original = initial[key].slice(0, availableForOriginal);

  return {
    value: combineText([original, revision], 1_500),
    adaptation: combineText([choice.adaptation, answer.detail], 600),
  };
}

function composeStrategyRevision(
  key: RevisionStrategyKey,
  answer: GuidedRevisionAnswer,
) {
  if (answer.choiceId === CUSTOM_CHOICE) return answer.customValue.trim();
  const choice = ECOMMERCE_REVISION_STRATEGIES[key].choices.find(
    (candidate) => candidate.id === answer.choiceId,
  );
  if (!choice) return "";
  return combineText([choice.response, answer.detail], 600);
}

function isStepComplete(
  step: RevisionStep,
  answer: GuidedRevisionAnswer,
  initial: Canvas,
) {
  if (step.kind === "field") {
    const composed = composeFieldRevision(step.key, initial, answer);
    return composed.value.length >= 20 && composed.adaptation.length >= 10;
  }
  return composeStrategyRevision(step.key, answer).length >= 10;
}

export function RevisionForm({
  sessionId,
  initial,
  constraint,
}: {
  sessionId: string;
  initial: Canvas;
  constraint: Constraint;
}) {
  const steps = buildSteps(constraint);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<GuidedRevisionAnswers>(() =>
    createInitialAnswers(steps),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const activeStep = steps[activeIndex];
  const activeAnswer = answers[activeStep.id];
  const activeDecision =
    activeStep.kind === "field"
      ? ECOMMERCE_REVISION_DECISIONS[activeStep.key]
      : ECOMMERCE_REVISION_STRATEGIES[activeStep.key];
  const activeOptions =
    activeStep.kind === "field"
      ? ECOMMERCE_REVISION_DECISIONS[activeStep.key].choices.map((choice) => ({
          ...choice,
          description: choice.revision,
        }))
      : ECOMMERCE_REVISION_STRATEGIES[activeStep.key].choices.map((choice) => ({
          ...choice,
          description: choice.response,
        }));
  const completedCount = steps.filter((step) =>
    isStepComplete(step, answers[step.id], initial),
  ).length;
  const currentComplete = isStepComplete(activeStep, activeAnswer, initial);
  const isLastStep = activeIndex === steps.length - 1;

  function updateActiveAnswer(next: Partial<GuidedRevisionAnswer>) {
    setAnswers((current) => ({
      ...current,
      [activeStep.id]: { ...current[activeStep.id], ...next },
    }));
    setError("");
  }

  function chooseAnswer(choiceId: string) {
    setAnswers((current) => ({
      ...current,
      [activeStep.id]: { ...emptyAnswer(), choiceId },
    }));
    setError("");
  }

  async function submit() {
    setPending(true);
    setError("");

    const revised_canvas: Canvas = { ...initial };
    const adaptations: RevisionStrategy["adaptations"] = {};
    for (const key of constraint.affected_fields) {
      const composed = composeFieldRevision(key, initial, answers[`field:${key}`]);
      revised_canvas[key] = composed.value;
      adaptations[key] = composed.adaptation;
    }
    const revision_strategy: RevisionStrategy = {
      adaptations,
      keep: composeStrategyRevision("keep", answers["strategy:keep"]),
      remove: composeStrategyRevision("remove", answers["strategy:remove"]),
      measure: composeStrategyRevision("measure", answers["strategy:measure"]),
    };

    try {
      const response = await fetch(`/api/sessions/${sessionId}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revised_canvas, revision_strategy }),
      });
      const result = (await response.json()) as ApiResult<unknown>;
      if (result.error) {
        setError(result.error.message);
        setPending(false);
        return;
      }
      router.push(result.next_path || `/assessment/${sessionId}/decision`);
    } catch {
      setError("The revision could not be saved. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form action={submit} className="space-y-6">
      <Card className="border-amber-400/25 bg-amber-400/5">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">
            New constraint
          </p>
          <CardTitle className="text-2xl">{constraint.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>{constraint.summary}</p>
          <p>
            <span className="text-foreground">Business impact:</span>{" "}
            {constraint.business_impact}
          </p>
          <p>
            <span className="text-foreground">Time pressure:</span>{" "}
            {constraint.time_pressure}
          </p>
          <div className="flex flex-wrap gap-2">
            {constraint.affected_fields.map((field) => (
              <span
                className="rounded-md border border-amber-300/20 px-2 py-1 font-mono text-[11px] text-amber-200"
                key={field}
              >
                {labels[field]}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/20 bg-card/85">
        <CardHeader className="space-y-5 border-b border-white/8 bg-primary/[0.035]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary">
                <RefreshCw /> Guided revision
              </Badge>
              <span className="text-sm text-muted-foreground">
                Decision {activeIndex + 1} of {steps.length}
              </span>
            </div>
            <span className="text-sm font-medium">{completedCount} complete</span>
          </div>
          <Progress
            aria-label={`${completedCount} of ${steps.length} revision decisions complete`}
            value={(completedCount / steps.length) * 100}
          />
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-7">
            {steps.map((step, index) => {
              const complete = isStepComplete(step, answers[step.id], initial);
              const active = index === activeIndex;
              const stepLabel =
                step.kind === "field"
                  ? ECOMMERCE_REVISION_DECISIONS[step.key].label
                  : ECOMMERCE_REVISION_STRATEGIES[step.key].label;
              return (
                <button
                  aria-current={active ? "step" : undefined}
                  aria-label={`Open ${stepLabel}`}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/10 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                  key={step.id}
                  onClick={() => setActiveIndex(index)}
                  title={stepLabel}
                  type="button"
                >
                  {complete && !active ? <Check className="size-3.5 text-primary" /> : index + 1}
                  <span className="hidden xl:inline">{stepLabel}</span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-5 md:p-8">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              {activeDecision.label}
            </p>
            <h2 className="mt-2 max-w-3xl text-2xl tracking-[-0.03em] md:text-3xl">
              {activeDecision.prompt}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {activeDecision.coaching}
            </p>

            {activeStep.kind === "field" && (
              <div className="mt-6 rounded-xl border border-white/10 bg-muted/25 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Original answer
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground/85">{initial[activeStep.key]}</p>
              </div>
            )}

            <RadioGroup
              aria-label={activeDecision.prompt}
              className="mt-7 grid gap-3 md:grid-cols-3"
              onValueChange={chooseAnswer}
              value={activeAnswer.choiceId}
            >
              {activeOptions.map((choice) => {
                const selected = activeAnswer.choiceId === choice.id;
                const controlId = `${activeStep.id}-${choice.id}`;
                return (
                  <Label
                    className={cn(
                      "group min-h-56 cursor-pointer flex-col items-stretch gap-0 rounded-xl border bg-background/45 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/[0.035]",
                      selected && "border-primary bg-primary/[0.07] ring-1 ring-primary/35",
                    )}
                    htmlFor={controlId}
                    key={choice.id}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <Badge variant="outline" className="font-normal">
                        {choice.tradeoff}
                      </Badge>
                      <RadioGroupItem id={controlId} value={choice.id} />
                    </span>
                    <span className="mt-5 block text-lg font-semibold text-foreground">
                      {choice.title}
                    </span>
                    <span className="mt-2 block text-sm font-normal leading-6 text-muted-foreground">
                      {choice.description}
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>

            <button
              aria-pressed={activeAnswer.choiceId === CUSTOM_CHOICE}
              className={cn(
                "mt-3 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-left text-sm transition-colors hover:border-primary/45 hover:bg-primary/[0.035]",
                activeAnswer.choiceId === CUSTOM_CHOICE &&
                  "border-primary bg-primary/[0.07]",
              )}
              onClick={() => chooseAnswer(CUSTOM_CHOICE)}
              type="button"
            >
              <span className="rounded-lg bg-muted p-2">
                <PencilLine className="size-4" />
              </span>
              <span>
                <span className="block font-medium">Need a different move? Build your own</span>
                <span className="text-muted-foreground">
                  Free writing stays available when none of the guided options fits.
                </span>
              </span>
            </button>

            {activeAnswer.choiceId && (
              <div className="mt-6 rounded-xl border border-white/10 bg-muted/25 p-5">
                {activeAnswer.choiceId === CUSTOM_CHOICE ? (
                  activeStep.kind === "field" ? (
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <Label htmlFor={`${activeStep.id}-custom-value`}>Revised answer</Label>
                        <Textarea
                          className="mt-2 min-h-28"
                          id={`${activeStep.id}-custom-value`}
                          maxLength={1500}
                          minLength={20}
                          onChange={(event) =>
                            updateActiveAnswer({ customValue: event.target.value })
                          }
                          placeholder="State the revised strategic choice."
                          value={activeAnswer.customValue}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">Minimum 20 characters.</p>
                      </div>
                      <div>
                        <Label htmlFor={`${activeStep.id}-custom-adaptation`}>
                          How it adapts to the constraint
                        </Label>
                        <Textarea
                          className="mt-2 min-h-28"
                          id={`${activeStep.id}-custom-adaptation`}
                          maxLength={600}
                          minLength={10}
                          onChange={(event) =>
                            updateActiveAnswer({ customAdaptation: event.target.value })
                          }
                          placeholder="Explain what changed and why."
                          value={activeAnswer.customAdaptation}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">Minimum 10 characters.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={`${activeStep.id}-custom-value`}>Your revision decision</Label>
                      <Textarea
                        autoFocus
                        className="mt-2 min-h-28"
                        id={`${activeStep.id}-custom-value`}
                        maxLength={600}
                        minLength={10}
                        onChange={(event) =>
                          updateActiveAnswer({ customValue: event.target.value })
                        }
                        placeholder="Write one explicit decision."
                        value={activeAnswer.customValue}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">Minimum 10 characters.</p>
                    </>
                  )
                ) : (
                  <>
                    <Label htmlFor={`${activeStep.id}-detail`}>
                      Add your angle{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      className="mt-2"
                      id={`${activeStep.id}-detail`}
                      maxLength={240}
                      onChange={(event) => updateActiveAnswer({ detail: event.target.value })}
                      placeholder="One detail that makes this revision yours"
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
          <p className="text-sm font-medium">Choose the revision move before adding detail.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your choices preserve the full revised canvas and the evidence used in scoring.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={activeIndex === 0 || pending}
            onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            type="button"
            variant="outline"
          >
            <ChevronLeft /> Back
          </Button>
          {isLastStep ? (
            <Button disabled={pending || completedCount !== steps.length} size="lg" type="submit">
              {pending ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
              {pending ? "Saving…" : "Lock revision"}
            </Button>
          ) : (
            <Button
              disabled={!currentComplete || pending}
              onClick={() => setActiveIndex((index) => Math.min(steps.length - 1, index + 1))}
              size="lg"
              type="button"
            >
              Continue <ChevronRight />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
