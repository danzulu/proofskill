import Link from "next/link";
import { ArrowRight, CheckCircle2, Gauge, Quote, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="proof-grid relative overflow-hidden border-b border-white/8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,oklch(0.78_0.15_155/0.16),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-14 px-5 py-24 lg:grid-cols-[1.15fr_.85fr] lg:py-32">
            <div>
              <Badge variant="outline" className="mb-6 border-primary/35 text-primary">Education · Intermediate</Badge>
              <h1 className="max-w-3xl text-5xl font-medium tracking-[-0.055em] sm:text-7xl">
                Confidence is easy. <span className="text-primary">Evidence is earned.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
                ProofSkill pressure-tests a business proposal, changes the conditions, and scores how well the learner adapts—using exact, verifiable quotes from their own work.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href="/signup">Start the live assessment <ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/demo">Explore the precomputed demo</Link></Button>
              </div>
              <p className="mt-4 font-mono text-xs text-muted-foreground">One scenario · ~15 minutes · results saved to your account</p>
            </div>
            <Card className="self-end border-white/10 bg-card/70 shadow-2xl shadow-black/30">
              <CardContent className="space-y-6 p-7">
                <div className="flex items-end justify-between">
                  <div><p className="text-sm text-muted-foreground">Example outcome</p><p className="mt-1 text-2xl tracking-tight">Adaptive strategist</p></div>
                  <p className="font-mono text-5xl text-primary">82</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[82%] rounded-full bg-primary" /></div>
                <blockquote className="border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
                  “A bounded experiment protects the option to stop if contribution margin deteriorates.”
                </blockquote>
                <div className="grid grid-cols-3 gap-3 text-center font-mono text-[11px] text-muted-foreground">
                  <div className="rounded-lg bg-muted/60 p-3">7 skills</div>
                  <div className="rounded-lg bg-muted/60 p-3">Exact quotes</div>
                  <div className="rounded-lg bg-muted/60 p-3">Saved history</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              [Gauge, "Pressure, not trivia", "A material constraint forces the learner to revise an actual strategy."],
              [Quote, "Evidence, not vibes", "Positive findings are shown only when the exact quote exists in the submitted work."],
              [ShieldCheck, "Private by design", "Supabase RLS isolates every session; server handlers own every score mutation."],
            ].map(([Icon, title, text]) => (
              <Card key={String(title)} className="bg-card/40">
                <CardContent className="p-6">
                  <Icon className="mb-5 size-5 text-primary" />
                  <h2 className="text-lg tracking-tight">{String(title)}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(text)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-white/8 pt-10 md:flex-row md:items-center">
            <div><p className="text-2xl tracking-tight">Ready to make your reasoning inspectable?</p><p className="mt-1 text-sm text-muted-foreground">Create an account or inspect the marked demo first.</p></div>
            <Button asChild><Link href="/signup">Create account <CheckCircle2 /></Link></Button>
          </div>
        </section>
      </main>
    </div>
  );
}

