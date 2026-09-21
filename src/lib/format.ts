const SYDNEY_TZ = "Australia/Sydney"

interface PayInput {
  payMin?: number | null
  payMax?: number | null
  payPeriod?: "hour" | "year" | null
}

/**
 * "$35-$42 per hour", "$35 per hour", "$80,000 per year".
 * Returns null when no pay is given (the row simply omits it).
 */
export function formatPay({ payMin, payMax, payPeriod }: PayInput): string | null {
  if (payMin == null && payMax == null) return null
  const period = payPeriod === "year" ? "per year" : "per hour"
  const fmt = (n: number) => `$${n.toLocaleString("en-AU")}`
  if (payMin != null && payMax != null && payMin !== payMax)
    return `${fmt(payMin)}-${fmt(payMax)} ${period}`
  return `${fmt((payMin ?? payMax) as number)} ${period}`
}

/** "Hamilton Hill, WA" */
export function formatLocation(suburb: string, state: string): string {
  return `${suburb}, ${state}`
}

/**
 * "Posted today", "Posted 1 day ago", "Posted 3 days ago";
 * after 30 days, the absolute date: "Posted 12 Sep 2026".
 */
export function formatPostedDate(postedAt: Date, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - postedAt.getTime()) / 86_400_000)
  if (days <= 0) return "Posted today"
  if (days === 1) return "Posted 1 day ago"
  if (days <= 30) return `Posted ${days} days ago`
  return `Posted ${formatDate(postedAt)}`
}

/** "12 Sep 2026" in Australian time. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: SYDNEY_TZ,
  })
}

/** "14 applicants", "1 applicant", "No applicants" */
export function formatApplicantCount(count: number): string {
  if (count === 0) return "No applicants"
  if (count === 1) return "1 applicant"
  return `${count} applicants`
}

/** "12 days left", "1 day left", "Expires today" */
export function formatDaysLeft(expiresAt: Date, now: Date = new Date()): string {
  const days = Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000)
  if (days <= 0) return "Expired"
  if (days === 1) return "1 day left"
  return `${days} days left`
}
