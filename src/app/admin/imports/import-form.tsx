"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { runImport, type ImportState } from "./actions"

export function ImportForm() {
  const [state, formAction, isPending] = useActionState<ImportState, FormData>(runImport, {})
  return (
    <form action={formAction} className="flex w-full max-w-form flex-col gap-6">
      <FormError message={state.error} />
      <Field label="Source name" htmlFor="sourceName" help="Shown as via {source} on listings.">
        <Input id="sourceName" name="sourceName" required defaultValue="Adzuna" />
      </Field>
      <Field label="CSV file" htmlFor="file">
        <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Importing" : "Import CSV"}
      </Button>
    </form>
  )
}
