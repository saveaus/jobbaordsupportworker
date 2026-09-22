import {
  DEFAULT_SEARCH_RADIUS_KM,
  SEARCH_RADIUS_KM,
  type SearchRadiusKm,
} from "@/lib/constants"

export interface SearchQuery {
  q?: string
  state?: string
  work?: string
  category?: string
  radius?: SearchRadiusKm
  page?: number
  job?: string
}

export function parseSearchRadius(value: string | undefined): SearchRadiusKm {
  const km = Number(value)
  if ((SEARCH_RADIUS_KM as readonly number[]).includes(km))
    return km as SearchRadiusKm
  return DEFAULT_SEARCH_RADIUS_KM
}

export function searchHref(query: SearchQuery): string {
  const params = new URLSearchParams()
  if (query.q) params.set("q", query.q)
  if (query.state) params.set("state", query.state)
  if (query.work) params.set("work", query.work)
  if (query.category) params.set("category", query.category)
  if (query.radius && query.radius !== DEFAULT_SEARCH_RADIUS_KM)
    params.set("radius", String(query.radius))
  if (query.page && query.page > 1) params.set("page", String(query.page))
  if (query.job) params.set("job", query.job)
  const qs = params.toString()
  return qs ? `/?${qs}` : "/"
}
