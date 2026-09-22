import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import {
  choosePath,
  getAccountKind,
  getApplicantProfile,
} from "@/lib/account"
import { accountLinks } from "@/components/site/account-links"
import { PageNav } from "@/components/site/page-nav"
import { VerifiedScore } from "@/components/verified-score"
import { verificationPercent } from "@/lib/verification"

export const metadata: Metadata = { title: "My profile" }

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/account")

  const kind = await getAccountKind(supabase)
  if (!kind) redirect(choosePath("/account"))
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

  const homeHref = kind === "provider" ? "/dashboard" : "/"
  const homeLabel = kind === "provider" ? "Job posts" : "Jobs"

  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref={homeHref} backLabel={`Back to ${homeLabel.toLowerCase()}`} />
      <div className="flex flex-col gap-2">
        <h1 className="text-h1">My profile</h1>
        <p className="font-mono text-sm text-muted">{user.email}</p>
        {kind === "applicant" ? (
          <VerifiedScore percent={verificationPercent(checks ?? [])} />
        ) : null}
      </div>
      {kind === "applicant" && !isComplete ? (
        <p>
          Finish your profile to apply.{" "}
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
      <ul className="flex max-w-form flex-col border-t border-line">
        {accountLinks(kind).map(function renderLink(link) {
          return (
            <li key={link.href} className="border-b border-line">
              <Link href={link.href} className="flex min-h-11 items-center hover:underline">
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
      <form action="/auth/sign-out" method="post">
        <button type="submit" className="inline-flex min-h-11 items-center hover:underline">
          Sign out
        </button>
      </form>
    </div>
  )
}
