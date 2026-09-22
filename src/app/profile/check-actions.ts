"use server"

import { revalidatePath } from "next/cache"
import { REQUIREMENTS, type RequirementCode } from "@/lib/constants"
import { requireApplicant } from "@/lib/account"

export interface CheckState {
  error?: string
  saved?: boolean
}

export async function submitRequirementCheck(
  _previous: CheckState,
  formData: FormData
): Promise<CheckState> {
  const { supabase, user } = await requireApplicant("/profile")
  const requirement = String(formData.get("requirement") ?? "")
  if (!(requirement in REQUIREMENTS))
    return { error: "Unknown requirement." }

  const evidencePath = String(formData.get("evidencePath") ?? "").trim()
  if (!evidencePath)
    return { error: "Upload a file before you submit this check." }

  const { error } = await supabase.from("requirement_checks").upsert({
    user_id: user.id,
    requirement: requirement as RequirementCode,
    status: "pending",
    evidence_path: evidencePath,
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    review_note: null,
  })
  if (error)
    return { error: "We couldn't submit that check. Try again in a minute." }

  const { data: verified } = await supabase
    .from("requirement_checks")
    .select("requirement")
    .eq("user_id", user.id)
    .eq("status", "verified")

  await supabase
    .from("profiles")
    .update({
      requirements: (verified ?? []).map((row) => row.requirement),
    })
    .eq("user_id", user.id)

  revalidatePath("/profile")
  return { saved: true }
}
