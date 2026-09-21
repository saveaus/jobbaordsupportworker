"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveLocation } from "@/lib/location"
import { sendWelcomeApplicant } from "@/lib/email/templates"
import { ensureAccountKind } from "@/lib/account"

export interface ProfileState {
  error?: string
  saved?: boolean
  fieldErrors?: Record<string, string>
}

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your name."),
  email: z.email("Enter a valid email address."),
  postcode: z.string().regex(/^[0-9]{4}$/, "Enter a 4-digit postcode."),
  phone: z.string().trim().optional(),
  about: z.string().trim().max(500).optional(),
  cvPath: z.string().optional(),
  next: z.string().startsWith("/").catch("/profile"),
})

export async function saveProfile(
  _previous: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/profile")

  const kind = await ensureAccountKind(supabase, "applicant")
  if (kind === "provider") redirect("/dashboard")

  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    postcode: formData.get("postcode"),
    phone: formData.get("phone") || undefined,
    about: formData.get("about") || undefined,
    cvPath: formData.get("cvPath") || undefined,
    next: formData.get("next"),
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form"
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const location = await resolveLocation(supabase, parsed.data.postcode)
  const workTypes = formData.getAll("workTypes").map(String)
  const requirements = formData.getAll("requirements").map(String)

  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  const payload = {
    user_id: user.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    postcode: parsed.data.postcode,
    suburb: location?.suburb ?? null,
    state: location?.state ?? null,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    work_types: workTypes,
    requirements,
    about: parsed.data.about ?? null,
    cv_path: parsed.data.cvPath || null,
  }

  const { error } = await supabase.from("profiles").upsert(payload)
  if (error) return { error: "We couldn't save your profile. Try again in a minute." }

  if (!existing && user.email) await sendWelcomeApplicant(user.email)

  if (parsed.data.next !== "/profile") redirect(parsed.data.next)
  return { saved: true }
}
