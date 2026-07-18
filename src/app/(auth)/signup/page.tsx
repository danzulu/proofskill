import { AuthForm } from "@/components/auth-form";
import { safeNextPath } from "@/lib/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <div className="flex justify-center"><AuthForm mode="signup" next={safeNextPath(next)} /></div>;
}

