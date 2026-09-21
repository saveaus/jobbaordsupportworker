import { createClient } from "@supabase/supabase-js"

/**
 * Service-role client. Bypasses RLS. Use ONLY in Stripe webhooks, cron
 * routes and admin actions, per the access-control rules.
 */
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
