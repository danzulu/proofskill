import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { RunMode } from "@/lib/domain/assessment";

const steps = ["Propose", "Adapt", "Decide", "Report"];

export function AssessmentShell({
  children,
  currentStep,
  runMode,
  sessionId,
}: {
  children: React.ReactNode;
  currentStep: number;
  runMode: RunMode;
  sessionId: string;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/8">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link className="font-medium tracking-tight" href="/dashboard">ProofSkill</Link>
          <div className="flex items-center gap-2">
            <Badge variant={runMode === "fixture" ? "outline" : "default"}>
              {runMode === "fixture" ? "Fixture" : "Live · GPT‑5.6"}
            </Badge>
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
              {sessionId.slice(0, 8)}
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-10">
          <div className="mb-3 flex justify-between text-xs text-muted-foreground">
            {steps.map((step, index) => (
              <span className={index <= currentStep ? "text-foreground" : ""} key={step}>{step}</span>
            ))}
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} />
        </div>
        {children}
      </main>
    </div>
  );
}

