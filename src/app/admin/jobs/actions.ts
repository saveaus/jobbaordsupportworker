"use server"

import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { sendJobApproved } from "@/lib/email/templates"
import { siteConfig } from "@/config/site"

export async function approveJob(formData: FormData) {
  await requireAdmin()
  const jobId = String(formData.get("jobId") ?? "")
  const db = createSupabaseServiceClient()
  const now = new Date()
  const { data: job } = await db
    .from("jobs")
    .select("id, title, slug, provider_id")
    .eq("id", jobId)
    .single()
  await db
    .from("jobs")
    .update({
      status: "live",
      published_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
    })
    .eq("id", jobId)
  if (job) {
    await db.from("providers").update({ first_job_approved: true }).eq("id", job.provider_id)
    const { data: provider } = await db.from("providers").select("email").eq("id", job.provider_id).maybeSingle()
    if (provider?.email)
      await sendJobApproved(provider.email, job.title, `${siteConfig.url}/jobs/${job.slug}`)
  }
  redirect("/admin/jobs")
}

export async function removeJob(formData: FormData) {
  await requireAdmin()
  const db = createSupabaseServiceClient()
  await db.from("jobs").update({ status: "removed" }).eq("id", String(formData.get("jobId") ?? ""))
  redirect("/admin/jobs")
}
