import { siteConfig } from "@/config/site"
import { supabaseUrl } from "@/lib/supabase/config"

export function publicLogoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const base = supabaseUrl()
  if (!base) return null
  return `${base}/storage/v1/object/public/logos/${path}`
}

export function canonicalUrl(path: string): string {
  return new URL(path, siteConfig.url).toString()
}
