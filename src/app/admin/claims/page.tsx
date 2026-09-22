import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { Button } from "@/components/ui/button"
import { Table, Td, Th } from "@/components/ui/table"
import { decideClaim } from "./actions"
import { firstRelation } from "@/lib/relation"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "Admin claims" }

export default async function AdminClaimsPage() {
  await requireAdmin()
  const db = createSupabaseServiceClient()
  const { data: claims } = await db
    .from("claims")
    .select("id, claimant_email, status, auto_approved, job_id, jobs(title)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref="/admin" backLabel="Back to admin" />
      <h1 className="text-h1">Claims</h1>
      <Table>
        <thead>
          <tr>
            <Th>Job</Th>
            <Th>Claimant</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {(claims ?? []).map(function renderClaim(claim) {
            const job = firstRelation(claim.jobs as { title: string }[] | { title: string } | null)
            return (
              <tr key={claim.id}>
                <Td>{job?.title}</Td>
                <Td>{claim.claimant_email}</Td>
                <Td>
                  <div className="flex gap-2">
                    <form action={decideClaim}>
                      <input type="hidden" name="claimId" value={claim.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <Button type="submit">Approve</Button>
                    </form>
                    <form action={decideClaim}>
                      <input type="hidden" name="claimId" value={claim.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <Button type="submit" variant="secondary">
                        Reject
                      </Button>
                    </form>
                  </div>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}
