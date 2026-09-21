"use server"

import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { runCsvImport } from "@/lib/import/run"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { normaliseProviderName } from "@/lib/import/normalise"

export interface ImportState {
  error?: string
}

export async function runImport(_previous: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin()
  const sourceName = String(formData.get("sourceName") ?? "").trim()
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file." }
  if (!sourceName) return { error: "Enter a source name." }
  const text = await file.text()
  const result = await runCsvImport(text, sourceName, file.name)
  if (result.errors.length && result.rowCount === 0)
    return { error: result.errors[0] }
  redirect("/admin/imports?ok=1")
}

export async function addBlock(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") ?? "").trim()
  if (!name) redirect("/admin/imports")
  const db = createSupabaseServiceClient()
  await db.from("blocked_provider_names").upsert({
    normalised_name: normaliseProviderName(name),
    reason: "removal on request",
  })
  redirect("/admin/imports")
}
