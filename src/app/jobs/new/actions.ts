"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface JobFormState {
  error?: string
  fieldErrors?: Record<string, string>
}

const schema = z.object({
  title: z.string().trim().min(4, "Enter a job title."),
  roleCategory: z.string(),
  suburb: z.string().trim().min(2, "Enter a suburb."),
  state: z.string(),
  postcode: z.string().regex(/^[0-9]{4}$/, "Enter a 4-digit postcode."),
  workType: z.string(),
  payMin: z.string().optional(),
  payMax: z.string().optional(),
  payPeriod: z.enum(["hour", "year"]).optional(),
  description: z.string().trim().min(20, "Enter a description."),
  positions: z.string().optional(),
})

export async function createJobAction(
  _previous: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/jobs/new")

  const parsed = schema.safeParse({
    title: formData.get("title"),
    roleCategory: formData.get("roleCategory"),
    suburb: formData.get("suburb"),
    state: formData.get("state"),
    postcode: formData.get("postcode"),
    workType: formData.get("workType"),
    payMin: formData.get("payMin") || undefined,
    payMax: formData.get("payMax") || undefined,
    payPeriod: formData.get("payPeriod") || undefined,
    description: formData.get("description"),
    positions: formData.get("positions") || undefined,
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form"
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const requirements = formData.getAll("requirements").map(String)
  const payMin = parsed.data.payMin ? Number(parsed.data.payMin) : null
  const payMax = parsed.data.payMax ? Number(parsed.data.payMax) : null

  const { data, error } = await supabase.rpc("create_job", {
    p_title: parsed.data.title,
    p_role_category: parsed.data.roleCategory,
    p_suburb: parsed.data.suburb,
    p_state: parsed.data.state,
    p_postcode: parsed.data.postcode,
    p_work_type: parsed.data.workType,
    p_pay_min: payMin,
    p_pay_max: payMax,
    p_pay_period: payMin || payMax ? parsed.data.payPeriod ?? "hour" : null,
    p_requirements: requirements,
    p_description: parsed.data.description,
    p_positions: Number(parsed.data.positions ?? 1),
  })
  if (error) return { error: friendlyJobError(error.message) }

  const job = data as { slug?: string } | null
  redirect(job?.slug ? `/jobs/${job.slug}` : "/dashboard")
}

function friendlyJobError(message: string): string {
  if (message.includes("subscription")) return "A current trial or paid plan is required to post."
  if (message.includes("suspended")) return "This account is suspended."
  if (message.includes("attestation")) return "Employer confirmation is required."
  if (message.includes("no provider")) return "Create a provider account first."
  return "We couldn't publish the job. Try again in a minute."
}
