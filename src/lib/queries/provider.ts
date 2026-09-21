import type { SupabaseClient } from "@supabase/supabase-js"

export interface ProviderRow {
  id: string
  owner_user_id: string
  business_name: string
  abn: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website_domain: string | null
  logo_path: string | null
  is_employer_attested: boolean
  status: "active" | "suspended"
  first_job_approved: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_subscription_status: string | null
  stripe_price_id: string | null
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  grace_expires_at: string | null
}

export async function getProviderForUser(
  supabase: SupabaseClient
): Promise<ProviderRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("providers")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle()
  return data as ProviderRow | null
}
