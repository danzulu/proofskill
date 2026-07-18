import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://proofskill.local");
    return parsed.origin === "https://proofskill.local"
      ? parsed.pathname + parsed.search + parsed.hash
      : fallback;
  } catch {
    return fallback;
  }
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(nextPath?: string) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=" + encodeURIComponent(safeNextPath(nextPath)));
  }
  return user;
}

