"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { REQUIREMENTS, type RequirementCode } from "@/lib/constants"

export async function reviewRequirement(formData: FormData) {
  await requireAdmin()
  const userId = String(formData.get("userId") ?? "")
  const requirement = String(formData.get("requirement") ?? "") as RequirementCode
  const decision = String(formData.get("decision") ?? "")
  const reviewNote = String(formData.get("reviewNote") ?? "").trim() || null
  if (!userId || !(requirement in REQUIREMENTS)) return
  if (decision !== "verified" && decision !== "rejected") return

  const db = createSupabaseServiceClient()
  await db
    .from("requirement_checks")
    .update({
      status: decision,
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("requirement", requirement)

  const { data: verified } = await db
    .from("requirement_checks")
    .select("requirement")
    .eq("user_id", userId)
    .eq("status", "verified")

  await db
    .from("profiles")
    .update({
      requirements: (verified ?? []).map((row) => row.requirement),
    })
    .eq("user_id", userId)

  revalidatePath("/admin/verifications")
}
