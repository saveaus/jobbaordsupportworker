"use server"

import { redirect } from "next/navigation"
import {
  ensureAccountKind,
  getAccountKind,
} from "@/lib/account"
import { parseAccountKind, safeNext, signInPath } from "@/lib/account-kind"
import { pathAfterKind } from "@/lib/auth-redirect"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function chooseAccountKind(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const next = safeNext(String(formData.get("next") ?? "/"))
  if (!user) redirect(signInPath(next))

  const requested = parseAccountKind(String(formData.get("kind") ?? ""))
  const existing = await getAccountKind(supabase)
  const kind = existing ?? await ensureAccountKind(supabase, requested)
  redirect(await pathAfterKind(supabase, kind, next))
}
