import type { Metadata } from "next"
import { ProfileForm } from "./profile-form"
import { RequirementChecks } from "./requirement-checks"
import { VerifiedScore } from "@/components/verified-score"
import type { ProfileRecord } from "@/lib/types"
import type { AppPageProps } from "@/lib/page-props"
import { requireApplicant } from "@/lib/account"
import type { RequirementCheck } from "@/lib/verification"
import { verificationPercent } from "@/lib/verification"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "Profile" }

export default async function ProfilePage({ searchParams }: AppPageProps) {
  const params = await searchParams
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/profile"

  const { supabase, user } = await requireApplicant(`/profile`)

  const [{ data: profile }, { data: checks }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("requirement_checks")
      .select("requirement, status, evidence_path, review_note")
      .eq("user_id", user.id),
  ])

  const isApplyNext = next.startsWith("/jobs/")
  const percent = verificationPercent(checks ?? [])

  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <div className="flex flex-col gap-2">
        <h1 className="text-h1">{profile ? "Profile" : "Set up your profile"}</h1>
        <VerifiedScore percent={percent} />
      </div>
      <p className="max-w-prose">
        {isApplyNext
          ? "Name, email and postcode are required before you can apply. Providers only see this after you apply."
          : "Name, email and postcode are required. Providers only see this after you apply."}
      </p>
      <ProfileForm
        email={user.email ?? ""}
        profile={(profile as ProfileRecord | null) ?? null}
        next={next}
      />
      <RequirementChecks checks={(checks ?? []) as RequirementCheck[]} />
    </div>
  )
}
