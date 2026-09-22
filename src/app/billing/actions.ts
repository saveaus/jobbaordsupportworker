"use server"

import { redirect } from "next/navigation"
import { siteConfig } from "@/config/site"
import { isUsableForPosting, type BillingSnapshot } from "@/lib/billing"
import { safeNext } from "@/lib/account-kind"
import { firstRelation } from "@/lib/relation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { getProviderForUser, type ProviderRow } from "@/lib/queries/provider"
import { getStripe, TRIAL_DAYS } from "@/lib/stripe"

function checkoutReturnPath(value: FormDataEntryValue | null) {
  const next = safeNext(String(value ?? ""), "/jobs/new")
  if (next === "/settings" || next === "/dashboard") return next
  if (next.startsWith("/dashboard/jobs/")) return next
  return "/jobs/new"
}

function parseJobId(value: FormDataEntryValue | null) {
  const jobId = String(value ?? "")
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId))
    return null
  return jobId
}

export async function startCheckout(formData: FormData) {
  const jobId = parseJobId(formData.get("jobId"))
  const returnPath = jobId
    ? `/dashboard/jobs/${jobId}`
    : checkoutReturnPath(formData.get("next"))
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnPath)}`)

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers/register")

  if (jobId && isUsableForPosting(snapshotFromProvider(provider), new Date())) {
    const { data } = await supabase.rpc("publish_draft_job", { p_job_id: jobId })
    const published = firstRelation(
      data as { status?: string; slug?: string } | { status?: string; slug?: string }[] | null
    )
    if (published?.status === "live" && published.slug)
      redirect(`/jobs/${published.slug}`)
    redirect(`/dashboard/jobs/${jobId}`)
  }

  const interval = formData.get("interval") === "year" ? "year" : "month"
  await redirectToCheckout({
    userEmail: user.email,
    provider,
    jobId,
    interval,
    returnPath,
  })
}

export async function redirectToCheckout({
  userEmail,
  provider,
  jobId,
  interval = "month",
  returnPath,
}: {
  userEmail?: string | null
  provider: ProviderRow
  jobId?: string | null
  interval?: "month" | "year"
  returnPath: string
}) {
  const priceId =
    interval === "year" ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY
  if (!priceId) redirect(`${returnPath}?error=billing`)

  try {
    const stripe = getStripe()

    let customerId = provider.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: provider.email ?? userEmail ?? undefined,
        name: provider.business_name,
        metadata: { provider_id: provider.id },
      })
      customerId = customer.id
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const service = createSupabaseServiceClient()
        await service.from("providers").update({ stripe_customer_id: customerId }).eq("id", provider.id)
      }
    }

    const taxRates = process.env.STRIPE_TAX_RATE_GST
      ? [process.env.STRIPE_TAX_RATE_GST]
      : undefined

    const suffix = Math.random().toString(36).slice(2, 10)
    const metadata: Record<string, string> = { provider_id: provider.id }
    if (jobId) metadata.job_id = jobId

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: provider.id,
      success_url: `${siteConfig.url}${returnPath}?checkout=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteConfig.url}${jobId ? "/dashboard" : returnPath}`,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata,
        default_tax_rates: taxRates,
      },
      payment_method_collection: "always",
      integration_identifier: `provider-trial-${suffix}`,
    })

    if (!session.url) redirect(`${returnPath}?error=billing`)
    redirect(session.url)
  } catch (error) {
    if (isNextRedirect(error)) throw error
    console.error("startCheckout", error)
    redirect(`${returnPath}?error=billing`)
  }
}

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

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  )
}
