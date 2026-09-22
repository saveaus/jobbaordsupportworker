export type AccountKind = "applicant" | "provider"

const PROVIDER_PREFIXES = ["/providers", "/dashboard", "/billing", "/jobs/new"]

export function parseAccountKind(value: string | null | undefined): AccountKind {
  return value === "provider" ? "provider" : "applicant"
}

export function safeNext(value: string | null | undefined, fallback = "/") {
  const next = String(value ?? "").trim()
  if (!next.startsWith("/") || next.startsWith("//")) return fallback
  return next
}

export function withNext(path: string, next = "/") {
  const safe = safeNext(next)
  if (safe === "/" || safe === path || safe.startsWith(`${path}?`)) return path
  return `${path}?next=${encodeURIComponent(safe)}`
}

export function signInPath(next = "/") {
  return withNext("/sign-in", next)
}

export function createAccountPath(next = "/") {
  return withNext("/create-account", next)
}

export function choosePath(next = "/") {
  const safe = safeNext(next)
  const params = new URLSearchParams()
  const path = safe.split("?")[0]
  if (path !== "/" && path !== "/get-started" && path !== "/create-account" && path !== "/sign-in")
    params.set("next", safe)
  if (accountKindFromNext(safe) === "provider")
    params.set("intent", "hire")
  const query = params.toString()
  return query ? `/get-started?${query}` : "/get-started"
}

export function accountKindFromNext(next: string): AccountKind {
  const path = next.split("?")[0]
  if (PROVIDER_PREFIXES.some(function isProviderPath(prefix) {
    return path === prefix || path.startsWith(`${prefix}/`)
  }))
    return "provider"
  return "applicant"
}

export function isCompleteApplicantProfile(
  profile: { full_name: string | null; postcode: string | null } | null
) {
  if (!profile) return false
  return Boolean(profile.full_name?.trim() && profile.postcode)
}
