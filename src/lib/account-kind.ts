export type AccountKind = "applicant" | "provider"

const PROVIDER_PREFIXES = ["/providers", "/dashboard", "/billing", "/jobs/new"]

export function parseAccountKind(value: string | null | undefined): AccountKind {
  return value === "provider" ? "provider" : "applicant"
}

export function signInPath(kind: AccountKind) {
  return kind === "provider" ? "/providers" : "/sign-in"
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
