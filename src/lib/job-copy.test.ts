import { describe, expect, it } from "vitest"
import { decodeJobDescription, encodeJobDescription } from "@/lib/job-copy"

describe("job copy", () => {
  it("leaves the description alone when no shifts are ticked", () => {
    expect(encodeJobDescription("Two-person assist.", [])).toBe("Two-person assist.")
  })

  it("leads with the shift line and splits it back out", () => {
    const encoded = encodeJobDescription("Two-person assist.", ["afternoons", "sleepover"])
    expect(encoded).toBe("Shifts: Afternoons, Sleepover.\n\nTwo-person assist.")
    expect(decodeJobDescription(encoded)).toEqual({
      shifts: "Afternoons, Sleepover",
      body: "Two-person assist.",
    })
  })

  it("ignores unknown shift codes", () => {
    expect(encodeJobDescription("Meal support.", ["nights"])).toBe("Meal support.")
  })
})
