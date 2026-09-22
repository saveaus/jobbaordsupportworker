import type { Metadata } from "next"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { Button } from "@/components/ui/button"
import { REQUIREMENTS, type RequirementCode } from "@/lib/constants"
import { reviewRequirement } from "./actions"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "Requirement checks" }

export default async function AdminVerificationsPage() {
  await requireAdmin()
  const db = createSupabaseServiceClient()
  const { data: pending } = await db
    .from("requirement_checks")
    .select("user_id, requirement, evidence_path, submitted_at, applicant_note")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true })

  const userIds = [...new Set((pending ?? []).map((row) => row.user_id))]
  const { data: profiles } = userIds.length
    ? await db.from("profiles").select("user_id, full_name, email").in("user_id", userIds)
    : { data: [] }
  const names = new Map((profiles ?? []).map((row) => [row.user_id, row]))

  const rows = await Promise.all(
    (pending ?? []).map(async function withUrl(row) {
      let evidenceUrl: string | null = null
      if (row.evidence_path) {
        const { data } = await db.storage
          .from("requirement-evidence")
          .createSignedUrl(row.evidence_path, 300)
        evidenceUrl = data?.signedUrl ?? null
      }
      return { ...row, evidenceUrl }
    })
  )

  return (
    <div className="flex flex-col gap-8">
      <p>
        <Link href="/admin" className="underline">
          Admin
        </Link>
      </p>
      <PageNav backHref="/admin" backLabel="Back to admin" />
      <h1 className="text-h1">Requirement checks</h1>
      {rows.length === 0 ? (
        <p className="text-muted">No checks waiting.</p>
      ) : (
        <ul className="flex flex-col border-t border-line">
          {rows.map(function renderRow(row) {
            const profile = names.get(row.user_id)
            return (
              <li
                key={`${row.user_id}-${row.requirement}`}
                className="flex flex-col gap-3 border-b border-line py-5"
              >
                <p className="font-semibold">{profile?.full_name ?? row.user_id}</p>
                <p className="font-mono text-sm text-night-25">
                  {REQUIREMENTS[row.requirement as RequirementCode]} · {profile?.email}
                </p>
                {row.evidenceUrl ? (
                  <a href={row.evidenceUrl} className="underline" target="_blank" rel="noreferrer">
                    Open evidence
                  </a>
                ) : (
                  <p className="text-sm text-muted">No file</p>
                )}
                <form action={reviewRequirement} className="flex flex-col gap-3">
                  <input type="hidden" name="userId" value={row.user_id} />
                  <input type="hidden" name="requirement" value={row.requirement} />
                  <label className="flex flex-col gap-2">
                    <span>Review note</span>
                    <input
                      name="reviewNote"
                      className="min-h-11 border border-line bg-paper px-3"
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" name="decision" value="verified">
                      Verify
                    </Button>
                    <Button
                      type="submit"
                      name="decision"
                      value="rejected"
                      variant="secondary"
                    >
                      Reject
                    </Button>
                  </div>
                </form>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
