import { describe, expect, it } from "vitest"
import { isValidAbn, normaliseAbn } from "@/lib/abn"

describe("ABN checksum", () => {
  it("accepts a real valid ABN", () => {
    expect(isValidAbn("51 824 753 556")).toBe(true)
    expect(normaliseAbn("51 824 753 556")).toBe("51824753556")
  })

  it("rejects 11 digits that fail the checksum", () => {
    expect(isValidAbn("11111111111")).toBe(false)
  })

  it("rejects short or non-numeric input", () => {
    expect(isValidAbn("5182475355")).toBe(false)
    expect(isValidAbn("abcdefghijk")).toBe(false)
  })
})
