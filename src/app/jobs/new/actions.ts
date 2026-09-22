"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { redirectToCheckout } from "@/app/billing/actions"
import { encodeJobDescription } from "@/lib/job-copy"
import { getProviderForUser } from "@/lib/queries/provider"
import { firstRelation } from "@/lib/relation"
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
  description: z.string().trim().min(20, "Say what the work is."),
})

export async function createJobAction(
  _previous: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/jobs/new/write")

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers/register")

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
  const shifts = formData.getAll("shifts").map(String)
  const payMin = parsed.data.payMin ? Number(parsed.data.payMin) : null
  const payMax = parsed.data.payMax ? Number(parsed.data.payMax) : null
  if (payMin != null && Number.isNaN(payMin))
    return { fieldErrors: { payMin: "Enter a number." } }
  if (payMax != null && Number.isNaN(payMax))
    return { fieldErrors: { payMax: "Enter a number." } }
  if (payMin != null && payMax != null && payMax < payMin)
    return { fieldErrors: { payMax: "To must be at least From." } }

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
    p_description: encodeJobDescription(parsed.data.description, shifts),
    p_positions: 1,
  })
  if (error) return { error: friendlyJobError(error.message) }

  const job = firstRelation(
    data as
      | { id?: string; slug?: string; status?: string }
      | { id?: string; slug?: string; status?: string }[]
      | null
  )
  if (job?.status === "draft" && job.id) {
    if (provider.stripe_subscription_status === "past_due")
      redirect("/billing/portal")
    await redirectToCheckout({
      userEmail: user.email,
      provider,
      jobId: job.id,
      interval: "month",
      returnPath: `/dashboard/jobs/${job.id}`,
    })
  }
  if (job?.status === "live" && job.slug)
    redirect(`/jobs/${job.slug}`)
  redirect("/dashboard")
}

function friendlyJobError(message: string): string {
  if (message.includes("subscription")) return "A current trial or paid plan is required to publish."
  if (message.includes("suspended")) return "This account is suspended."
  if (message.includes("attestation")) return "Employer confirmation is required."
  if (message.includes("no provider")) return "Create a provider account first."
  return "We couldn't save the job. Try again in a minute."
}
