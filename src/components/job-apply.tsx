import Link from "next/link"
import { ButtonLink } from "@/components/ui/button"
import { IconExternal } from "@/components/ui/icons"
import { choosePath, getAccountKind, getApplicantProfile } from "@/lib/account"
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server"
import type { JobRecord } from "@/lib/types"
import { ApplyForm } from "@/app/jobs/[slug]/apply-form"

export async function JobApply({
  job,
  showForm = true,
}: {
  job: JobRecord
  showForm?: boolean
}) {
  const user = await getSessionUser()
  const supabase = user ? await createSupabaseServerClient() : null
  const kind = supabase ? await getAccountKind(supabase) : null
  const { isComplete } = supabase && kind !== "provider"
    ? await getApplicantProfile(supabase)
    : { isComplete: false }

  const listingHref = `/jobs/${job.slug}`
  const applyHref = user ? `${listingHref}#apply` : `/sign-in?next=${listingHref}`
  const profileHref = `/profile?next=${encodeURIComponent(listingHref)}`

  if (job.source === "imported") {
    return (
      <div className="flex flex-col items-start gap-3">
        <a
          href={job.source_url ?? "#"}
          target="_blank"
          rel="nofollow noopener"
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-night px-4 font-semibold text-paper hover:underline"
        >
          View original ad
          <IconExternal />
        </a>
        <p className="text-sm text-muted">
          Is this your job?{" "}
          <Link href={`/jobs/${job.slug}/claim`} className="underline">
            Claim it free.
          </Link>
        </p>
      </div>
    )
  }

  if (!user)
    return <ButtonLink href={applyHref}>Apply</ButtonLink>

  if (!kind)
    return <ButtonLink href={choosePath(listingHref)}>Apply or hire</ButtonLink>

  if (kind === "provider")
    return <p className="text-sm text-muted">This account is set up to hire.</p>

  if (!isComplete) {
    return (
      <div id="apply" className="flex flex-col items-start gap-3">
        <p>Finish your profile to apply. Name and postcode are required.</p>
        <ButtonLink href={profileHref}>Finish profile</ButtonLink>
      </div>
    )
  }

  if (!showForm)
    return <ButtonLink href={applyHref}>Apply</ButtonLink>

  return (
    <div id="apply">
      <ApplyForm jobId={job.id} jobSlug={job.slug} />
    </div>
  )
}
