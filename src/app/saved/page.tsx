import type { Metadata } from "next"
import { EmptyState } from "@/components/ui/empty-state"
import { ButtonLink } from "@/components/ui/button"
import { JobCard } from "@/components/job-card"
import { SaveJobButton } from "@/components/save-job-button"
import { PageNav } from "@/components/site/page-nav"
import { WORK_TYPES } from "@/lib/constants"
import { requireApplicant } from "@/lib/account"
import { firstRelation } from "@/lib/relation"

export const metadata: Metadata = { title: "Saved jobs" }

interface SavedJob {
  title: string
  slug: string
  provider_name: string
  suburb: string
  state: string
  work_type: keyof typeof WORK_TYPES
  pay_min: number | null
  pay_max: number | null
  pay_period: "hour" | "year" | null
  published_at: string | null
  source: string
  source_name: string | null
}

export default async function SavedJobsPage() {
  const { supabase, user } = await requireApplicant("/saved")

  const { data } = await supabase
    .from("saved_jobs")
    .select(
      "job_id, created_at, jobs(title, slug, provider_name, suburb, state, work_type, pay_min, pay_max, pay_period, published_at, source, source_name)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const rows = (data ?? []).flatMap(function toCard(row) {
    const job = firstRelation(row.jobs as SavedJob[] | SavedJob | null)
    if (!job || !job.published_at) return []
    return [
      {
        id: row.job_id as string,
        job,
      },
    ]
  })

  return (
    <div className="flex max-w-form flex-col gap-6">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <h1 className="text-h1">Saved jobs</h1>
      {rows.length === 0 ? (
        <EmptyState
          message="You have not saved a job yet."
          action={<ButtonLink href="/">See jobs</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(function renderSaved(row) {
            return (
              <li key={row.id}>
                <JobCard
                  job={{
                    href: `/jobs/${row.job.slug}`,
                    title: row.job.title,
                    providerName: row.job.provider_name,
                    suburb: row.job.suburb,
                    state: row.job.state,
                    workType: WORK_TYPES[row.job.work_type],
                    payMin: row.job.pay_min,
                    payMax: row.job.pay_max,
                    payPeriod: row.job.pay_period,
                    postedAt: new Date(row.job.published_at as string),
                    sourceName: row.job.source === "imported" ? row.job.source_name : null,
                  }}
                  action={
                    <SaveJobButton jobId={row.id} saved signedIn next="/saved" />
                  }
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
