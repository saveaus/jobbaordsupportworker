import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getAccountKind } from "@/lib/account"
import { getProviderForUser } from "@/lib/queries/provider"
import { PageNav } from "@/components/site/page-nav"
import { BillingSection } from "./billing-section"
import { deleteAccount } from "./actions"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage({
  searchParams,
}: PageProps<"/settings">) {
  const params = await searchParams
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/settings")

  const kind = await getAccountKind(supabase)
  const provider = kind === "provider" ? await getProviderForUser(supabase) : null

  const homeHref = kind === "provider" ? "/dashboard" : kind === "applicant" ? "/profile" : "/"
  const homeLabel = kind === "provider" ? "Job posts" : kind === "applicant" ? "My profile" : "Jobs"

  return (
    <div className="flex max-w-form flex-col gap-10">
      <PageNav backHref={homeHref} backLabel={`Back to ${homeLabel.toLowerCase()}`} />
      <h1 className="text-h1">Settings</h1>
      <p className="font-mono text-sm text-muted">{user.email}</p>

      {provider ? (
        <BillingSection
          status={provider.stripe_subscription_status}
          trialEnd={provider.trial_end}
          currentPeriodEnd={provider.current_period_end}
          cancelAtPeriodEnd={Boolean(provider.cancel_at_period_end)}
          checkoutOk={params.checkout === "ok"}
        />
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-h2">Delete account</h2>
        <p>
          Deleting your account removes your profile, applications, jobs you posted, and stored
          files. This cannot be undone.
        </p>
        <form action={deleteAccount}>
          <Button type="submit" variant="secondary">
            Delete my account and data
          </Button>
        </form>
      </section>
    </div>
  )
}
