import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Button, ButtonLink } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { formatDate } from "@/lib/format"
import { startCheckout } from "./actions"
import type { AppPageProps } from "@/lib/page-props"
import { AccountNav } from "@/components/site/account-nav"

export const metadata: Metadata = { title: "Billing" }

export default async function BillingPage({ searchParams }: AppPageProps) {
  const params = await searchParams
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/billing")

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers/register")

  const status = provider.stripe_subscription_status
  const isPastDue = status === "past_due"

  return (
    <div className="flex flex-col gap-8">
      <AccountNav kind="provider" />
      <h1 className="text-h1">Billing</h1>
      {isPastDue ? (
        <p className="text-error">
          Payment failed. Update your card. If it is still unpaid after 3 days, your jobs
          will be unpublished.
        </p>
      ) : null}

      {!status ? (
        <div className="flex max-w-form flex-col gap-6">
          <p>
            $249 a month plus GST, or $2,490 a year plus GST. The first 14 days are free. A
            card is required to start. Cancel anytime.
          </p>
          <p className="text-sm text-muted">Prices exclude GST (10%). GST is added at checkout.</p>
          <form action={startCheckout} className="flex flex-col gap-4">
            <input type="hidden" name="interval" value="month" />
            <Button type="submit">Start free trial (monthly)</Button>
          </form>
          <form action={startCheckout}>
            <input type="hidden" name="interval" value="year" />
            <Button type="submit" variant="secondary">
              Start free trial (annual)
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex max-w-form flex-col gap-6">
          <p>
            Status: {status}
            {provider.trial_end ? ` · trial ends ${formatDate(new Date(provider.trial_end))}` : ""}
            {provider.current_period_end
              ? ` · current period ends ${formatDate(new Date(provider.current_period_end))}`
              : ""}
          </p>
          {provider.cancel_at_period_end ? (
            <p>Cancellation is scheduled. Jobs stay live until the end of the paid period.</p>
          ) : null}
          <ButtonLink href="/billing/portal">Manage billing</ButtonLink>
          <p className="text-sm text-muted">
            Opens the Stripe customer portal to cancel or update your card.
          </p>
        </div>
      )}
      {params.checkout === "ok" ? <p>Your trial is active.</p> : null}
    </div>
  )
}
