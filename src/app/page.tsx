import type { Metadata } from "next"
import Link from "next/link"
import { siteConfig } from "@/config/site"
import { SearchBar } from "@/components/search-bar"
import { JobCard } from "@/components/job-card"
import { JobDetails } from "@/components/job-details"
import { JobApply } from "@/components/job-apply"
import { TeaserPanel } from "@/components/teaser-panel"
import { EmptyState } from "@/components/ui/empty-state"
import { ButtonLink } from "@/components/ui/button"
import { ViewBeacon } from "@/components/view-beacon"
import { SaveJobButton } from "@/components/save-job-button"
import { AU_STATES, ROLE_CATEGORIES, WORK_TYPES, type AuState, type RoleCategory, type WorkType } from "@/lib/constants"
import { getAccountKind } from "@/lib/account"
import { createSupabaseServerClient, getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server"
import { getLiveJob, searchJobs } from "@/lib/queries/jobs"
import { getSavedJobIds } from "@/lib/queries/saved-jobs"
import { getStoredLocation } from "@/lib/location"
import { parseSearchRadius, searchHref, type SearchQuery } from "@/lib/search-url"

export const metadata: Metadata = { title: siteConfig.tagline }

function isAuState(value: string): value is AuState {
  return (AU_STATES as readonly string[]).includes(value)
}
function isWorkType(value: string): value is WorkType {
  return value in WORK_TYPES
}
function isRoleCategory(value: string): value is RoleCategory {
  return value in ROLE_CATEGORIES
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams
  const keyword = typeof params.q === "string" ? params.q : ""
  const state = typeof params.state === "string" && isAuState(params.state) ? params.state : undefined
  const workType = typeof params.work === "string" && isWorkType(params.work) ? params.work : undefined
  const roleCategory =
    typeof params.category === "string" && isRoleCategory(params.category) ? params.category : undefined
  const radius = parseSearchRadius(typeof params.radius === "string" ? params.radius : undefined)
  const page = Math.max(1, Number(params.page ?? 1) || 1)
  const requestedSlug = typeof params.job === "string" ? params.job : ""

  const user = await getSessionUser()
  const location = await getStoredLocation()
  const limit = user ? 20 : 10
  const offset = user ? (page - 1) * limit : 0

  const filters: SearchQuery = {
    q: keyword || undefined,
    state,
    work: workType,
    category: roleCategory,
    radius,
    page,
  }

  let rows: Awaited<ReturnType<typeof searchJobs>>["rows"] = []
  let totalCount = 0
  let selected = null as Awaited<ReturnType<typeof getLiveJob>>
  let savedIds = new Set<string>()
  let canSave = !user
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient()
    const result = await searchJobs(supabase, {
      keyword: keyword || undefined,
      lat: location?.lat,
      lng: location?.lng,
      state,
      workType,
      roleCategory,
      radiusKm: location ? radius : undefined,
      limit,
      offset,
    })
    rows = result.rows
    totalCount = result.totalCount
    const selectedSlug = requestedSlug || rows[0]?.slug
    if (selectedSlug) selected = await getLiveJob(supabase, selectedSlug)
    if (user) {
      const kind = await getAccountKind(supabase)
      canSave = kind !== "provider"
      if (kind === "applicant") savedIds = await getSavedJobIds(supabase, user.id)
    }
  }

  const hasFilters = Boolean(keyword || state || workType || roleCategory || location)
  const locationLabel = location ? `${location.suburb} ${location.postcode}` : ""
  const selectedSlug = selected?.slug ?? ""
  const countLabel = location
    ? `${totalCount.toLocaleString("en-AU")} jobs within ${radius} km of ${locationLabel}`
    : `${totalCount.toLocaleString("en-AU")} jobs`

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1">Support work jobs</h1>
      <SearchBar
        keyword={keyword}
        locationLabel={locationLabel}
        state={state}
        workType={workType}
        roleCategory={roleCategory}
        radius={radius}
      />
      {!location ? (
        <p className="text-sm text-muted">Enter your suburb or postcode to see jobs near you.</p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          message="No jobs match. Try a wider area."
          action={
            hasFilters ? (
              <ButtonLink href="/" variant="secondary">
                Clear filters
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted">{countLabel}</p>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
            <div className="flex flex-col gap-3">
              <ul className="flex flex-col gap-3">
                {rows.map(function renderCard(job) {
                  const isSelected = job.slug === selectedSlug
                  const next = searchHref({ ...filters, job: job.slug })
                  return (
                    <li key={job.id}>
                      <JobCard
                        selected={isSelected}
                        job={{
                          href: isSelected
                            ? `/jobs/${job.slug}`
                            : `${next}#preview`,
                          title: job.title,
                          providerName: job.provider_name,
                          suburb: job.suburb,
                          state: job.state,
                          workType: WORK_TYPES[job.work_type],
                          payMin: job.pay_min,
                          payMax: job.pay_max,
                          payPeriod: job.pay_period,
                          postedAt: new Date(job.published_at),
                          sourceName: job.source === "imported" ? job.source_name : null,
                        }}
                        action={
                          canSave ? (
                            <SaveJobButton
                              jobId={job.id}
                              saved={savedIds.has(job.id)}
                              signedIn={Boolean(user)}
                              next={next}
                            />
                          ) : null
                        }
                      />
                    </li>
                  )
                })}
              </ul>
              {!user && totalCount > 10 ? <TeaserPanel totalCount={totalCount} /> : null}
              {user && totalCount > limit ? (
                <Pagination page={page} total={totalCount} limit={limit} filters={filters} />
              ) : null}
            </div>

            {selected ? (
              <aside
                id="preview"
                className="scroll-mt-4 rounded-sm border border-line p-6 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
              >
                <ViewBeacon jobId={selected.id} providerId={selected.provider_id} />
                <JobDetails
                  job={selected}
                  headingLevel="h2"
                  apply={
                    <div className="flex flex-wrap items-center gap-3">
                      <JobApply job={selected} showForm={false} />
                      {canSave ? (
                        <SaveJobButton
                          jobId={selected.id}
                          saved={savedIds.has(selected.id)}
                          signedIn={Boolean(user)}
                          next={searchHref({ ...filters, job: selected.slug })}
                        />
                      ) : null}
                    </div>
                  }
                />
              </aside>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

function Pagination({
  page,
  total,
  limit,
  filters,
}: {
  page: number
  total: number
  limit: number
  filters: SearchQuery
}) {
  const pages = Math.ceil(total / limit)
  return (
    <nav className="flex gap-6" aria-label="Pagination">
      {page > 1 ? (
        <Link href={searchHref({ ...filters, page: page - 1, job: undefined })} className="underline">
          Previous
        </Link>
      ) : null}
      <span className="text-sm text-muted tabular-nums">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={searchHref({ ...filters, page: page + 1, job: undefined })} className="underline">
          Next
        </Link>
      ) : null}
    </nav>
  )
}
