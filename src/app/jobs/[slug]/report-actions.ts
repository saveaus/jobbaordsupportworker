"use server"

import { redirect } from "next/navigation"
import { checkRateLimit } from "@/lib/rate-limit"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

export interface ReportState {
  error?: string
  sent?: boolean
}

export async function reportJob(_previous: ReportState, formData: FormData): Promise<ReportState> {
  const jobId = String(formData.get("jobId") ?? "")
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/jobs`)

  const allowed = await checkRateLimit({
    action: "report",
    email: user.email ?? undefined,
    max: 10,
    windowSeconds: 3600,
  })
  if (!allowed) return { error: "Too many reports. Try again later." }

  const { error } = await supabase.from("reports").insert({
    job_id: jobId,
    reporter_user_id: user.id,
  })
  if (error) {
    if (error.code === "23505") return { error: "You have already reported this job." }
    return { error: "We couldn't send the report. Try again in a minute." }
  }

  const service = createSupabaseServiceClient()
  const { count } = await service
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("resolved", false)
  if ((count ?? 0) >= 3) {
    await service.from("jobs").update({ status: "hidden" }).eq("id", jobId).eq("status", "live")
  }

  return { sent: true }
}
