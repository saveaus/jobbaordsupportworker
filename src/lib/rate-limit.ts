import { headers } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"

interface RateLimitInput {
  action: string
  email?: string
  max?: number
  windowSeconds?: number
}

/**
 * Postgres-backed sliding-window rate limit by IP and (optionally)
 * email. Returns true when the request is allowed.
 */
export async function checkRateLimit({
  action,
  email,
  max = 10,
  windowSeconds = 3600,
}: RateLimitInput): Promise<boolean> {
  const headerStore = await headers()
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const supabase = await createSupabaseServerClient()

  const keys = [`${action}:ip:${ip}`]
  if (email) keys.push(`${action}:email:${email.toLowerCase()}`)

  for (const key of keys) {
    const { data: allowed, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    })
    if (error) return true // never lock users out because limiting failed
    if (!allowed) return false
  }
  return true
}
