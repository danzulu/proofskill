"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiResult, RunMode } from "@/lib/domain/assessment";

export function StartAssessmentButton({ runMode }: { runMode: RunMode }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function start() {
    setPending(true);
    setError("");
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ run_mode: runMode }),
    });
    const result = (await response.json()) as ApiResult<{ id: string }>;
    if (result.error) {
      setError(result.error.message);
      setPending(false);
      return;
    }
    router.push(result.next_path || "/dashboard");
  }
  return (
    <div>
      <Button onClick={start} disabled={pending} variant={runMode === "live" ? "default" : "outline"}>
        {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        {runMode === "live" ? "Start live assessment" : "Start fixture rehearsal"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

