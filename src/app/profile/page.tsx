import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ProfileForm } from "./profile-form"
import type { ProfileRecord } from "@/lib/types"
import type { AppPageProps } from "@/lib/page-props"
import { requireApplicant } from "@/lib/account"
import { AccountNav } from "@/components/site/account-nav"

export const metadata: Metadata = { title: "Profile" }

export default async function ProfilePage({ searchParams }: AppPageProps) {
  const params = await searchParams
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/profile"

  const { supabase, user } = await requireApplicant(`/profile`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  const isApplyNext = next.startsWith("/jobs/")

  return (
    <div className="flex flex-col gap-8">
      <AccountNav kind="applicant" />
      <h1 className="text-h1">{profile ? "Profile" : "Set up your profile"}</h1>
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
    </div>
  )
}
