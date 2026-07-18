import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.JUDGE_EMAIL;
const password = process.env.JUDGE_PASSWORD;

if (!url || !secret || !email || !password) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, JUDGE_EMAIL, and JUDGE_PASSWORD in .env.local.",
  );
}

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name: "ProofSkill Judge" },
});
if (error) throw error;
console.log("Judge account created:", data.user.id);

