import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { Button } from "@/components/ui/button"
import { Field, FormError, FormSuccess } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, Td, Th } from "@/components/ui/table"
import { ImportForm } from "./import-form"
import { addBlock } from "./actions"
import type { AppPageProps } from "@/lib/page-props"

export const metadata: Metadata = { title: "Admin imports" }

export default async function AdminImportsPage({ searchParams }: AppPageProps) {
  await requireAdmin()
  const params = await searchParams
  const db = createSupabaseServiceClient()
  const { data: runs } = await db
    .from("import_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)
  const { data: blocked } = await db
    .from("blocked_provider_names")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">CSV import</h1>
      <p className="max-w-prose text-sm text-muted">
        Columns: title, provider, suburb, state, work type, pay, posted date, source URL.
      </p>
      {params.ok === "1" ? (
        <FormSuccess message="Import finished. Check the run log below." />
      ) : null}
      <ImportForm />

      <h2 className="text-h2">Recent runs</h2>
      <Table>
        <thead>
          <tr>
            <Th>Source</Th>
            <Th numeric>Rows</Th>
            <Th numeric>Created</Th>
            <Th numeric>Updated</Th>
            <Th numeric>Expired</Th>
          </tr>
        </thead>
        <tbody>
          {(runs ?? []).map(function renderRun(run) {
            return (
              <tr key={run.id}>
                <Td>{run.source_name}</Td>
                <Td numeric>{run.row_count}</Td>
                <Td numeric>{run.created_count}</Td>
                <Td numeric>{run.updated_count}</Td>
                <Td numeric>{run.expired_count}</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>

      <h2 className="text-h2">Block list</h2>
      <form action={addBlock} className="flex max-w-form flex-col gap-4">
        <Field label="Provider name to block" htmlFor="name">
          <Input id="name" name="name" required />
        </Field>
        <Button type="submit" variant="secondary">
          Block from future imports
        </Button>
      </form>
      <ul className="flex flex-col border-t border-line">
        {(blocked ?? []).map(function renderBlock(row) {
          return (
            <li key={row.id} className="border-b border-line py-3">
              {row.normalised_name}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
