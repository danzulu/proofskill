import { AuthForm } from "@/components/auth-form";
import { safeNextPath } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const { next, notice } = await searchParams;
  return (
    <div className="flex justify-center">
      <AuthForm
        mode="login"
        next={safeNextPath(next)}
        notice={
          notice === "check-email"
            ? "Account created. Check your inbox to confirm your email, then sign in."
            : undefined
        }
      />
    </div>
  );
}
