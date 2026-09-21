import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { siteConfig } from "@/config/site"
import { ButtonLink } from "@/components/ui/button"
import { IconCheck, IconExternal } from "@/components/ui/icons"
import { REQUIREMENTS, WORK_TYPES } from "@/lib/constants"
import { formatLocation, formatPay, formatPostedDate } from "@/lib/format"
import { renderDescription } from "@/lib/markdown"
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server"
import { publicLogoUrl } from "@/lib/storage"
import type { JobRecord } from "@/lib/types"
import { ReportLink } from "./report-link"
import { ApplyForm } from "./apply-form"
import { ViewBeacon } from "@/components/view-beacon"
import type { AppPageProps } from "@/lib/page-props"
import { getAccountKind, getApplicantProfile } from "@/lib/account"

export async function generateMetadata({
  params,
}: AppPageProps): Promise<Metadata> {
  const { slug } = await params
  const job = await getLiveJob(slug)
  if (!job) return { title: "Job" }
  return {
    title: `${job.title} - ${job.provider_name}`,
    description: `${job.title} in ${formatLocation(job.suburb, job.state)}.`,
  }
}

async function getLiveJob(slug: string): Promise<JobRecord | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from("jobs").select("*").eq("slug", slug).eq("status", "live").maybeSingle()
  return (data as JobRecord | null) ?? null
}

export default async function JobPage({ params }: AppPageProps) {
  const { slug } = await params
  const job = await getLiveJob(slug)
  if (!job) notFound()

  const user = await getSessionUser()
  const supabase = user ? await createSupabaseServerClient() : null
  const kind = supabase ? await getAccountKind(supabase) : null
  const { isComplete } = supabase && kind !== "provider"
    ? await getApplicantProfile(supabase)
    : { isComplete: false }
  const pay = formatPay({
    payMin: job.pay_min,
    payMax: job.pay_max,
    payPeriod: job.pay_period,
  })
  const isImported = job.source === "imported"
  const applyHref = user ? `#apply` : `/sign-in?next=/jobs/${job.slug}`
  const profileHref = `/profile?next=${encodeURIComponent(`/jobs/${job.slug}`)}`

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
    <article className="flex flex-col gap-8">
      <ViewBeacon jobId={job.id} providerId={job.provider_id} />
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}

      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{job.title}</h1>
        <p>
          {job.provider_name} · {formatLocation(job.suburb, job.state)}
        </p>
        <p>
          {WORK_TYPES[job.work_type]}
          {pay ? ` · ${pay}` : ""}
        </p>
        <p className="text-sm text-muted">
          {job.published_at ? formatPostedDate(new Date(job.published_at)) : null}
          {isImported && job.source_name ? ` · via ${job.source_name}` : ""}
        </p>
      </header>

      {job.requirements.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-h2">Requirements</h2>
          <ul className="flex flex-col gap-2">
            {job.requirements.map(function renderRequirement(code) {
              return (
                <li key={code} className="flex items-center gap-2">
                  <IconCheck />
                  {REQUIREMENTS[code]}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {job.description ? (
        <section
          className="flex flex-col gap-4"
          dangerouslySetInnerHTML={{ __html: renderDescription(job.description) }}
        />
      ) : null}

      {isImported ? (
        <div className="flex flex-col items-start gap-4">
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
      ) : (
        <div className="sticky bottom-0 z-10 -mx-6 border-t border-line bg-paper px-6 py-4 md:static md:mx-0 md:border-0 md:px-0 md:py-0">
          {user ? (
            kind === "provider" ? (
              <p className="text-sm text-muted">
                This is a business account. Sign in as an applicant to apply.
              </p>
            ) : isComplete ? (
              <div id="apply">
                <ApplyForm jobId={job.id} jobSlug={job.slug} />
              </div>
            ) : (
              <div id="apply" className="flex flex-col items-start gap-4">
                <p>Finish your profile to apply. Name and postcode are required.</p>
                <ButtonLink href={profileHref}>Finish profile</ButtonLink>
              </div>
            )
          ) : (
            <ButtonLink href={applyHref}>Apply</ButtonLink>
          )}
        </div>
      )}

      <ReportLink jobId={job.id} />
    </article>
  )
}

export const dynamic = "force-dynamic"
