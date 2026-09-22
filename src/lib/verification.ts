import { REQUIREMENTS, type RequirementCode } from "@/lib/constants"

export type RequirementCheckStatus = "pending" | "verified" | "rejected"

export interface RequirementCheck {
  requirement: RequirementCode
  status: RequirementCheckStatus
  evidence_path: string | null
  review_note: string | null
}

export function verificationPercent(checks: { status: string }[]) {
  const total = Object.keys(REQUIREMENTS).length
  const verified = checks.filter((check) => check.status === "verified").length
  return Math.round((verified / total) * 100)
}

export function verificationLabel(percent: number) {
  return `Verified ${percent}%`
}
