"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiResult } from "@/lib/domain/assessment";

const evaluationProcessing = {
  title: "GPT-5.6 is evaluating your evidence",
  description:
    "The model is reviewing the complete decision trail. This can take up to a minute.",
} as const;

export function EvaluateRetryButton({ sessionId }: { sessionId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function evaluate() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${sessionId}/evaluate`, {
        method: "POST",
      });
      const result = (await response.json()) as ApiResult<unknown>;
      if (result.error) {
        setError(result.error.message);
        setPending(false);
        router.refresh();
        return;
      }
      router.push(result.next_path || `/results/${sessionId}`);
    } catch {
      setError(
        "The evaluation connection was interrupted. Check your connection and try again.",
      );
      setPending(false);
      router.refresh();
    }
  }

  return (
    <div
      aria-busy={pending}
      className="rounded-xl border border-white/10 bg-card p-8 text-center"
    >
      {pending && (
        <ProcessingOverlay
          description={evaluationProcessing.description}
          title={evaluationProcessing.title}
        />
      )}
      <Loader2 className="mx-auto size-8 text-primary" />
      <h1 className="mt-5 text-3xl tracking-tight">Evaluation is ready to resume</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Your decision is already saved. Retry only the evaluation step; the unique report
        constraint prevents duplicates.
      </p>
      <Button className="mt-6" disabled={pending} onClick={evaluate}>
        {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        {pending ? "Evaluating…" : "Resume evaluation"}
      </Button>
      {error && (
        <Alert aria-live="polite" className="mt-4 text-left" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
