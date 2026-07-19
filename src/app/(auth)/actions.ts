"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { message?: string; success?: boolean } | undefined;

const credentialsSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8).max(128),
});

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function loginAction(_state: AuthState, formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { message: "Enter a valid email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: error.message };
  redirect(safeNextPath(formData.get("next")?.toString()));
}

export async function signupAction(_state: AuthState, formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { message: "Use a valid email and at least 8 characters." };
  if (formData.get("password") !== formData.get("confirm_password")) {
    return { message: "Passwords do not match." };
  }

  const next = safeNextPath(formData.get("next")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      data: { name: formData.get("name")?.toString().trim() || null },
      emailRedirectTo: baseUrl() + "/auth/confirm?next=" + encodeURIComponent(next),
    },
  });
  if (error) return { message: error.message };
  if (data.session) redirect(next);
  redirect(`/login?notice=check-email&next=${encodeURIComponent(next)}`);
}

export async function googleAction(formData: FormData) {
  const next = safeNextPath(formData.get("next")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: baseUrl() + "/auth/callback?next=" + encodeURIComponent(next),
    },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function forgotPasswordAction(_state: AuthState, formData: FormData) {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { message: "Enter a valid email." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: baseUrl() + "/update-password",
  });
  if (error) return { message: error.message };
  return {
    success: true,
    message: "If that account exists, a recovery link is on its way.",
  };
}

export async function updatePasswordAction(_state: AuthState, formData: FormData) {
  const password = z.string().min(8).max(128).safeParse(formData.get("password"));
  if (!password.success) return { message: "Use at least 8 characters." };
  if (formData.get("password") !== formData.get("confirm_password")) {
    return { message: "Passwords do not match." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { message: error.message };
  return { success: true, message: "Password updated. You can continue." };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
