"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isCurrent =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href as never}
      aria-current={isCurrent ? "page" : undefined}
      className={`inline-flex min-h-11 items-center ${isCurrent ? "font-semibold" : "underline"}`}
    >
      {children}
    </Link>
  )
}
