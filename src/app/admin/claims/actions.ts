"use server"

import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { approveClaimTransfer } from "@/app/jobs/[slug]/claim/actions"
import { sendClaimApproved } from "@/lib/email/templates"
import { siteConfig } from "@/config/site"
import { firstRelation } from "@/lib/relation"

export async function decideClaim(formData: FormData) {
  await requireAdmin()
  const claimId = String(formData.get("claimId") ?? "")
  const decision = String(formData.get("decision") ?? "")
  const db = createSupabaseServiceClient()
  const { data: claim } = await db
    .from("claims")
    .select("id, job_id, claimant_email, claimant_provider_id, jobs(title, slug)")
    .eq("id", claimId)
    .single()
  if (!claim) redirect("/admin/claims")

  await db
    .from("claims")
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq("id", claimId)

  if (decision === "approved" && claim.claimant_provider_id) {
    const { data: provider } = await db
      .from("providers")
      .select("business_name")
      .eq("id", claim.claimant_provider_id)
      .single()
    await approveClaimTransfer(
      claim.job_id,
      claim.claimant_provider_id,
      provider?.business_name ?? ""
    )
    const job = firstRelation(claim.jobs as { title: string; slug: string }[] | { title: string; slug: string } | null)
    if (claim.claimant_email && job)
      await sendClaimApproved(
        claim.claimant_email,
        job.title,
        `${siteConfig.url}/jobs/${job.slug}`
      )
  }
  redirect("/admin/claims")
}
