/**
 * Billing state machine. Pure functions so they can be unit-tested
 * without Stripe. Stripe remains the source of truth for subscription
 * status; this module decides what we do to jobs as a result.
 */

export const GRACE_PERIOD_MS = 3 * 86_400_000
export const JOB_LIFE_MS = 30 * 86_400_000

export type StripeStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | string

export interface BillingSnapshot {
  stripeStatus: string | null
  trialEnd: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  graceExpiresAt: Date | null
}

export function isUsableForPosting(snapshot: BillingSnapshot, now: Date): boolean {
  if (snapshot.stripeStatus === "trialing" || snapshot.stripeStatus === "active")
    return true
  if (snapshot.stripeStatus === "past_due")
    return snapshot.graceExpiresAt != null && now <= snapshot.graceExpiresAt
  return false
}

/**
 * Newly past_due: start a 3-day grace clock if one is not already set.
 * Leaving past_due clears it.
 */
export function nextGraceExpiresAt(
  previousStatus: string | null,
  nextStatus: string,
  existingGrace: Date | null,
  now: Date
): Date | null {
  if (nextStatus === "past_due") {
    if (previousStatus !== "past_due" || existingGrace == null)
      return new Date(now.getTime() + GRACE_PERIOD_MS)
    return existingGrace
  }
  return null
}

export function shouldUnpublishForFailedPayment(
  snapshot: BillingSnapshot,
  now: Date
): boolean {
  if (snapshot.stripeStatus !== "past_due") return false
  if (snapshot.graceExpiresAt == null) return false
  return now > snapshot.graceExpiresAt
}

/**
 * Cancelled during trial: jobs stay live until trial_end.
 * Cancelled while paid: jobs stay live until current_period_end.
 */
export function shouldUnpublishForCancellation(
  snapshot: BillingSnapshot,
  now: Date
): boolean {
  if (snapshot.stripeStatus === "canceled") {
    const until = snapshot.trialEnd ?? snapshot.currentPeriodEnd
    return until != null && now >= until
  }
  if (snapshot.cancelAtPeriodEnd && snapshot.currentPeriodEnd)
    return now >= snapshot.currentPeriodEnd
  return false
}

/**
 * On republish: expires_at += (now - unpublished_at) so remaining days
 * are preserved.
 */
export function republishExpiresAt(
  expiresAt: Date,
  unpublishedAt: Date,
  now: Date
): Date {
  return new Date(expiresAt.getTime() + (now.getTime() - unpublishedAt.getTime()))
}

export function shouldRepublishOnPayment(
  previousStatus: string | null,
  nextStatus: string
): boolean {
  const recovered =
    nextStatus === "active" || nextStatus === "trialing"
  const wasDown =
    previousStatus === "past_due" ||
    previousStatus === "unpaid" ||
    previousStatus === "canceled"
  return recovered && wasDown
}
