import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { Button } from "@/components/ui/button"
import { Table, Td, Th } from "@/components/ui/table"
import { approveJob, removeJob } from "./actions"

export const metadata: Metadata = { title: "Admin jobs" }

export default async function AdminJobsPage() {
  await requireAdmin()
  const db = createSupabaseServiceClient()
  const { data: pending } = await db
    .from("jobs")
    .select("id, title, provider_name, status, created_at")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true })
  const { data: hidden } = await db
    .from("jobs")
    .select("id, title, provider_name, status")
    .eq("status", "hidden")
    .limit(50)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">Jobs</h1>
      <h2 className="text-h2">Pending approval</h2>
      <Table>
        <thead>
          <tr>
            <Th>Job</Th>
            <Th>Provider</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {(pending ?? []).map(function renderJob(job) {
            return (
              <tr key={job.id}>
                <Td>{job.title}</Td>
                <Td>{job.provider_name}</Td>
                <Td>
                  <form action={approveJob}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <Button type="submit">Approve</Button>
                  </form>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      <h2 className="text-h2">Hidden</h2>
      <Table>
        <thead>
          <tr>
            <Th>Job</Th>
            <Th>Provider</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {(hidden ?? []).map(function renderHidden(job) {
            return (
              <tr key={job.id}>
                <Td>{job.title}</Td>
                <Td>{job.provider_name}</Td>
                <Td>
                  <form action={removeJob}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <Button type="submit" variant="secondary">
                      Remove
                    </Button>
                  </form>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}
