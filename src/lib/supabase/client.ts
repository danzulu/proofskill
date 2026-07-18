import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const { url, key } = getSupabasePublicEnv();
  browserClient ??= createBrowserClient(url, key);
  return browserClient;
}

