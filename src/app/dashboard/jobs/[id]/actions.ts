"use server"

import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function updateApplication(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const applicationId = String(formData.get("applicationId") ?? "")
  const jobId = String(formData.get("jobId") ?? "")
  const status = String(formData.get("status") ?? "")
  if (status !== "shortlisted" && status !== "not_suitable") redirect(`/dashboard/jobs/${jobId}`)

  await supabase
    .from("applications")
    .update({ status, viewed_at: new Date().toISOString() })
    .eq("id", applicationId)

  redirect(`/dashboard/jobs/${jobId}`)
}

export async function markFilled(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const jobId = String(formData.get("jobId") ?? "")
  await supabase.rpc("mark_job_filled", { p_job_id: jobId })
  redirect("/dashboard")
}

export async function renewJob(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const jobId = String(formData.get("jobId") ?? "")
  await supabase.rpc("renew_job", { p_job_id: jobId })
  redirect("/dashboard")
}
