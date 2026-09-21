"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { isValidAbn, normaliseAbn } from "@/lib/abn"
import { checkRateLimit } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { normaliseProviderName } from "@/lib/import/normalise"
import { ensureAccountKind } from "@/lib/account"

export interface RegisterState {
  error?: string
  fieldErrors?: Partial<Record<string, string>>
}

const registerSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name."),
  abn: z.string().refine(isValidAbn, "Enter a valid 11-digit ABN."),
  contactName: z.string().trim().min(2, "Enter a contact name."),
  email: z.email("Enter a valid email address."),
  phone: z.string().trim().min(8, "Enter a phone number."),
  isEmployer: z.literal("on", {
    error: "Confirm you are the employer for the jobs you post.",
  }),
  consent: z.literal("on", {
    error: "Agree to the privacy policy and terms to continue.",
  }),
})

export async function registerProvider(
  _previous: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/providers")

  const kind = await ensureAccountKind(supabase, "provider")
  if (kind === "applicant") redirect("/account")

  const parsed = registerSchema.safeParse({
    businessName: formData.get("businessName"),
    abn: String(formData.get("abn") ?? ""),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    isEmployer: formData.get("isEmployer"),
    consent: formData.get("consent"),
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form"
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const isHuman = await verifyTurnstile(
    formData.get("cf-turnstile-response")?.toString()
  )
  if (!isHuman)
    return { error: "We couldn't verify your browser. Reload the page and try again." }

  const allowed = await checkRateLimit({
    action: "provider-register",
    email: parsed.data.email,
    max: 5,
    windowSeconds: 3600,
  })
  if (!allowed) return { error: "Too many attempts. Try again in an hour." }

  const { error } = await supabase.from("providers").insert({
    owner_user_id: user.id,
    business_name: parsed.data.businessName,
    normalised_name: normaliseProviderName(parsed.data.businessName),
    abn: normaliseAbn(parsed.data.abn),
    contact_name: parsed.data.contactName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    is_employer_attested: true,
  })

  if (error) {
    if (error.code === "23505")
      return {
        error: error.message.includes("abn")
          ? "An account already exists for this ABN. One account per ABN."
          : "You already have a provider account.",
      }
    return { error: "We couldn't create the account. Try again in a minute." }
  }

  redirect("/billing/start")
}
