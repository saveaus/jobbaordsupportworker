"use server"

import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

export async function resolveReport(formData: FormData) {
  await requireAdmin()
  const db = createSupabaseServiceClient()
  const reportId = String(formData.get("reportId") ?? "")
  const jobId = String(formData.get("jobId") ?? "")
  const action = String(formData.get("action") ?? "")
  await db.from("reports").update({ resolved: true }).eq("id", reportId)
  if (action === "remove") await db.from("jobs").update({ status: "removed" }).eq("id", jobId)
  if (action === "restore") await db.from("jobs").update({ status: "live" }).eq("id", jobId).eq("status", "hidden")
  redirect("/admin/reports")
}
