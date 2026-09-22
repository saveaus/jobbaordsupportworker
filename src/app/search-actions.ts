"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { LOCATION_COOKIE, resolveLocation } from "@/lib/location"
import { parseSearchRadius, searchHref } from "@/lib/search-url"

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
  const radius = parseSearchRadius(String(formData.get("radius") ?? ""))

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

  redirect(searchHref({
    q: keyword || undefined,
    state: state || undefined,
    work: workType || undefined,
    category: roleCategory || undefined,
    radius,
  }))
}
