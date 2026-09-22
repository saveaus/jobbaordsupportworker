import type { SupabaseClient } from "@supabase/supabase-js"
import {
  accountKindFromNext,
  choosePath,
  getAccountKind,
  getApplicantProfile,
} from "@/lib/account"
import { safeNext, type AccountKind } from "@/lib/account-kind"

export async function pathAfterKind(
  supabase: SupabaseClient,
  kind: AccountKind,
  next: string
) {
  const safe = safeNext(next)

  if (kind === "provider") {
    if (accountKindFromNext(safe) === "provider" && safe !== "/providers")
      return safe
    return "/dashboard"
  }

  const applicantNext = accountKindFromNext(safe) === "provider" ? "/" : safe
  if (applicantNext === "/get-started" || applicantNext === "/create-account")
    return "/"

  const { isComplete } = await getApplicantProfile(supabase)
  if (!isComplete && !applicantNext.startsWith("/profile"))
    return `/profile?next=${encodeURIComponent(applicantNext)}`

  return applicantNext
}

export async function pathAfterSignIn(supabase: SupabaseClient, next: string) {
  const existing = await getAccountKind(supabase)
  if (!existing) return choosePath(next)
  return pathAfterKind(supabase, existing, next)
}
