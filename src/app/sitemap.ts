import type { MetadataRoute } from "next"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { siteConfig } from "@/config/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: new Date() },
    { url: `${siteConfig.url}/privacy`, lastModified: new Date() },
    { url: `${siteConfig.url}/terms`, lastModified: new Date() },
    { url: `${siteConfig.url}/contact`, lastModified: new Date() },
  ]

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return staticEntries

  try {
    const db = createSupabaseServiceClient()
    const { data: jobs } = await db
      .from("jobs")
      .select("slug, updated_at")
      .eq("status", "live")
      .limit(5000)

    const jobEntries = (jobs ?? []).map((job) => ({
      url: `${siteConfig.url}/jobs/${job.slug}`,
      lastModified: new Date(job.updated_at),
    }))
    return [...staticEntries, ...jobEntries]
  } catch {
    return staticEntries
  }
}
