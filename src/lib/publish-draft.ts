import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { isUsableForPosting, JOB_LIFE_MS } from "@/lib/billing"

export async function publishDraftJob(jobId: string, providerId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return

  const db = createSupabaseServiceClient()
  const { data: provider } = await db
    .from("providers")
    .select(
      "id, first_job_approved, stripe_subscription_status, trial_end, current_period_end, cancel_at_period_end, grace_expires_at"
    )
    .eq("id", providerId)
    .maybeSingle()
  if (!provider) return

  const usable = isUsableForPosting(
    {
      stripeStatus: provider.stripe_subscription_status,
      trialEnd: provider.trial_end ? new Date(provider.trial_end) : null,
      currentPeriodEnd: provider.current_period_end
        ? new Date(provider.current_period_end)
        : null,
      cancelAtPeriodEnd: provider.cancel_at_period_end,
      graceExpiresAt: provider.grace_expires_at ? new Date(provider.grace_expires_at) : null,
    },
    new Date()
  )
  if (!usable) return

  const now = new Date()
  const status = provider.first_job_approved ? "live" : "pending_approval"
  await db
    .from("jobs")
    .update({
      status,
      published_at: status === "live" ? now.toISOString() : null,
      expires_at: status === "live" ? new Date(now.getTime() + JOB_LIFE_MS).toISOString() : null,
    })
    .eq("id", jobId)
    .eq("provider_id", providerId)
    .eq("status", "draft")
}
