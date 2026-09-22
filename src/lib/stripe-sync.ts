import type Stripe from "stripe"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { getStripe } from "@/lib/stripe"
import {
  nextGraceExpiresAt,
  republishExpiresAt,
  shouldRepublishOnPayment,
  shouldUnpublishForCancellation,
  shouldUnpublishForFailedPayment,
  type BillingSnapshot,
} from "@/lib/billing"
import { sendJobsUnpublished, sendPaymentFailed } from "@/lib/email/templates"

interface ProviderRow {
  id: string
  email: string | null
  stripe_subscription_status: string | null
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  grace_expires_at: string | null
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  const item = sub.items.data[0]
  const end = item?.current_period_end ?? null
  return end ? new Date(end * 1000) : null
}

function snapshotFromRow(row: ProviderRow): BillingSnapshot {
  return {
    stripeStatus: row.stripe_subscription_status,
    trialEnd: row.trial_end ? new Date(row.trial_end) : null,
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    graceExpiresAt: row.grace_expires_at ? new Date(row.grace_expires_at) : null,
  }
}

async function unpublishLiveJobs(providerId: string) {
  const db = createSupabaseServiceClient()
  await db
    .from("jobs")
    .update({ status: "unpublished", unpublished_at: new Date().toISOString() })
    .eq("provider_id", providerId)
    .eq("status", "live")
    .eq("source", "posted")
}

async function republishUnpublishedJobs(providerId: string) {
  const db = createSupabaseServiceClient()
  const { data: jobs } = await db
    .from("jobs")
    .select("id, expires_at, unpublished_at")
    .eq("provider_id", providerId)
    .eq("status", "unpublished")
    .eq("source", "posted")

  const now = new Date()
  for (const job of jobs ?? []) {
    if (!job.unpublished_at || !job.expires_at) continue
    const expires = republishExpiresAt(
      new Date(job.expires_at),
      new Date(job.unpublished_at),
      now
    )
    await db
      .from("jobs")
      .update({
        status: "live",
        expires_at: expires.toISOString(),
        unpublished_at: null,
      })
      .eq("id", job.id)
  }
}

/**
 * Fetch the subscription from Stripe (source of truth) and persist it.
 * Event order is never trusted.
 */
export async function syncSubscription(subscriptionId: string) {
  const stripe = getStripe()
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
  const db = createSupabaseServiceClient()

  const { data: provider } = await db
    .from("providers")
    .select(
      "id,email,stripe_subscription_status,trial_end,current_period_end,cancel_at_period_end,grace_expires_at"
    )
    .eq("stripe_customer_id", customerId)
    .maybeSingle()

  if (!provider) return

  const now = new Date()
  const previousStatus = provider.stripe_subscription_status
  const grace = nextGraceExpiresAt(
    previousStatus,
    sub.status,
    provider.grace_expires_at ? new Date(provider.grace_expires_at) : null,
    now
  )

  await db
    .from("providers")
    .update({
      stripe_subscription_id: sub.id,
      stripe_subscription_status: sub.status,
      stripe_price_id: sub.items.data[0]?.price.id ?? null,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: periodEnd(sub)?.toISOString() ?? null,
      cancel_at_period_end: sub.cancel_at_period_end,
      grace_expires_at: grace?.toISOString() ?? null,
    })
    .eq("id", provider.id)

  const next: BillingSnapshot = {
    stripeStatus: sub.status,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    currentPeriodEnd: periodEnd(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    graceExpiresAt: grace,
  }

  const becamePastDue = sub.status === "past_due" && previousStatus !== "past_due"
  if (becamePastDue && provider.email) {
    await sendPaymentFailed(provider.email, `${process.env.NEXT_PUBLIC_SITE_URL}/billing`)
  }

  if (shouldUnpublishForFailedPayment(next, now) || shouldUnpublishForCancellation(next, now)) {
    await unpublishLiveJobs(provider.id)
    if (shouldUnpublishForFailedPayment(next, now) && provider.email)
      await sendJobsUnpublished(provider.email, `${process.env.NEXT_PUBLIC_SITE_URL}/billing`)
  }

  if (shouldRepublishOnPayment(previousStatus, sub.status))
    await republishUnpublishedJobs(provider.id)
}

export async function syncCheckoutSession(
  sessionId: string,
  expectedCustomerId: string | null
) {
  if (!sessionId.startsWith("cs_")) return
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  const sessionCustomer =
    typeof session.customer === "string" ? session.customer : session.customer?.id
  if (expectedCustomerId && sessionCustomer && sessionCustomer !== expectedCustomerId)
    return
  const subscription = session.subscription
  const subscriptionId = typeof subscription === "string" ? subscription : subscription?.id
  if (subscriptionId) await syncSubscription(subscriptionId)
}

export { snapshotFromRow }
