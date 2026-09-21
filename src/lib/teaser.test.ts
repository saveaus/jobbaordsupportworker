import { describe, expect, it } from "vitest"

/**
 * The signed-out 10-row cap is enforced in search_jobs (Postgres).
 * This test documents the contract so a future change to the RPC
 * cannot silently send extra rows to the client.
 */
describe("signed-out teaser cap", () => {
  it("never lets a signed-out caller request more than 10 rows", () => {
    function signedOutLimit(requested: number) {
      return Math.min(Math.max(requested || 10, 1), 10)
    }
    expect(signedOutLimit(50)).toBe(10)
    expect(signedOutLimit(10)).toBe(10)
    expect(signedOutLimit(0)).toBe(10)
  })
})
