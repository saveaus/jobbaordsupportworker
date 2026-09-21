import { createClient } from "@supabase/supabase-js"
import { supabaseUrl } from "@/lib/supabase/config"

/**
 * Service-role client. Bypasses RLS. Use ONLY in Stripe webhooks, cron
 * routes and admin actions, per the access-control rules.
 */
export function createSupabaseServiceClient() {
  return createClient(
    supabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
