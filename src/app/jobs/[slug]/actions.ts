"use server"

import { redirect } from "next/navigation"
import { siteConfig } from "@/config/site"
import { checkRateLimit } from "@/lib/rate-limit"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { sendApplicationSent, sendNewApplicant } from "@/lib/email/templates"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { choosePath, getAccountKind } from "@/lib/account"

export interface ApplyState {
  error?: string
  sent?: boolean
}

export async function applyToJob(_previous: ApplyState, formData: FormData): Promise<ApplyState> {
  const jobId = String(formData.get("jobId") ?? "")
  const jobSlug = String(formData.get("jobSlug") ?? "")
  const message = String(formData.get("message") ?? "").trim().slice(0, 500)

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/jobs/${jobSlug}`)

  const kind = await getAccountKind(supabase)
  if (!kind) redirect(choosePath(`/jobs/${jobSlug}`))
  if (kind === "provider")
    return { error: "This account is set up to hire." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, postcode")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!profile?.full_name || !profile.postcode)
    redirect(`/profile?next=/jobs/${jobSlug}`)

  const allowed = await checkRateLimit({
    action: "apply",
    email: user.email ?? undefined,
    max: 20,
    windowSeconds: 3600,
  })
  if (!allowed) return { error: "Too many applications. Try again in an hour." }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, slug, source, status, provider_id")
    .eq("id", jobId)
    .maybeSingle()
  if (!job || job.status !== "live" || job.source !== "posted")
    return { error: "This job is not open for applications." }

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    applicant_user_id: user.id,
    message: message || null,
  })
  if (error) {
    if (error.code === "23505") return { error: "You have already applied for this job." }
    return { error: "We couldn't send the application. Try again in a minute." }
  }

  const jobUrl = `${siteConfig.url}/jobs/${job.slug}`
  if (user.email) await sendApplicationSent(user.email, job.title, jobUrl)

  const service = createSupabaseServiceClient()
  const { data: provider } = await service
    .from("providers")
    .select("email")
    .eq("id", job.provider_id)
    .maybeSingle()
  if (provider?.email)
    await sendNewApplicant(
      provider.email,
      job.title,
      `${siteConfig.url}/dashboard/jobs/${job.id}`
    )

  return { sent: true }
}
