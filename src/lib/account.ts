import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  type AccountKind,
  accountKindFromNext,
  isCompleteApplicantProfile,
} from "@/lib/account-kind"

export type { AccountKind }
export { accountKindFromNext, isCompleteApplicantProfile }

export async function getAccountKind(
  supabase: SupabaseClient
): Promise<AccountKind | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: row } = await supabase
    .from("account_kinds")
    .select("kind")
    .eq("user_id", user.id)
    .maybeSingle()
  if (row?.kind === "applicant" || row?.kind === "provider") return row.kind

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle()
  if (provider) return "provider"

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (profile) return "applicant"

  return null
}

export async function ensureAccountKind(
  supabase: SupabaseClient,
  requested: AccountKind
): Promise<AccountKind> {
  const existing = await getAccountKind(supabase)
  if (existing) return existing

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return requested

  const { error } = await supabase.from("account_kinds").insert({
    user_id: user.id,
    kind: requested,
  })
  if (error && error.code !== "23505")
    console.error("ensureAccountKind", error.message)

  return (await getAccountKind(supabase)) ?? requested
}

export async function getApplicantProfile(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return { user: null, profile: null, isComplete: false as const }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, postcode")
    .eq("user_id", user.id)
    .maybeSingle()

  return {
    user,
    profile,
    isComplete: isCompleteApplicantProfile(profile),
  }
}

export async function requireApplicant(nextPath: string) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=${nextPath}`)

  const kind = await ensureAccountKind(supabase, "applicant")
  if (kind === "provider") redirect("/dashboard")

  return { supabase, user }
}
