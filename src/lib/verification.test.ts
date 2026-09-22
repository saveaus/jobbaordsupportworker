import { describe, expect, it } from "vitest"
import { verificationLabel, verificationPercent } from "./verification"

describe("verificationPercent", () => {
  it("is zero with no checks", () => {
    expect(verificationPercent([])).toBe(0)
  })

  it("counts only verified checks against all six requirements", () => {
    expect(
      verificationPercent([
        { status: "verified" },
        { status: "verified" },
        { status: "pending" },
      ])
    ).toBe(33)
  })
})

describe("verificationLabel", () => {
  it("uses the profile copy", () => {
    expect(verificationLabel(50)).toBe("Verified 50%")
  })
})
