"use client"

import type { AccountKind } from "@/lib/account-kind"
import { NavLink } from "./nav-link"

const applicantLinks = [
  { href: "/profile", label: "Profile" },
  { href: "/applications", label: "Applications" },
  { href: "/alerts", label: "Alerts" },
  { href: "/settings", label: "Settings" },
]

const providerLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
]

export function AccountNav({ kind }: { kind: AccountKind }) {
  const links = kind === "provider" ? providerLinks : applicantLinks

  return (
    <nav
      aria-label={kind === "provider" ? "Business" : "Applicant"}
      className="flex flex-wrap gap-6 border-b border-line"
    >
      {links.map(function renderLink(link) {
        return (
          <NavLink key={link.href} href={link.href}>
            {link.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
