import { ROLE_CATEGORIES, WORK_TYPES, type AuState, type RoleCategory, type WorkType } from "@/lib/constants"
import { buildImportKey, normaliseProviderName } from "./normalise"

export interface ImportRow {
  title: string
  provider: string
  suburb: string
  state: AuState
  workType: WorkType
  payMin: number | null
  payMax: number | null
  payPeriod: "hour" | "year" | null
  postedAt: Date
  sourceUrl: string
}

export interface ImportDecision {
  action: "create" | "update" | "skip"
  existingId?: string
  reason?: string
}

export interface ExistingJob {
  id: string
  source_url: string | null
  import_key: string | null
}

/**
 * Dedupe: match first on source URL, then on normalised
 * title + provider + suburb. Re-importing updates, never duplicates.
 */
export function decideImportAction(
  row: ImportRow,
  existingByUrl: Map<string, ExistingJob>,
  existingByKey: Map<string, ExistingJob>,
  blockedNames: Set<string>
): ImportDecision {
  const normalised = normaliseProviderName(row.provider)
  if (blockedNames.has(normalised))
    return { action: "skip", reason: "blocked" }

  const urlMatch = existingByUrl.get(row.sourceUrl)
  if (urlMatch) return { action: "update", existingId: urlMatch.id }

  const key = buildImportKey(row.title, row.provider, row.suburb)
  const keyMatch = existingByKey.get(key)
  if (keyMatch) return { action: "update", existingId: keyMatch.id }

  return { action: "create" }
}

/** After two consecutive imports without the job, it expires. */
export function nextMissingRuns(wasPresent: boolean, previous: number): number {
  return wasPresent ? 0 : previous + 1
}

export function shouldExpireFromAbsences(missingRuns: number): boolean {
  return missingRuns >= 2
}

const WORK_TYPE_ALIASES: Record<string, WorkType> = {
  casual: "casual",
  "part time": "part_time",
  "part-time": "part_time",
  part_time: "part_time",
  "full time": "full_time",
  "full-time": "full_time",
  full_time: "full_time",
  contract: "contract",
}

export function parseWorkType(raw: string): WorkType | null {
  return WORK_TYPE_ALIASES[raw.trim().toLowerCase()] ?? null
}

const STATE_SET = new Set(Object.values(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]))

export function parseState(raw: string): AuState | null {
  const value = raw.trim().toUpperCase()
  return STATE_SET.has(value) ? (value as AuState) : null
}

/** "$35-$42 per hour", "35-42", "$80,000 per year", empty. */
export function parsePay(raw: string): {
  payMin: number | null
  payMax: number | null
  payPeriod: "hour" | "year" | null
} {
  const text = raw.trim()
  if (!text) return { payMin: null, payMax: null, payPeriod: null }
  const period = /year/i.test(text) ? "year" : "hour"
  const numbers = [...text.replace(/,/g, "").matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
  if (numbers.length === 0) return { payMin: null, payMax: null, payPeriod: null }
  if (numbers.length === 1) return { payMin: numbers[0], payMax: numbers[0], payPeriod: period }
  return { payMin: numbers[0], payMax: numbers[1], payPeriod: period }
}

export function parsePostedDate(raw: string): Date {
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed
  return new Date()
}

export function inferRoleCategory(title: string): RoleCategory {
  const t = title.toLowerCase()
  if (t.includes("aged")) return "aged_care"
  if (t.includes("home care") || t.includes("home-care")) return "home_care"
  if (t.includes("mental")) return "mental_health_support"
  if (t.includes("sil") || t.includes("independent living")) return "sil"
  if (t.includes("disability") || t.includes("support worker")) return "disability_support"
  return "other"
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else inQuotes = !inQuotes
      continue
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim())
      current = ""
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

const HEADER = ["title", "provider", "suburb", "state", "work type", "pay", "posted date", "source url"]

export function parseCsv(text: string): { rows: ImportRow[]; errors: string[] } {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n")
  const errors: string[] = []
  const rows: ImportRow[] = []
  if (lines.length === 0) return { rows, errors: ["The file is empty."] }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  for (const col of HEADER) {
    if (index(col) === -1) errors.push(`Missing column: ${col}`)
  }
  if (errors.length) return { rows, errors }

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cells = splitCsvLine(lines[i])
    const title = cells[index("title")] ?? ""
    const provider = cells[index("provider")] ?? ""
    const suburb = cells[index("suburb")] ?? ""
    const state = parseState(cells[index("state")] ?? "")
    const workType = parseWorkType(cells[index("work type")] ?? "")
    const sourceUrl = cells[index("source url")] ?? ""
    if (!title || !provider || !suburb || !state || !workType || !sourceUrl) {
      errors.push(`Row ${i + 1}: missing required fields.`)
      continue
    }
    const pay = parsePay(cells[index("pay")] ?? "")
    rows.push({
      title,
      provider,
      suburb,
      state,
      workType,
      ...pay,
      postedAt: parsePostedDate(cells[index("posted date")] ?? ""),
      sourceUrl,
    })
  }
  return { rows, errors }
}

export { ROLE_CATEGORIES, WORK_TYPES }
