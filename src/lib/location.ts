import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AuState } from "@/lib/constants"

export const LOCATION_COOKIE = "location"

export interface StoredLocation {
  postcode: string
  suburb: string
  state: AuState
  lat: number
  lng: number
}

export async function getStoredLocation(): Promise<StoredLocation | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(LOCATION_COOKIE)?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredLocation
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number") return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Resolve free text ("6163" or "Hamilton Hill") against the postcode
 * dataset. Postcodes match exactly; suburbs match case-insensitively
 * with exact-name matches first.
 */
export async function resolveLocation(
  supabase: SupabaseClient,
  text: string
): Promise<StoredLocation | null> {
  const query = text.trim()
  if (!query) return null

  if (/^[0-9]{4}$/.test(query)) {
    const { data } = await supabase
      .from("postcodes")
      .select("postcode,suburb,state,lat,lng")
      .eq("postcode", query)
      .limit(1)
      .maybeSingle()
    return (data as StoredLocation | null) ?? null
  }

  const { data: exact } = await supabase
    .from("postcodes")
    .select("postcode,suburb,state,lat,lng")
    .ilike("suburb", query)
    .limit(1)
    .maybeSingle()
  if (exact) return exact as StoredLocation

  const { data: partial } = await supabase
    .from("postcodes")
    .select("postcode,suburb,state,lat,lng")
    .ilike("suburb", `${query}%`)
    .limit(1)
    .maybeSingle()
  return (partial as StoredLocation | null) ?? null
}
