"use server"

import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveLocation } from "@/lib/location"

export interface AlertState {
  error?: string
  saved?: boolean
}

export async function saveAlert(_previous: AlertState, formData: FormData): Promise<AlertState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/alerts")

  const postcode = String(formData.get("postcode") ?? "").trim()
  const radius = Number(formData.get("radius") ?? 50)
  const frequency = String(formData.get("frequency") ?? "daily")
  const workTypes = formData.getAll("workTypes").map(String)
  if (!/^[0-9]{4}$/.test(postcode)) return { error: "Enter a 4-digit postcode." }

  const location = await resolveLocation(supabase, postcode)
  const { error } = await supabase.from("job_alerts").insert({
    user_id: user.id,
    postcode,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    radius_km: radius,
    work_types: workTypes,
    frequency,
  })
  if (error) return { error: "We couldn't save the alert. Try again in a minute." }
  return { saved: true }
}
