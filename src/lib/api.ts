import type { ApiResult } from "@/lib/domain/assessment";
import { createClient } from "@/lib/supabase/server";

export function ok<T>(data: T, next_path?: string, init?: ResponseInit) {
  return Response.json(
    { data, error: null, ...(next_path ? { next_path } : {}) } satisfies ApiResult<T>,
    {
      ...init,
      headers: {
        "Cache-Control": "private, no-store",
        ...init?.headers,
      },
    },
  );
}

export function fail(
  code: string,
  message: string,
  status: number,
  retryable = false,
) {
  return Response.json(
    { data: null, error: { code, message, retryable } } satisfies ApiResult<never>,
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function authenticateApi() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error, supabase };
}

