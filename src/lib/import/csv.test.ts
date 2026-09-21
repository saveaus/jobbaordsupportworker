import { describe, expect, it } from "vitest"
import {
  decideImportAction,
  nextMissingRuns,
  parseCsv,
  parsePay,
  parseWorkType,
  shouldExpireFromAbsences,
  type ExistingJob,
  type ImportRow,
} from "@/lib/import/csv"
import { buildImportKey } from "@/lib/import/normalise"

const sampleRow: ImportRow = {
  title: "Disability support worker - casual, SIL",
  provider: "Banksia Community Care Pty Ltd",
  suburb: "Hamilton Hill",
  state: "WA",
  workType: "casual",
  payMin: 35,
  payMax: 42,
  payPeriod: "hour",
  postedAt: new Date("2026-09-01"),
  sourceUrl: "https://example.com/ad/1",
}

function maps(jobs: ExistingJob[]) {
  const byUrl = new Map<string, ExistingJob>()
  const byKey = new Map<string, ExistingJob>()
  for (const job of jobs) {
    if (job.source_url) byUrl.set(job.source_url, job)
    if (job.import_key) byKey.set(job.import_key, job)
  }
  return { byUrl, byKey }
}

describe("CSV import dedupe", () => {
  it("creates a new job when nothing matches", () => {
    const { byUrl, byKey } = maps([])
    expect(decideImportAction(sampleRow, byUrl, byKey, new Set()).action).toBe("create")
  })

  it("updates on the same source URL instead of duplicating", () => {
    const existing: ExistingJob = {
      id: "job-1",
      source_url: sampleRow.sourceUrl,
      import_key: buildImportKey(sampleRow.title, sampleRow.provider, sampleRow.suburb),
    }
    const { byUrl, byKey } = maps([existing])
    const first = decideImportAction(sampleRow, byUrl, byKey, new Set())
    const second = decideImportAction({ ...sampleRow, title: "Updated title" }, byUrl, byKey, new Set())
    expect(first).toEqual({ action: "update", existingId: "job-1" })
    expect(second).toEqual({ action: "update", existingId: "job-1" })
  })

  it("updates on normalised title + provider + suburb when URL is new", () => {
    const existing: ExistingJob = {
      id: "job-2",
      source_url: "https://old.example/ad",
      import_key: buildImportKey(sampleRow.title, sampleRow.provider, sampleRow.suburb),
    }
    const { byUrl, byKey } = maps([existing])
    const decision = decideImportAction(sampleRow, byUrl, byKey, new Set())
    expect(decision).toEqual({ action: "update", existingId: "job-2" })
  })

  it("expires a job missing from two consecutive imports", () => {
    expect(nextMissingRuns(true, 1)).toBe(0)
    expect(nextMissingRuns(false, 0)).toBe(1)
    expect(shouldExpireFromAbsences(1)).toBe(false)
    expect(shouldExpireFromAbsences(2)).toBe(true)
  })

  it("parses pay and work type from CSV values", () => {
    expect(parsePay("$35-$42 per hour")).toEqual({
      payMin: 35,
      payMax: 42,
      payPeriod: "hour",
    })
    expect(parseWorkType("Part time")).toBe("part_time")
  })

  it("parses a well-formed CSV", () => {
    const csv = [
      "title,provider,suburb,state,work type,pay,posted date,source URL",
      "Disability support worker,Banksia,Hamilton Hill,WA,Casual,$38-$43 per hour,2026-09-01,https://example.com/a",
    ].join("\n")
    const { rows, errors } = parseCsv(csv)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
    expect(rows[0].workType).toBe("casual")
    expect(rows[0].state).toBe("WA")
  })
})
