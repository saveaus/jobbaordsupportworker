/**
 * Create the Stripe product, monthly/annual prices, 10% GST tax rate,
 * and a customer portal configuration. Run once per Stripe account:
 *
 *   npx tsx scripts/stripe-setup.ts
 *
 * Prints the IDs to paste into .env as STRIPE_PRICE_MONTHLY,
 * STRIPE_PRICE_ANNUAL and STRIPE_TAX_RATE_GST.
 */
import Stripe from "stripe"

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error("Set STRIPE_SECRET_KEY first.")
  process.exit(1)
}

const stripe = new Stripe(key)

async function main() {
  const product = await stripe.products.create({
    name: "Supportwork provider",
    description: "Unlimited support work job posts.",
  })

  const monthly = await stripe.prices.create({
    product: product.id,
    currency: "aud",
    unit_amount: 24900,
    recurring: { interval: "month" },
    tax_behavior: "exclusive",
  })

  const annual = await stripe.prices.create({
    product: product.id,
    currency: "aud",
    unit_amount: 249000,
    recurring: { interval: "year" },
    tax_behavior: "exclusive",
  })

  const tax = await stripe.taxRates.create({
    display_name: "GST",
    description: "Australian GST",
    percentage: 10,
    inclusive: false,
    country: "AU",
  })

  await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Manage your Supportwork billing",
    },
    features: {
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
      },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
    },
  })

  console.log("STRIPE_PRICE_MONTHLY=" + monthly.id)
  console.log("STRIPE_PRICE_ANNUAL=" + annual.id)
  console.log("STRIPE_TAX_RATE_GST=" + tax.id)
  console.log("Set business name and ABN on Stripe invoices in Dashboard → Settings → Business.")
}

main().catch(function onError(error) {
  console.error(error)
  process.exit(1)
})
