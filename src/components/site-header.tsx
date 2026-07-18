import Link from "next/link";
import { ArrowRight, LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getUser().catch(() => null);
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link className="flex items-center gap-2 font-medium tracking-[-0.03em]" href="/">
          <span className="grid size-7 place-items-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground">P</span>
          ProofSkill
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/demo">Public demo</Link></Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/dashboard">Dashboard</Link></Button>
              <form action={logoutAction}>
                <Button aria-label="Sign out" variant="outline" size="icon-sm"><LogOut /></Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
              <Button asChild size="sm"><Link href="/signup">Create account <ArrowRight /></Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

