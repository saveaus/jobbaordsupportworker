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
                className="inline-flex h-11 items-center rounded-sm border border-night px-4 font-semibold hover:bg-slate-20"
              >
                Post a job
              </Link>
            </>
          ) : null}
          {user && !kind ? (
            <Link href="/get-started" className="inline-flex min-h-11 items-center underline">
              Apply or hire
            </Link>
          ) : null}
          {!user ? (
            <>
              <Link href="/sign-in" className="inline-flex min-h-11 items-center underline">
                Sign in
              </Link>
              <Link href="/providers" className="inline-flex min-h-11 items-center underline">
                Post a job
              </Link>
              <Link
                href="/create-account"
                className="inline-flex h-11 items-center rounded-sm bg-night px-4 font-semibold text-paper hover:bg-night-50"
              >
                Create account
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
