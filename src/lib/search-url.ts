export interface SearchQuery {
  q?: string
  state?: string
  work?: string
  category?: string
  page?: number
  job?: string
}

export function searchHref(query: SearchQuery): string {
  const params = new URLSearchParams()
  if (query.q) params.set("q", query.q)
  if (query.state) params.set("state", query.state)
  if (query.work) params.set("work", query.work)
  if (query.category) params.set("category", query.category)
  if (query.page && query.page > 1) params.set("page", String(query.page))
  if (query.job) params.set("job", query.job)
  const qs = params.toString()
  return qs ? `/?${qs}` : "/"
}
