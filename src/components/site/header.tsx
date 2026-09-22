import Link from "next/link"
import { Suspense } from "react"
import { siteConfig } from "@/config/site"
import { createSupabaseServerClient, getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server"
import { getAccountKind, getApplicantProfile } from "@/lib/account"
import { getProviderForUser } from "@/lib/queries/provider"
import { accountLinks } from "./account-links"
import { AccountMenu } from "./account-menu"
import { NavLink } from "./nav-link"

export async function SiteHeader() {
  const user = await getSessionUser()
  const supabase =
    user && isSupabaseConfigured() ? await createSupabaseServerClient() : null
  const kind = supabase ? await getAccountKind(supabase) : null
  const name = supabase && kind ? await navName(supabase, kind) : "Account"

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex min-h-16 w-full max-w-page items-center justify-between gap-4 px-6 md:px-12">
        <div className="flex min-w-0 items-center gap-6 md:gap-8">
          <Link href="/" className="shrink-0 text-base font-semibold">
            {siteConfig.name}
          </Link>
          <nav className="flex items-center gap-5" aria-label="Primary">
            <NavLink href="/">Jobs</NavLink>
            {user && !kind ? (
              <NavLink href="/get-started">Apply or hire</NavLink>
            ) : null}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-4 md:gap-5">
          {!user ? (
            <nav className="flex items-center text-sm md:text-base" aria-label="Account">
              <Link
                href="/sign-in"
                className="inline-flex min-h-11 items-center px-2 hover:underline md:px-3"
              >
                Sign in
              </Link>
              <span className="h-4 w-px bg-line" aria-hidden />
              <Link
                href="/jobs/new"
                className="inline-flex min-h-11 items-center px-2 hover:underline md:px-3"
              >
                Employers<span className="max-sm:hidden">/Post Job</span>
              </Link>
            </nav>
          ) : null}
          {user && kind ? (
            <Suspense fallback={<span className="inline-flex min-h-11 items-center">{name}</span>}>
              <AccountMenu name={name} links={accountLinks(kind)} />
            </Suspense>
          ) : null}
          {user && kind === "provider" ? (
            <Link
              href="/jobs/new"
              className="inline-flex h-11 items-center rounded-sm bg-night px-4 font-semibold text-paper hover:bg-night-50"
            >
              Post a job
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}

async function navName(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  kind: "applicant" | "provider"
) {
  if (kind === "applicant") {
    const { profile } = await getApplicantProfile(supabase)
    const fullName = profile?.full_name?.trim()
    if (fullName) return fullName
  }
  if (kind === "provider") {
    const provider = await getProviderForUser(supabase)
    const business = provider?.business_name?.trim()
    if (business) return business
    const contact = provider?.contact_name?.trim()
    if (contact) return contact
  }
  return "Account"
}
