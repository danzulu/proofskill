import Link from "next/link";
import { ReportView } from "@/components/report-view";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DEMO_REPORT } from "@/lib/demo-data";

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <div className="mb-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
          <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Public report</p><h1 className="mt-3 text-4xl tracking-[-0.04em]">What a ProofSkill result looks like</h1></div>
          <Button asChild><Link href="/signup">Create your own result</Link></Button>
        </div>
        <ReportView report={DEMO_REPORT} mode="demo" />
      </main>
    </div>
  );
}

