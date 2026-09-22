import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ButtonLink } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { getAccountKind } from "@/lib/account"
import { choosePath, createAccountPath, signInPath } from "@/lib/account-kind"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "Hire support workers" }

export default async function ProvidersPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const kind = await getAccountKind(supabase)
    if (!kind) redirect(choosePath("/providers/register"))
    if (kind === "applicant") {
      return (
        <div className="flex max-w-prose flex-col gap-8">
          <PageNav backHref="/account" backLabel="Back to your account" />
          <h1 className="text-h1">Hire support workers</h1>
          <p>
            This account is set up to apply. Post jobs from a hiring account.
          </p>
        </div>
      )
    }
    const provider = await getProviderForUser(supabase)
    redirect(provider ? "/dashboard" : "/providers/register")
  }

  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <h1 className="text-h1">Hire support workers</h1>
      <div className="flex max-w-prose flex-col gap-4">
        <p>
          Post unlimited support work jobs and receive applications with profiles
          and CVs attached.
        </p>
        <p>
          $249 a month plus GST, or $2,490 a year plus GST. The first 14 days are
          free; a card is required to start and you can cancel anytime.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <ButtonLink href={createAccountPath("/providers/register")}>
          Create account
        </ButtonLink>
        <ButtonLink href={signInPath("/providers/register")} variant="secondary">
          Sign in
        </ButtonLink>
      </div>
    </div>
  )
}
