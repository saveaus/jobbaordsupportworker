"use client"

import Link from "next/link"
import { IconChevronDown } from "@/components/ui/icons"
import type { AccountLink } from "./account-links"

export function AccountMenu({
  name,
  links,
}: {
  name: string
  links: AccountLink[]
}) {
  return (
    <details className="group relative">
      <summary
        className="flex min-h-11 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden"
        aria-label={`${name} menu`}
      >
        <span className="max-w-36 truncate md:max-w-52">{name}</span>
        <IconChevronDown className="group-open:rotate-180" />
      </summary>
      <div
        className="absolute right-0 z-20 mt-1 min-w-52 border border-line bg-paper"
        role="menu"
        aria-label="Account"
      >
        <ul>
          {links.map(function renderLink(link) {
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  role="menuitem"
                  className="flex min-h-11 items-center px-4 hover:bg-panel"
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
          <li className="border-t border-line">
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex min-h-11 w-full items-center px-4 text-left hover:bg-panel"
              >
                Sign out
              </button>
            </form>
          </li>
        </ul>
      </div>
    </details>
  )
}
