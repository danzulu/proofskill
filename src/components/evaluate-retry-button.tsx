"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiResult } from "@/lib/domain/assessment";

export function EvaluateRetryButton({ sessionId }: { sessionId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function evaluate() {
    setPending(true);
    setError("");
    const response = await fetch("/api/sessions/" + sessionId + "/evaluate", { method: "POST" });
    const result = (await response.json()) as ApiResult<unknown>;
    if (result.error) {
      setError(result.error.message);
      setPending(false);
      return;
    }
    router.push(result.next_path || "/results/" + sessionId);
  }
  return (
    <div className="rounded-xl border border-white/10 bg-card p-8 text-center">
      <Loader2 className="mx-auto size-8 text-primary" />
      <h1 className="mt-5 text-3xl tracking-tight">Evaluation is ready to resume</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Your decision is already saved. Retry only the evaluation step; the unique report constraint prevents duplicates.</p>
      <Button className="mt-6" onClick={evaluate} disabled={pending}>{pending && <Loader2 className="animate-spin" />}{pending ? "Evaluating…" : "Resume evaluation"}</Button>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}

