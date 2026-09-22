import { redirect } from "next/navigation"
import { siteConfig } from "@/config/site"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { getStripe } from "@/lib/stripe"

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/settings")

  const provider = await getProviderForUser(supabase)
  if (!provider?.stripe_customer_id) redirect("/settings")

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: provider.stripe_customer_id,
    return_url: `${siteConfig.url}/settings`,
  })
  redirect(session.url)
}
