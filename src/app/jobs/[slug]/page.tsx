import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { WORK_TYPES } from "@/lib/constants"
import { formatLocation } from "@/lib/format"
import { getAccountKind } from "@/lib/account"
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server"
import { getLiveJob } from "@/lib/queries/jobs"
import { getSavedJobIds } from "@/lib/queries/saved-jobs"
import { publicLogoUrl } from "@/lib/storage"
import { JobDetails } from "@/components/job-details"
import { JobApply } from "@/components/job-apply"
import { SaveJobButton } from "@/components/save-job-button"
import { ViewBeacon } from "@/components/view-beacon"
import { PageNav } from "@/components/site/page-nav"
import { ReportLink } from "./report-link"
import type { AppPageProps } from "@/lib/page-props"

export async function generateMetadata({
  params,
}: AppPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const job = await getLiveJob(supabase, slug)
  if (!job) return { title: "Job" }
  return {
    title: `${job.title} - ${job.provider_name}`,
    description: `${job.title} in ${formatLocation(job.suburb, job.state)}.`,
  }
}

export default async function JobPage({ params }: AppPageProps) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const job = await getLiveJob(supabase, slug)
  if (!job) notFound()

  const user = await getSessionUser()
  const kind = user ? await getAccountKind(supabase) : null
  const canSave = kind !== "provider"
  const saved =
    user && kind === "applicant" ? (await getSavedJobIds(supabase, user.id)).has(job.id) : false
  const isImported = job.source === "imported"
  const jsonLd =
    !isImported && job.published_at
      ? {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: job.title,
          description: job.description,
          datePosted: job.published_at,
          validThrough: job.expires_at,
          employmentType: WORK_TYPES[job.work_type],
          hiringOrganization: {
            "@type": "Organization",
            name: job.provider_name,
            logo: publicLogoUrl(job.provider_logo_path) ?? undefined,
          },
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.suburb,
              addressRegion: job.state,
              postalCode: job.postcode,
              addressCountry: "AU",
            },
          },
        }
      : null

  return (
    <article className="flex max-w-prose flex-col gap-8">
      <ViewBeacon jobId={job.id} providerId={job.provider_id} />
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
      <PageNav backHref="/" backLabel="Back to jobs" />
      <JobDetails
        job={job}
        headingLevel="h1"
        apply={
          <div className="flex flex-wrap items-center gap-3">
            <JobApply job={job} />
            {canSave ? (
              <SaveJobButton
                jobId={job.id}
                saved={saved}
                signedIn={Boolean(user)}
                next={`/jobs/${job.slug}`}
              />
            ) : null}
          </div>
        }
      />
      <ReportLink jobId={job.id} />
    </article>
  )
}

export const dynamic = "force-dynamic"
