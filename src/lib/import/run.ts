import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { buildImportKey, normaliseProviderName } from "./normalise"
import {
  decideImportAction,
  inferRoleCategory,
  nextMissingRuns,
  parseCsv,
  shouldExpireFromAbsences,
  type ExistingJob,
  type ImportRow,
} from "./csv"

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) +
    "-" +
    crypto.randomUUID().slice(0, 8)
  )
}

async function findOrCreateImportedProvider(name: string) {
  const db = createSupabaseServiceClient()
  const normalised = normaliseProviderName(name)
  const { data: existing } = await db
    .from("providers")
    .select("id")
    .eq("normalised_name", normalised)
    .maybeSingle()
  if (existing) return existing.id as string
  const { data, error } = await db
    .from("providers")
    .insert({ business_name: name, normalised_name: normalised })
    .select("id")
    .single()
  if (error) throw error
  return data.id as string
}

export async function runCsvImport(csvText: string, sourceName: string, filename: string) {
  const { rows, errors } = parseCsv(csvText)
  const db = createSupabaseServiceClient()

  const { data: blocked } = await db.from("blocked_provider_names").select("normalised_name")
  const blockedNames = new Set((blocked ?? []).map((b) => b.normalised_name as string))

  const { data: existingJobs } = await db
    .from("jobs")
    .select("id, source_url, import_key")
    .eq("source", "imported")

  const existingByUrl = new Map<string, ExistingJob>()
  const existingByKey = new Map<string, ExistingJob>()
  for (const job of (existingJobs ?? []) as ExistingJob[]) {
    if (job.source_url) existingByUrl.set(job.source_url, job)
    if (job.import_key) existingByKey.set(job.import_key, job)
  }

  let created = 0
  let updated = 0
  const seenIds = new Set<string>()

  for (const row of rows) {
    const decision = decideImportAction(row, existingByUrl, existingByKey, blockedNames)
    if (decision.action === "skip") continue

    const key = buildImportKey(row.title, row.provider, row.suburb)
    const providerId = await findOrCreateImportedProvider(row.provider)

    const { data: postcode } = await db
      .from("postcodes")
      .select("postcode,lat,lng")
      .eq("state", row.state)
      .ilike("suburb", row.suburb)
      .limit(1)
      .maybeSingle()

    const payload = {
      provider_id: providerId,
      provider_name: row.provider,
      title: row.title,
      role_category: inferRoleCategory(row.title),
      suburb: row.suburb,
      state: row.state,
      postcode: postcode?.postcode ?? "",
      lat: postcode?.lat ?? null,
      lng: postcode?.lng ?? null,
      work_type: row.workType,
      pay_min: row.payMin,
      pay_max: row.payMax,
      pay_period: row.payPeriod,
      description: "",
      status: "live",
      source: "imported",
      source_url: row.sourceUrl,
      source_name: sourceName,
      import_key: key,
      missing_import_runs: 0,
      published_at: row.postedAt.toISOString(),
      expires_at: new Date(row.postedAt.getTime() + 30 * 86_400_000).toISOString(),
    }

    if (decision.action === "update" && decision.existingId) {
      await db.from("jobs").update(payload).eq("id", decision.existingId)
      seenIds.add(decision.existingId)
      updated++
    } else {
      const { data, error } = await db
        .from("jobs")
        .insert({
          ...payload,
          slug: slugify(row.title),
        })
        .select("id, source_url, import_key")
        .single()
      if (error) throw error
      seenIds.add(data.id)
      existingByUrl.set(row.sourceUrl, data)
      existingByKey.set(key, data)
      created++
    }
  }

  let expired = 0
  for (const job of (existingJobs ?? []) as ExistingJob[]) {
    if (seenIds.has(job.id)) continue
    const { data: current } = await db
      .from("jobs")
      .select("missing_import_runs, status")
      .eq("id", job.id)
      .single()
    if (!current || current.status !== "live") continue
    const missing = nextMissingRuns(false, current.missing_import_runs as number)
    const nextStatus = shouldExpireFromAbsences(missing) ? "expired" : "live"
    await db
      .from("jobs")
      .update({
        missing_import_runs: missing,
        status: nextStatus,
      })
      .eq("id", job.id)
    if (nextStatus === "expired") expired++
  }

  await db.from("import_runs").insert({
    source_name: sourceName,
    filename,
    row_count: rows.length,
    created_count: created,
    updated_count: updated,
    expired_count: expired,
  })

  return { created, updated, expired, errors, rowCount: rows.length }
}

export type { ImportRow }
