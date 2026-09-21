import { describe, expect, it } from "vitest"
import {
  isUsableForPosting,
  nextGraceExpiresAt,
  republishExpiresAt,
  shouldRepublishOnPayment,
  shouldUnpublishForCancellation,
  shouldUnpublishForFailedPayment,
} from "@/lib/billing"

const now = new Date("2026-09-21T00:00:00Z")

describe("billing state machine", () => {
  it("allows posting during trial and active", () => {
    expect(
      isUsableForPosting(
        {
          stripeStatus: "trialing",
          trialEnd: new Date("2026-10-05"),
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          graceExpiresAt: null,
        },
        now
      )
    ).toBe(true)
    expect(
      isUsableForPosting(
        {
          stripeStatus: "active",
          trialEnd: null,
          currentPeriodEnd: new Date("2026-10-21"),
          cancelAtPeriodEnd: false,
          graceExpiresAt: null,
        },
        now
      )
    ).toBe(true)
  })

  it("starts a 3-day grace clock when status becomes past_due", () => {
    const grace = nextGraceExpiresAt("active", "past_due", null, now)
    expect(grace?.getTime()).toBe(now.getTime() + 3 * 86_400_000)
  })

  it("keeps the existing grace clock on repeat past_due events", () => {
    const existing = new Date("2026-09-23T00:00:00Z")
    const grace = nextGraceExpiresAt("past_due", "past_due", existing, now)
    expect(grace).toEqual(existing)
  })

  it("unpublishes after the grace period, not before", () => {
    const grace = new Date(now.getTime() + 86_400_000)
    expect(
      shouldUnpublishForFailedPayment(
        {
          stripeStatus: "past_due",
          trialEnd: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          graceExpiresAt: grace,
        },
        now
      )
    ).toBe(false)
    expect(
      shouldUnpublishForFailedPayment(
        {
          stripeStatus: "past_due",
          trialEnd: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          graceExpiresAt: grace,
        },
        new Date(grace.getTime() + 1000)
      )
    ).toBe(true)
  })

  it("keeps jobs live until trial end when cancelled during trial", () => {
    const trialEnd = new Date("2026-10-05T00:00:00Z")
    expect(
      shouldUnpublishForCancellation(
        {
          stripeStatus: "canceled",
          trialEnd,
          currentPeriodEnd: trialEnd,
          cancelAtPeriodEnd: true,
          graceExpiresAt: null,
        },
        now
      )
    ).toBe(false)
    expect(
      shouldUnpublishForCancellation(
        {
          stripeStatus: "canceled",
          trialEnd,
          currentPeriodEnd: trialEnd,
          cancelAtPeriodEnd: true,
          graceExpiresAt: null,
        },
        new Date("2026-10-06T00:00:00Z")
      )
    ).toBe(true)
  })

  it("adds unpublished time back onto expires_at", () => {
    const expires = new Date("2026-10-01T00:00:00Z")
    const unpublished = new Date("2026-09-20T00:00:00Z")
    const republished = new Date("2026-09-23T00:00:00Z")
    const next = republishExpiresAt(expires, unpublished, republished)
    expect(next.toISOString()).toBe("2026-10-04T00:00:00.000Z")
  })

  it("republishes when payment recovers from past_due", () => {
    expect(shouldRepublishOnPayment("past_due", "active")).toBe(true)
    expect(shouldRepublishOnPayment("active", "active")).toBe(false)
    expect(shouldRepublishOnPayment("past_due", "past_due")).toBe(false)
  })
})
