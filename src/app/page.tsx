import type { Metadata } from "next"
import Link from "next/link"
import { siteConfig } from "@/config/site"
import { SearchBar } from "@/components/search-bar"
import { JobRow } from "@/components/job-row"
import { TeaserPanel } from "@/components/teaser-panel"
import { EmptyState } from "@/components/ui/empty-state"
import { ButtonLink } from "@/components/ui/button"
import { AU_STATES, ROLE_CATEGORIES, WORK_TYPES, type AuState, type RoleCategory, type WorkType } from "@/lib/constants"
import { createSupabaseServerClient, getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server"
import { searchJobs } from "@/lib/queries/jobs"
import { getStoredLocation } from "@/lib/location"
import { publicLogoUrl } from "@/lib/storage"

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
  const page = Math.max(1, Number(params.page ?? 1) || 1)

  const user = await getSessionUser()
  const location = await getStoredLocation()
  const limit = user ? 20 : 10
  const offset = user ? (page - 1) * limit : 0

  let rows: Awaited<ReturnType<typeof searchJobs>>["rows"] = []
  let totalCount = 0
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient()
    const result = await searchJobs(supabase, {
      keyword: keyword || undefined,
      lat: location?.lat,
      lng: location?.lng,
      state,
      workType,
      roleCategory,
      limit,
      offset,
    })
    rows = result.rows
    totalCount = result.totalCount
  }

  const hasFilters = Boolean(keyword || state || workType || roleCategory)
  const locationLabel = location ? `${location.suburb} ${location.postcode}` : ""

  return (
    <div className="flex flex-col gap-8">
      <p>{siteConfig.tagline}</p>
      <SearchBar
        keyword={keyword}
        locationLabel={locationLabel}
        state={state}
        workType={workType}
        roleCategory={roleCategory}
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
        <div className="border-t border-line">
          {rows.map(function renderRow(job) {
            return (
              <JobRow
                key={job.id}
                job={{
                  href: `/jobs/${job.slug}`,
                  title: job.title,
                  providerName: job.provider_name,
                  suburb: job.suburb,
                  state: job.state,
                  workType: WORK_TYPES[job.work_type],
                  payMin: job.pay_min,
                  payMax: job.pay_max,
                  payPeriod: job.pay_period,
                  postedAt: new Date(job.published_at),
                  logoUrl: publicLogoUrl(job.provider_logo_path),
                  sourceName: job.source === "imported" ? job.source_name : null,
                }}
              />
            )
          })}
        </div>
      )}

      {!user && totalCount > 10 ? <TeaserPanel totalCount={totalCount} /> : null}

      {user && totalCount > limit ? (
        <Pagination page={page} total={totalCount} limit={limit} />
      ) : null}
    </div>
  )
}

function Pagination({ page, total, limit }: { page: number; total: number; limit: number }) {
  const pages = Math.ceil(total / limit)
  return (
    <nav className="flex gap-6" aria-label="Pagination">
      {page > 1 ? (
        <Link href={`/?page=${page - 1}`} className="underline">
          Previous
        </Link>
      ) : null}
      <span className="text-sm text-muted tabular-nums">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={`/?page=${page + 1}`} className="underline">
          Next
        </Link>
      ) : null}
    </nav>
  )
}

