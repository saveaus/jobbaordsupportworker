import type { SupabaseClient } from "@supabase/supabase-js"
import type { AuState, RoleCategory, WorkType } from "@/lib/constants"
import type { JobRecord } from "@/lib/types"

export interface JobSearchFilters {
  keyword?: string
  lat?: number
  lng?: number
  state?: AuState
  workType?: WorkType
  roleCategory?: RoleCategory
  limit: number
  offset: number
}

export interface JobSearchRow {
  id: string
  slug: string
  title: string
  provider_name: string
  provider_logo_path: string | null
  suburb: string
  state: AuState
  work_type: WorkType
  pay_min: number | null
  pay_max: number | null
  pay_period: "hour" | "year" | null
  source: "posted" | "imported"
  source_name: string | null
  published_at: string
  distance_km: number | null
  total_count: number
}

export interface JobSearchResult {
  rows: JobSearchRow[]
  totalCount: number
}

/**
 * Calls the search_jobs RPC. The database enforces the signed-out cap
 * of 10 rows and blocks signed-out pagination regardless of the values
 * passed here.
 */
export async function searchJobs(
  supabase: SupabaseClient,
  filters: JobSearchFilters
): Promise<JobSearchResult> {
  try {
    const { data, error } = await supabase.rpc("search_jobs", {
      p_keyword: filters.keyword ?? null,
      p_lat: filters.lat ?? null,
      p_lng: filters.lng ?? null,
      p_state: filters.state ?? null,
      p_work_type: filters.workType ?? null,
      p_role_category: filters.roleCategory ?? null,
      p_limit: filters.limit,
      p_offset: filters.offset,
    })
    if (error) {
      console.error("search_jobs failed", error.message, error.code, error.details)
      return { rows: [], totalCount: 0 }
    }
    const rows = (data ?? []) as JobSearchRow[]
    return { rows, totalCount: Number(rows[0]?.total_count ?? 0) }
  } catch (error) {
    console.error("search_jobs threw", error)
    return { rows: [], totalCount: 0 }
  }
}

export async function getLiveJob(
  supabase: SupabaseClient,
  slug: string
): Promise<JobRecord | null> {
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle()
  return (data as JobRecord | null) ?? null
}
