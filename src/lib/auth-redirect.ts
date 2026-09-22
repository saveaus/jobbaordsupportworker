import type { SupabaseClient } from "@supabase/supabase-js"
import {
  type AccountKind,
  accountKindFromNext,
  ensureAccountKind,
  getAccountKind,
  getApplicantProfile,
} from "@/lib/account"

export class AccountKindMismatchError extends Error {
  existing: AccountKind
  requested: AccountKind

  constructor(existing: AccountKind, requested: AccountKind) {
    super("account-kind-mismatch")
    this.existing = existing
    this.requested = requested
  }
}

export async function pathAfterSignIn(
  supabase: SupabaseClient,
  next: string,
  requested = accountKindFromNext(next)
) {
  const existing = await getAccountKind(supabase)
  if (existing && existing !== requested)
    throw new AccountKindMismatchError(existing, requested)

  const kind = await ensureAccountKind(supabase, requested)

  if (kind === "provider")
    return requested === "provider" ? next : "/dashboard"

  const applicantNext = requested === "provider" ? "/account" : next
  const { isComplete } = await getApplicantProfile(supabase)
  if (!isComplete && !applicantNext.startsWith("/profile"))
    return `/profile?next=${encodeURIComponent(applicantNext)}`

  return applicantNext
}
