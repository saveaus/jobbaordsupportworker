"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getAccountKind } from "@/lib/account"
import { choosePath, safeNext, signInPath } from "@/lib/account-kind"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function toggleSavedJob(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "")
  const next = safeNext(String(formData.get("next") ?? "/"))
  if (!JOB_ID.test(jobId)) redirect(next)

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(signInPath(next))

  const kind = await getAccountKind(supabase)
  if (!kind) redirect(choosePath(next))
  if (kind === "provider") redirect("/dashboard")

  const { data: existing } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle()

  if (existing) {
    await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId)
  } else {
    await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: jobId })
  }

  revalidatePath("/")
  revalidatePath("/saved")
  revalidatePath("/jobs", "layout")
  redirect(next)
}
