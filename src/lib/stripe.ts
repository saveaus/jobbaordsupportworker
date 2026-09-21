import Stripe from "stripe"

let client: Stripe | null = null

export function getStripe(): Stripe {
  if (client) return client
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  client = new Stripe(key)
  return client
}

export const MONTHLY_AMOUNT_CENTS = 24900
export const ANNUAL_AMOUNT_CENTS = 249000
export const TRIAL_DAYS = 14
