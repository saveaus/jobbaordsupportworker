import { describe, expect, it } from "vitest"
import { shouldAutoApproveClaim, isFreeEmailDomain, normaliseProviderName } from "@/lib/import/normalise"

describe("claim routing", () => {
  it("auto-approves when the email domain matches the provider website", () => {
    expect(shouldAutoApproveClaim("dean@banksiacommunitycare.au", "banksiacommunitycare.au")).toBe(
      true
    )
  })

  it("sends free-mail domains to the admin queue", () => {
    expect(isFreeEmailDomain("gmail.com")).toBe(true)
    expect(shouldAutoApproveClaim("dean@gmail.com", "banksiacommunitycare.au")).toBe(false)
  })

  it("queues when there is no website domain to match", () => {
    expect(shouldAutoApproveClaim("dean@banksiacommunitycare.au", null)).toBe(false)
  })

  it("normalises Pty Ltd and punctuation out of provider names", () => {
    expect(normaliseProviderName("Banksia Community Care Pty. Ltd.")).toBe(
      "banksia community care"
    )
  })
})
