import Link from "next/link"
import { siteConfig } from "@/config/site"
import { createSupabaseServerClient, getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server"
import { getAccountKind } from "@/lib/account"
import { NavLink } from "./nav-link"

export async function SiteHeader() {
  const user = await getSessionUser()
  const kind =
    user && isSupabaseConfigured()
      ? await getAccountKind(await createSupabaseServerClient())
      : null

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-6 px-6 md:px-12">
        <Link href="/" className="shrink-0 text-base font-semibold">
          {siteConfig.name}
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1" aria-label="Primary">
          {user && kind === "applicant" ? (
            <>
              <NavLink href="/">Jobs</NavLink>
              <NavLink href="/applications">Applications</NavLink>
              <NavLink href="/account">Account</NavLink>
            </>
          ) : null}
          {user && kind === "provider" ? (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/account">Account</NavLink>
              <Link
                href="/jobs/new"
                className="inline-flex h-11 items-center rounded-sm border border-ink px-4 font-semibold hover:bg-panel"
              >
                Post a job
              </Link>
            </>
          ) : null}
          {user && kind !== "applicant" && kind !== "provider" ? (
            <Link href="/account" className="inline-flex min-h-11 items-center underline">
              Account
            </Link>
          ) : null}
          {!user ? (
            <>
              <Link href="/sign-in" className="inline-flex min-h-11 items-center underline">
                Sign in to apply
              </Link>
              <Link
                href="/providers"
                className="inline-flex h-11 items-center rounded-sm border border-ink px-4 font-semibold hover:bg-panel"
              >
                Post a job
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
