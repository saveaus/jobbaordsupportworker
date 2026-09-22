import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { isUsableForPosting } from "@/lib/billing"
import { JobForm } from "./job-form"
import { getAccountKind } from "@/lib/account"
import { AccountNav } from "@/components/site/account-nav"

export const metadata: Metadata = { title: "Post a job" }

export default async function NewJobPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/jobs/new")

  const kind = await getAccountKind(supabase)
  if (!kind) redirect("/get-started?next=/jobs/new&intent=hire")
  if (kind === "applicant") redirect("/account")

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers/register")

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
  if (!usable) redirect("/billing")

  return (
    <div className="flex flex-col gap-8">
      <AccountNav kind="provider" />
      <h1 className="text-h1">Post a job</h1>
      {!provider.first_job_approved ? (
        <p className="text-sm text-muted">
          Your first job is held for approval. Later jobs publish instantly.
        </p>
      ) : null}
      <JobForm />
    </div>
  )
}
