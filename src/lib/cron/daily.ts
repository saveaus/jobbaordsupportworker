import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { siteConfig } from "@/config/site"
import {
  sendDailyDigest,
  sendJobAlert,
  sendJobExpiring,
  sendJobsUnpublished,
  sendTrialEnding,
} from "@/lib/email/templates"
import {
  shouldUnpublishForCancellation,
  shouldUnpublishForFailedPayment,
  type BillingSnapshot,
} from "@/lib/billing"
import { formatLocation } from "@/lib/format"
import { firstRelation } from "@/lib/relation"

const BATCH = 50

function snapshot(row: {
  stripe_subscription_status: string | null
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  grace_expires_at: string | null
}): BillingSnapshot {
  return {
    stripeStatus: row.stripe_subscription_status,
    trialEnd: row.trial_end ? new Date(row.trial_end) : null,
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    graceExpiresAt: row.grace_expires_at ? new Date(row.grace_expires_at) : null,
  }
}

async function expireJobs(now: Date) {
  const db = createSupabaseServiceClient()
  await db
    .from("jobs")
    .update({ status: "expired" })
    .eq("status", "live")
    .lt("expires_at", now.toISOString())
}

async function emailExpiringSoon(now: Date) {
  const db = createSupabaseServiceClient()
  const from = new Date(now.getTime() + 2.5 * 86_400_000)
  const to = new Date(now.getTime() + 3.5 * 86_400_000)
  const { data: jobs } = await db
    .from("jobs")
    .select("id, title, provider_id, providers(email, owner_user_id)")
    .eq("status", "live")
    .eq("source", "posted")
    .gte("expires_at", from.toISOString())
    .lte("expires_at", to.toISOString())
    .limit(BATCH)

  for (const job of jobs ?? []) {
    const email = firstRelation(
      job.providers as { email: string | null }[] | { email: string | null } | null
    )?.email
    if (!email) continue
    await sendJobExpiring(
      email,
      job.title,
      `${siteConfig.url}/dashboard/jobs/${job.id}/renew`
    )
  }
}

async function emailTrialEnding(now: Date) {
  const db = createSupabaseServiceClient()
  const from = new Date(now.getTime() + 2.5 * 86_400_000)
  const to = new Date(now.getTime() + 3.5 * 86_400_000)
  const { data: providers } = await db
    .from("providers")
    .select("email, trial_end")
    .eq("stripe_subscription_status", "trialing")
    .gte("trial_end", from.toISOString())
    .lte("trial_end", to.toISOString())
    .limit(BATCH)

  for (const provider of providers ?? []) {
    if (!provider.email) continue
    await sendTrialEnding(provider.email, `${siteConfig.url}/billing`)
  }
}

async function unpublishOverdue(now: Date) {
  const db = createSupabaseServiceClient()
  const { data: providers } = await db
    .from("providers")
    .select(
      "id,email,stripe_subscription_status,trial_end,current_period_end,cancel_at_period_end,grace_expires_at"
    )
    .not("stripe_subscription_status", "is", null)
    .limit(200)

  for (const provider of providers ?? []) {
    const snap = snapshot(provider)
    const failed = shouldUnpublishForFailedPayment(snap, now)
    const cancelled = shouldUnpublishForCancellation(snap, now)
    if (!failed && !cancelled) continue
    const { data: live } = await db
      .from("jobs")
      .select("id")
      .eq("provider_id", provider.id)
      .eq("status", "live")
      .eq("source", "posted")
    if (!live?.length) continue
    await db
      .from("jobs")
      .update({ status: "unpublished", unpublished_at: now.toISOString() })
      .eq("provider_id", provider.id)
      .eq("status", "live")
      .eq("source", "posted")
    if (failed && provider.email)
      await sendJobsUnpublished(provider.email, `${siteConfig.url}/billing`)
  }
}

async function sendAlerts(now: Date) {
  const db = createSupabaseServiceClient()
  const weekday = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Sydney" })).getDay()
  const { data: alerts } = await db
    .from("job_alerts")
    .select("id, user_id, lat, lng, radius_km, work_types, frequency, last_sent_at")
    .eq("active", true)
    .limit(BATCH)

  for (const alert of alerts ?? []) {
    if (alert.frequency === "weekly" && weekday !== 1) continue
    const { data: profile } = await db
      .from("profiles")
      .select("email")
      .eq("user_id", alert.user_id)
      .maybeSingle()
    if (!profile?.email) continue

    const since = alert.last_sent_at
      ? new Date(alert.last_sent_at)
      : new Date(now.getTime() - 86_400_000)

    const { data: jobs } = await db
      .from("jobs")
      .select("slug, title, suburb, state, work_type, lat, lng, published_at")
      .eq("status", "live")
      .gte("published_at", since.toISOString())
      .limit(20)

    const matches = (jobs ?? []).filter((job) => {
      if (alert.work_types?.length && !alert.work_types.includes(job.work_type)) return false
      return true
    })
    if (matches.length === 0) continue

    await sendJobAlert(
      profile.email,
      matches.map((job) => ({
        title: job.title,
        href: `${siteConfig.url}/jobs/${job.slug}`,
        location: formatLocation(job.suburb, job.state),
      }))
    )
    await db.from("job_alerts").update({ last_sent_at: now.toISOString() }).eq("id", alert.id)
  }
}

async function sendDigests(now: Date) {
  const db = createSupabaseServiceClient()
  const since = new Date(now.getTime() - 86_400_000)
  const { data: apps } = await db
    .from("applications")
    .select("job_id, jobs(id, title, slug, provider_id, providers(email))")
    .gte("created_at", since.toISOString())
    .limit(500)

  const byJob = new Map<
    string,
    { title: string; slug: string; email: string | null; count: number }
  >()
  for (const app of apps ?? []) {
    const job = firstRelation(
      app.jobs as
        | {
            id: string
            title: string
            slug: string
            providers: { email: string | null }[] | { email: string | null } | null
          }[]
        | {
            id: string
            title: string
            slug: string
            providers: { email: string | null }[] | { email: string | null } | null
          }
        | null
    )
    if (!job) continue
    const email = firstRelation(job.providers)?.email ?? null
    const current = byJob.get(job.id) ?? {
      title: job.title,
      slug: job.slug,
      email,
      count: 0,
    }
    current.count += 1
    byJob.set(job.id, current)
  }

  for (const [jobId, info] of byJob) {
    if (!info.email) continue
    await sendDailyDigest(
      info.email,
      info.title,
      info.count,
      `${siteConfig.url}/dashboard/jobs/${jobId}`
    )
  }
}

async function closeAccessWindows(now: Date) {
  const db = createSupabaseServiceClient()
  const cutoff = new Date(now.getTime() - 90 * 86_400_000)
  await db
    .from("applications")
    .update({ access_expires_at: now.toISOString() })
    .is("access_expires_at", null)
    .in("job_id", [])
  // Closed jobs already set access_expires_at via trigger. Backfill any
  // filled/expired jobs whose applications still have a null expiry.
  const { data: closed } = await db
    .from("jobs")
    .select("id, closed_at")
    .in("status", ["filled", "expired"])
    .not("closed_at", "is", null)
    .lt("closed_at", cutoff.toISOString())
    .limit(BATCH)

  for (const job of closed ?? []) {
    await db
      .from("applications")
      .update({ access_expires_at: now.toISOString() })
      .eq("job_id", job.id)
      .is("access_expires_at", null)
  }
}

async function housekeeping(now: Date) {
  const db = createSupabaseServiceClient()
  const dayAgo = new Date(now.getTime() - 86_400_000).toISOString()
  const ninety = new Date(now.getTime() - 90 * 86_400_000).toISOString()
  await db.from("rate_limits").delete().lt("created_at", dayAgo)
  await db.from("stripe_events").delete().lt("created_at", ninety)
}

export async function runDailyCron() {
  const now = new Date()
  await expireJobs(now)
  await emailExpiringSoon(now)
  await emailTrialEnding(now)
  await unpublishOverdue(now)
  await sendAlerts(now)
  await sendDigests(now)
  await closeAccessWindows(now)
  await housekeeping(now)
}
