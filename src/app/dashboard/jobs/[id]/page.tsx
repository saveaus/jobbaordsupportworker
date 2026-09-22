import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { IconCheck } from "@/components/ui/icons"
import { REQUIREMENTS } from "@/lib/constants"
import { formatLocation } from "@/lib/format"
import { verificationPercent } from "@/lib/verification"
import { VerifiedScore } from "@/components/verified-score"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { updateApplication, markFilled, renewJob } from "./actions"
import type { AppPageProps } from "@/lib/page-props"
import { AccountNav } from "@/components/site/account-nav"
import Link from "next/link"

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Applicants" }
}

export default async function JobApplicantsPage({ params }: AppPageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/providers")

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers")

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("provider_id", provider.id)
    .maybeSingle()
  if (!job) notFound()

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, message, created_at, applicant_user_id, access_expires_at")
    .eq("job_id", id)
    .order("created_at", { ascending: false })

  await supabase
    .from("applications")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("job_id", id)
    .eq("status", "sent")

  const applicantIds = (applications ?? []).map((a) => a.applicant_user_id)
  const { data: profiles } = applicantIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, postcode, requirements, cv_path")
        .in("user_id", applicantIds)
    : { data: [] }
  const { data: checks } = applicantIds.length
    ? await supabase
        .from("requirement_checks")
        .select("user_id, requirement, status")
        .in("user_id", applicantIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]))
  const checksByUser = new Map<string, { status: string; requirement: string }[]>()
  for (const check of checks ?? []) {
    const list = checksByUser.get(check.user_id) ?? []
    list.push(check)
    checksByUser.set(check.user_id, list)
  }

  const readOnly = job.status === "unpublished" || job.status === "expired"

  return (
    <div className="flex flex-col gap-8">
      <AccountNav kind="provider" />
      <p>
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>
      </p>
      <div className="flex flex-col gap-2">
        <h1 className="text-h1">{job.title}</h1>
        <p className="text-sm text-muted">
          {formatLocation(job.suburb, job.state)} · {job.status}
        </p>
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap gap-4">
          {job.status === "live" ? (
            <form action={markFilled}>
              <input type="hidden" name="jobId" value={job.id} />
              <Button type="submit" variant="secondary">
                Mark filled
              </Button>
            </form>
          ) : null}
          {job.status === "live" || job.status === "expired" ? (
            <form action={renewJob}>
              <input type="hidden" name="jobId" value={job.id} />
              <Button type="submit" variant="secondary">
                Renew for 30 days
              </Button>
            </form>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">This job is read only.</p>
      )}

      {(applications ?? []).length === 0 ? (
        <EmptyState message="No applicants yet. We'll email you when someone applies." />
      ) : (
        <ul className="flex flex-col border-t border-line">
          {(applications ?? []).map(function renderApp(app) {
            const profile = profileMap.get(app.applicant_user_id)
            const applicantChecks = checksByUser.get(app.applicant_user_id) ?? []
            const verifiedCodes = new Set(
              applicantChecks
                .filter((check) => check.status === "verified")
                .map((check) => check.requirement)
            )
            const matches = (job.requirements as string[]).filter((req) =>
              verifiedCodes.has(req)
            )
            return (
              <li key={app.id} className="flex flex-col gap-3 border-b border-line py-5">
                <p className="font-semibold">{profile?.full_name ?? "Applicant"}</p>
                <p className="text-sm text-muted">
                  {profile?.postcode} · {app.status}
                </p>
                <VerifiedScore percent={verificationPercent(applicantChecks)} />
                {matches.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {matches.map(function renderMatch(code) {
                      return (
                        <li key={code} className="flex items-center gap-2 text-sm">
                          <IconCheck />
                          {REQUIREMENTS[code as keyof typeof REQUIREMENTS]}
                          <span className="font-mono text-sm text-night-25">Verified</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
                {app.message ? <p className="max-w-prose">{app.message}</p> : null}
                {profile?.cv_path ? (
                  <a
                    href={`/api/jobs/${job.id}/cv/${app.applicant_user_id}`}
                    className="underline"
                  >
                    Download CV
                  </a>
                ) : (
                  <p className="text-sm text-muted">No CV uploaded</p>
                )}
                {!readOnly ? (
                  <div className="flex gap-4">
                    <form action={updateApplication}>
                      <input type="hidden" name="applicationId" value={app.id} />
                      <input type="hidden" name="jobId" value={job.id} />
                      <input type="hidden" name="status" value="shortlisted" />
                      <Button type="submit" variant="secondary">
                        Shortlisted
                      </Button>
                    </form>
                    <form action={updateApplication}>
                      <input type="hidden" name="applicationId" value={app.id} />
                      <input type="hidden" name="jobId" value={job.id} />
                      <input type="hidden" name="status" value="not_suitable" />
                      <Button type="submit" variant="secondary">
                        Not suitable
                      </Button>
                    </form>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
