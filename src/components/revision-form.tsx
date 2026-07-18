"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult, Canvas, CanvasKey, Constraint } from "@/lib/domain/assessment";
import { canvasKeys } from "@/lib/domain/assessment";

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

export function RevisionForm({
  sessionId,
  initial,
  constraint,
}: {
  sessionId: string;
  initial: Canvas;
  constraint: Constraint;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    const revised_canvas = Object.fromEntries(canvasKeys.map((key) => [key, formData.get(key)]));
    const adaptations = Object.fromEntries(
      constraint.affected_fields.map((key) => [key, formData.get("adaptation_" + key)]),
    );
    const revision_strategy = {
      adaptations,
      keep: formData.get("keep"),
      remove: formData.get("remove"),
      measure: formData.get("measure"),
    };
    const response = await fetch("/api/sessions/" + sessionId + "/revision", {
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
    router.push(result.next_path || "/assessment/" + sessionId + "/decision");
  }
  return (
    <form action={submit} className="space-y-8">
      <Card className="border-amber-400/25 bg-amber-400/5">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">New constraint</p>
          <CardTitle className="text-2xl">{constraint.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>{constraint.summary}</p>
          <p><span className="text-foreground">Business impact:</span> {constraint.business_impact}</p>
          <p><span className="text-foreground">Time pressure:</span> {constraint.time_pressure}</p>
          <div className="flex flex-wrap gap-2">
            {constraint.affected_fields.map((field) => <span className="rounded-md border border-amber-300/20 px-2 py-1 font-mono text-[11px] text-amber-200" key={field}>{labels[field]}</span>)}
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl tracking-tight">Revise the canvas</h2>
        <p className="mt-2 text-sm text-muted-foreground">Keep what still works. Rewrite what the constraint invalidated.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {canvasKeys.map((key) => (
            <div className="space-y-2" key={key}>
              <Label htmlFor={key}>{labels[key]} {constraint.affected_fields.includes(key) && <span className="text-amber-300">· affected</span>}</Label>
              <Textarea id={key} name={key} defaultValue={initial[key]} minLength={20} rows={5} required />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl tracking-tight">Make the adaptation explicit</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {constraint.affected_fields.map((key) => (
            <div className="space-y-2" key={key}>
              <Label htmlFor={"adaptation_" + key}>How did {labels[key].toLowerCase()} adapt?</Label>
              <Textarea id={"adaptation_" + key} name={"adaptation_" + key} minLength={10} required />
            </div>
          ))}
          {[
            ["keep", "What do you keep—and why?"],
            ["remove", "What do you remove—and why?"],
            ["measure", "How will you know the revision worked?"],
          ].map(([name, label]) => (
            <div className="space-y-2" key={name}>
              <Label htmlFor={name}>{label}</Label>
              <Textarea id={name} name={name} minLength={10} required />
            </div>
          ))}
        </div>
      </section>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex justify-end border-t border-white/8 pt-6">
        <Button disabled={pending} size="lg">{pending && <Loader2 className="animate-spin" />}{pending ? "Saving…" : "Lock revision"}</Button>
      </div>
    </form>
  );
}

