import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { Button } from "@/components/ui/button"
import { Table, Td, Th } from "@/components/ui/table"
import { resolveReport } from "./actions"
import { firstRelation } from "@/lib/relation"

export const metadata: Metadata = { title: "Admin reports" }

export default async function AdminReportsPage() {
  await requireAdmin()
  const db = createSupabaseServiceClient()
  const { data: reports } = await db
    .from("reports")
    .select("id, job_id, reason, resolved, jobs(title, status)")
    .eq("resolved", false)
    .order("created_at", { ascending: true })

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">Reports</h1>
      <Table>
        <thead>
          <tr>
            <Th>Job</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {(reports ?? []).map(function renderReport(report) {
            const job = firstRelation(
              report.jobs as { title: string; status: string }[] | { title: string; status: string } | null
            )
            return (
              <tr key={report.id}>
                <Td>{job?.title}</Td>
                <Td>{job?.status}</Td>
                <Td>
                  <div className="flex gap-2">
                    <form action={resolveReport}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="jobId" value={report.job_id} />
                      <input type="hidden" name="action" value="restore" />
                      <Button type="submit" variant="secondary">
                        Restore
                      </Button>
                    </form>
                    <form action={resolveReport}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="jobId" value={report.job_id} />
                      <input type="hidden" name="action" value="remove" />
                      <Button type="submit">Remove</Button>
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
