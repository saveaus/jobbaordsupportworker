import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ButtonLink } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, Td, Th } from "@/components/ui/table"
import { JOB_STATUS_LABELS } from "@/lib/constants"
import { formatApplicantCount, formatDaysLeft } from "@/lib/format"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { getAccountKind } from "@/lib/account"
import { PageNav } from "@/components/site/page-nav"
import { PayToPublish } from "./pay-to-publish"

export const metadata: Metadata = { title: "Job posts" }

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/dashboard")

  const kind = await getAccountKind(supabase)
  if (!kind) redirect("/get-started?next=/dashboard&intent=hire")
  if (kind === "applicant") redirect("/account")

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers/register")

  const isPastDue = provider.stripe_subscription_status === "past_due"

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, slug, title, status, expires_at, source")
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })

  const jobIds = (jobs ?? []).map((j) => j.id)
  const applicantCounts = new Map<string, number>()
  const viewCounts = new Map<string, number>()

  if (jobIds.length) {
    const { data: apps } = await supabase.from("applications").select("job_id").in("job_id", jobIds)
    for (const app of apps ?? []) {
      applicantCounts.set(app.job_id, (applicantCounts.get(app.job_id) ?? 0) + 1)
    }
    const { data: views } = await supabase
      .from("job_view_days")
      .select("job_id, views")
      .in("job_id", jobIds)
    for (const row of views ?? []) {
      viewCounts.set(row.job_id, (viewCounts.get(row.job_id) ?? 0) + (row.views as number))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">Job posts</h1>
        <ButtonLink href="/jobs/new">Post a job</ButtonLink>
      </div>
      {isPastDue ? (
        <p className="text-error">
          Payment failed.{" "}
          <Link href="/settings" className="underline">
            Update your card
          </Link>{" "}
          to keep jobs live.
        </p>
      ) : null}

      {(jobs ?? []).length === 0 ? (
        <EmptyState
          message="You haven't posted a job yet."
          action={<ButtonLink href="/jobs/new">Post a job</ButtonLink>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Job</Th>
              <Th>Status</Th>
              <Th numeric>Views</Th>
              <Th numeric>Applicants</Th>
              <Th numeric>Days left</Th>
            </tr>
          </thead>
          <tbody>
            {(jobs ?? []).map(function renderJob(job) {
              const applicants = applicantCounts.get(job.id) ?? 0
              const readOnly = job.status === "unpublished" || job.status === "expired"
              return (
                <tr key={job.id}>
                  <Td>
                    <Link href={`/dashboard/jobs/${job.id}`} className="underline">
                      {job.title}
                    </Link>
                    {readOnly ? <span className="text-sm text-muted"> (read only)</span> : null}
                  </Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <span>
                        {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS] ?? job.status}
                      </span>
                      {job.status === "draft" ? <PayToPublish jobId={job.id} compact /> : null}
                    </div>
                  </Td>
                  <Td numeric>{viewCounts.get(job.id) ?? 0}</Td>
                  <Td numeric className="font-semibold">
                    {formatApplicantCount(applicants).replace(" applicants", "").replace(" applicant", "")}
                  </Td>
                  <Td numeric>
                    {job.expires_at ? formatDaysLeft(new Date(job.expires_at)) : "—"}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </div>
  )
}
