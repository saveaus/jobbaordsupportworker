import type { Metadata } from "next"
import Link from "next/link"
import { EmptyState } from "@/components/ui/empty-state"
import { ButtonLink } from "@/components/ui/button"
import { APPLICATION_STATUS_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/format"
import { firstRelation } from "@/lib/relation"
import { requireApplicant } from "@/lib/account"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "My applications" }

export default async function ApplicationsPage() {
  const { supabase, user } = await requireApplicant("/applications")

  const { data } = await supabase
    .from("applications")
    .select("id, status, created_at, jobs(title, slug, provider_name)")
    .eq("applicant_user_id", user.id)
    .order("created_at", { ascending: false })

  const rows = data ?? []

  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <h1 className="text-h1">My applications</h1>
      {rows.length === 0 ? (
        <EmptyState
          message="You have not applied for a job yet."
          action={<ButtonLink href="/">See jobs</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col border-t border-line">
          {rows.map(function renderApp(app) {
            const job = firstRelation(
              app.jobs as
                | { title: string; slug: string; provider_name: string }[]
                | { title: string; slug: string; provider_name: string }
                | null
            )
            const status = app.status === "viewed" || app.status === "shortlisted" || app.status === "not_suitable"
              ? "Viewed"
              : APPLICATION_STATUS_LABELS.sent
            return (
              <li key={app.id} className="border-b border-line py-5">
                {job ? (
                  <Link href={`/jobs/${job.slug}`} className="font-semibold underline">
                    {job.title}
                  </Link>
                ) : (
                  <span>Job removed</span>
                )}
                <p className="text-sm text-muted">
                  {job?.provider_name} · {formatDate(new Date(app.created_at))} · {status}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
