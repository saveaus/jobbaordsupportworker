import { describe, expect, it } from "vitest"
import { formatPay, formatPostedDate, formatLocation, formatApplicantCount } from "@/lib/format"

describe("display formats", () => {
  it("formats pay ranges and omits missing pay", () => {
    expect(formatPay({ payMin: 35, payMax: 42, payPeriod: "hour" })).toBe("$35-$42 per hour")
    expect(formatPay({ payMin: null, payMax: null, payPeriod: null })).toBeNull()
  })

  it("uses relative posted dates until 30 days, then an absolute date", () => {
    const now = new Date("2026-09-21T00:00:00Z")
    expect(formatPostedDate(new Date("2026-09-18T00:00:00Z"), now)).toBe("Posted 3 days ago")
    expect(formatPostedDate(new Date("2026-08-01T00:00:00Z"), now)).toMatch(/Posted \d+ Aug 2026/)
  })

  it("formats location and applicant counts", () => {
    expect(formatLocation("Hamilton Hill", "WA")).toBe("Hamilton Hill, WA")
    expect(formatApplicantCount(14)).toBe("14 applicants")
    expect(formatApplicantCount(1)).toBe("1 applicant")
  })
})
