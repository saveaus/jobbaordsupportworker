import type { AccountKind } from "@/lib/account-kind"

export interface AccountLink {
  href: string
  label: string
}

export const APPLICANT_LINKS: AccountLink[] = [
  { href: "/profile", label: "My profile" },
  { href: "/applications", label: "Applications" },
  { href: "/saved", label: "Saved jobs" },
  { href: "/alerts", label: "Alerts" },
  { href: "/settings", label: "Settings" },
]

export const PROVIDER_LINKS: AccountLink[] = [
  { href: "/dashboard", label: "Job posts" },
  { href: "/account", label: "My profile" },
  { href: "/settings", label: "Settings" },
]

export function accountLinks(kind: AccountKind) {
  return kind === "provider" ? PROVIDER_LINKS : APPLICANT_LINKS
}
