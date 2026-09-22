import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import {
  ensureAccountKind,
  getApplicantProfile,
} from "@/lib/account"
import { AccountNav } from "@/components/site/account-nav"
import { VerifiedScore } from "@/components/verified-score"
import { verificationPercent } from "@/lib/verification"

export const metadata: Metadata = { title: "Account" }

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/account")

  const kind = await ensureAccountKind(supabase, "applicant")
  const provider = kind === "provider" ? await getProviderForUser(supabase) : null
  const { isComplete } = kind === "applicant"
    ? await getApplicantProfile(supabase)
    : { isComplete: true }
  const { data: checks } = kind === "applicant"
    ? await supabase
        .from("requirement_checks")
        .select("status")
        .eq("user_id", user.id)
    : { data: [] }

  return (
    <div className="flex flex-col gap-8">
      <AccountNav kind={kind} />
      <h1 className="text-h1">Account</h1>
      <p className="font-mono text-sm text-muted">{user.email}</p>
      {kind === "applicant" ? (
        <VerifiedScore percent={verificationPercent(checks ?? [])} />
      ) : null}
      {kind === "applicant" && !isComplete ? (
        <p>
          Finish your profile to apply. Providers only see it after you apply.{" "}
          <Link href="/profile" className="underline">
            Open profile
          </Link>
          .
        </p>
      ) : null}
      {kind === "provider" && !provider ? (
        <p>
          Finish business sign-up to post jobs.{" "}
          <Link href="/providers/register" className="underline">
            Continue
          </Link>
          .
        </p>
      ) : null}
      <form action="/auth/sign-out" method="post">
        <button type="submit" className="inline-flex min-h-11 items-center underline">
          Sign out
        </button>
      </form>
    </div>
  )
}
