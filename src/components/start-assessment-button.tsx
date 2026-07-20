"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiResult } from "@/lib/domain/assessment";

export function StartAssessmentButton() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function start() {
    setPending(true);
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
        setPending(false);
        return;
      }
      router.push(result.next_path || "/dashboard");
    } catch {
      setError("The assessment could not start. Check your connection and try again.");
      setPending(false);
    }
  }
  return (
    <div>
      <Button onClick={start} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        Start live assessment
      </Button>
      {error && <p aria-live="polite" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

