import { redirect } from "next/navigation"
import { getAccountKind } from "@/lib/account"
import { isUsableForPosting, type BillingSnapshot } from "@/lib/billing"
import { getProviderForUser, type ProviderRow } from "@/lib/queries/provider"
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"

function snapshotFromProvider(provider: ProviderRow): BillingSnapshot {
  return {
    stripeStatus: provider.stripe_subscription_status,
    trialEnd: provider.trial_end ? new Date(provider.trial_end) : null,
    currentPeriodEnd: provider.current_period_end
      ? new Date(provider.current_period_end)
      : null,
    cancelAtPeriodEnd: provider.cancel_at_period_end,
    graceExpiresAt: provider.grace_expires_at ? new Date(provider.grace_expires_at) : null,
  }
}

export async function getPostingState() {
  if (!isSupabaseConfigured()) return { isProvider: false, requiresPayment: true }
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { isProvider: false, requiresPayment: true }

  const kind = await getAccountKind(supabase)
  if (kind !== "provider") return { isProvider: false, requiresPayment: true }

  const provider = await getProviderForUser(supabase)
  if (!provider) return { isProvider: true, requiresPayment: true }

  return {
    isProvider: true,
    requiresPayment: !isUsableForPosting(snapshotFromProvider(provider), new Date()),
  }
}

export async function requireProviderForPost(next = "/jobs/new") {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`)

  const kind = await getAccountKind(supabase)
  if (!kind) redirect(`/get-started?next=${encodeURIComponent(next)}&intent=hire`)
  if (kind === "applicant") redirect("/account")

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers/register")

  const requiresPayment = !isUsableForPosting(snapshotFromProvider(provider), new Date())
  return { provider, requiresPayment }
}
