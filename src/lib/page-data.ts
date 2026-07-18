import "server-only";

import { notFound } from "next/navigation";
import type { SessionRecord } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

export async function getSessionForPage(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();
  return data as SessionRecord;
}

