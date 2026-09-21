"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { LOCATION_COOKIE, resolveLocation } from "@/lib/location"

/**
 * Search submit: remembers the location (cookie, one year) and
 * redirects to the job list with the other filters in the URL.
 */
export async function applySearch(formData: FormData) {
  const keyword = String(formData.get("q") ?? "").trim()
  const locationText = String(formData.get("location") ?? "").trim()
  const state = String(formData.get("state") ?? "")
  const workType = String(formData.get("work") ?? "")
  const roleCategory = String(formData.get("category") ?? "")

  const cookieStore = await cookies()
  if (locationText) {
    const supabase = await createSupabaseServerClient()
    const resolved = await resolveLocation(supabase, locationText)
    if (resolved) {
      cookieStore.set(LOCATION_COOKIE, JSON.stringify(resolved), {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        path: "/",
      })
    }
  } else {
    cookieStore.delete(LOCATION_COOKIE)
  }

  const params = new URLSearchParams()
  if (keyword) params.set("q", keyword)
  if (state) params.set("state", state)
  if (workType) params.set("work", workType)
  if (roleCategory) params.set("category", roleCategory)
  const query = params.toString()
  redirect(query ? `/?${query}` : "/")
}
