"use server"

import { redirect } from "next/navigation"
import { siteConfig } from "@/config/site"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { getProviderForUser } from "@/lib/queries/provider"
import { getStripe, TRIAL_DAYS } from "@/lib/stripe"

export async function startCheckout(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/billing")

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers")

  const interval = formData.get("interval") === "year" ? "year" : "month"
  const priceId =
    interval === "year" ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY
  if (!priceId) redirect("/billing")

  const stripe = getStripe()
  const service = createSupabaseServiceClient()

  let customerId = provider.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: provider.email ?? user.email ?? undefined,
      name: provider.business_name,
      metadata: { provider_id: provider.id },
    })
    customerId = customer.id
    await service.from("providers").update({ stripe_customer_id: customerId }).eq("id", provider.id)
  }

  const taxRates = process.env.STRIPE_TAX_RATE_GST
    ? [process.env.STRIPE_TAX_RATE_GST]
    : undefined

  const suffix = Math.random().toString(36).slice(2, 10)
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: provider.id,
    success_url: `${siteConfig.url}/billing?checkout=ok`,
    cancel_url: `${siteConfig.url}/billing`,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { provider_id: provider.id },
      default_tax_rates: taxRates,
    },
    payment_method_collection: "always",
    integration_identifier: `provider-trial-${suffix}`,
  })

  if (!session.url) redirect("/billing")
  redirect(session.url)
}
