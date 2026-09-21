import type { SupabaseClient } from "@supabase/supabase-js"
import {
  accountKindFromNext,
  ensureAccountKind,
  getApplicantProfile,
} from "@/lib/account"

export async function pathAfterSignIn(
  supabase: SupabaseClient,
  next: string
) {
  const requested = accountKindFromNext(next)
  const kind = await ensureAccountKind(supabase, requested)

  if (kind === "provider")
    return requested === "provider" ? next : "/dashboard"

  const applicantNext = requested === "provider" ? "/account" : next
  const { isComplete } = await getApplicantProfile(supabase)
  if (!isComplete && !applicantNext.startsWith("/profile"))
    return `/profile?next=${encodeURIComponent(applicantNext)}`

  return applicantNext
}
