import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.55_0.16_155/0.18),transparent_35%),radial-gradient(circle_at_bottom_right,oklch(0.55_0.14_250/0.14),transparent_35%)]" />
      <Link className="absolute left-6 top-6 font-medium tracking-tight" href="/">ProofSkill</Link>
      <div className="relative w-full">{children}</div>
    </main>
  );
}

