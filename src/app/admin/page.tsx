import type { Metadata } from "next"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "Admin" }

export default async function AdminPage() {
  await requireAdmin()
  const db = createSupabaseServiceClient()

  const [jobsLive, applicants, applications, trials, paid] = await Promise.all([
    db.from("jobs").select("*", { count: "exact", head: true }).eq("status", "live"),
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("applications").select("*", { count: "exact", head: true }),
    db.from("providers").select("*", { count: "exact", head: true }).eq("stripe_subscription_status", "trialing"),
    db.from("providers").select("*", { count: "exact", head: true }).eq("stripe_subscription_status", "active"),
  ])

  const links = [
    { href: "/admin/jobs", label: "First jobs and listings" },
    { href: "/admin/claims", label: "Claims" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/imports", label: "CSV import and block list" },
    { href: "/admin/providers", label: "Providers" },
    { href: "/admin/verifications", label: "Requirement checks" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <h1 className="text-h1">Admin</h1>
      <dl className="grid max-w-form grid-cols-2 gap-4 tabular-nums">
        <div>
          <dt className="text-sm text-muted">Jobs live</dt>
          <dd className="font-semibold">{jobsLive.count ?? 0}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Applicants</dt>
          <dd className="font-semibold">{applicants.count ?? 0}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Applications</dt>
          <dd className="font-semibold">{applications.count ?? 0}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Trials</dt>
          <dd className="font-semibold">{trials.count ?? 0}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Paid</dt>
          <dd className="font-semibold">{paid.count ?? 0}</dd>
        </div>
      </dl>
      <ul className="flex flex-col">
        {links.map(function renderLink(link) {
          return (
            <li key={link.href} className="border-b border-line">
              <Link href={link.href as never} className="flex min-h-11 items-center py-3 underline">
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
