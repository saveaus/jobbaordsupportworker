"use server"

import { redirect } from "next/navigation"
import { checkRateLimit } from "@/lib/rate-limit"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { getProviderForUser } from "@/lib/queries/provider"
import { shouldAutoApproveClaim } from "@/lib/import/normalise"
import { sendClaimApproved, sendClaimNeedsReview } from "@/lib/email/templates"
import { siteConfig } from "@/config/site"

export interface ClaimState {
  error?: string
  autoApproved?: boolean
  queued?: boolean
}

export async function claimJob(_previous: ClaimState, formData: FormData): Promise<ClaimState> {
  const jobId = String(formData.get("jobId") ?? "")
  const slug = String(formData.get("slug") ?? "")
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/jobs/${slug}/claim`)

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers/register")

  const allowed = await checkRateLimit({
    action: "claim",
    email: user.email ?? undefined,
    max: 5,
    windowSeconds: 3600,
  })
  if (!allowed) return { error: "Too many claims. Try again later." }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, slug, source, provider_id, provider_name")
    .eq("id", jobId)
    .maybeSingle()
  if (!job || job.source !== "imported") return { error: "This listing cannot be claimed." }

  const service = createSupabaseServiceClient()
  const { data: importedProvider } = await service
    .from("providers")
    .select("id, website_domain")
    .eq("id", job.provider_id)
    .maybeSingle()

  const auto = shouldAutoApproveClaim(user.email ?? "", importedProvider?.website_domain ?? null)

  const { error } = await supabase.from("claims").insert({
    job_id: jobId,
    imported_provider_id: job.provider_id,
    claimant_user_id: user.id,
    claimant_provider_id: provider.id,
    claimant_email: user.email ?? "",
    status: auto ? "approved" : "pending",
    auto_approved: auto,
    decided_at: auto ? new Date().toISOString() : null,
  })
  if (error) return { error: "We couldn't send the claim. Try again in a minute." }

  if (auto) {
    await approveClaimTransfer(jobId, provider.id, provider.business_name)
    if (user.email)
      await sendClaimApproved(user.email, job.title, `${siteConfig.url}/jobs/${job.slug}`)
    return { autoApproved: true }
  }

  if (user.email) await sendClaimNeedsReview(user.email)
  return { queued: true }
}

export async function approveClaimTransfer(
  jobId: string,
  claimantProviderId: string,
  businessName: string
) {
  const service = createSupabaseServiceClient()
  await service
    .from("jobs")
    .update({
      provider_id: claimantProviderId,
      provider_name: businessName,
      source: "posted",
      source_url: null,
    })
    .eq("id", jobId)
}
