"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiResult } from "@/lib/domain/assessment";

export function GenerateConstraintButton({ sessionId }: { sessionId: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function generate() {
    setPending(true);
    setError("");
    const response = await fetch("/api/sessions/" + sessionId + "/constraint", { method: "POST" });
    const result = (await response.json()) as ApiResult<unknown>;
    if (result.error) {
      setError(result.error.message);
      setPending(false);
      return;
    }
    router.push(result.next_path || "/assessment/" + sessionId + "/constraint");
  }
  return (
    <div className="rounded-xl border border-white/10 bg-card p-8 text-center">
      <h2 className="text-2xl tracking-tight">Your proposal is saved</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Constraint generation did not finish. Your work is safe; retry only the model step.</p>
      <Button className="mt-6" onClick={generate} disabled={pending}>{pending && <Loader2 className="animate-spin" />}{pending ? "Generating…" : "Generate constraint"}</Button>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}

