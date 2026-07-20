"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiResult } from "@/lib/domain/assessment";

type StartState = "idle" | "pending" | "uncertain";

const startReconciliationMessage =
  "ProofSkill could not confirm whether the assessment was created. Check your dashboard before starting another assessment.";

export function StartAssessmentButton() {
  const [error, setError] = useState("");
  const [state, setState] = useState<StartState>("idle");
  const router = useRouter();
  async function start() {
    setState("pending");
    setError("");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_mode: "live" }),
      });
      const result = (await response.json()) as ApiResult<{ id: string }>;
      if (result.error) {
        setError(result.error.message);
        setState("idle");
        return;
      }
      router.push(result.next_path || "/dashboard");
    } catch {
      setError(startReconciliationMessage);
      setState("uncertain");
    }
  }
  return (
    <div>
      <Button onClick={start} disabled={state !== "idle"}>
        {state === "pending" ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <ArrowRight />}
        Start live assessment
      </Button>
      {error && <p aria-live="polite" className="mt-2 text-sm text-destructive">{error}</p>}
      {state === "uncertain" && (
        <Link className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" href="/dashboard">
          Check dashboard
        </Link>
      )}
    </div>
  );
}

