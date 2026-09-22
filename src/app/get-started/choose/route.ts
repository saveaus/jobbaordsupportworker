import { NextResponse, type NextRequest } from "next/server"
import { ensureAccountKind, getAccountKind } from "@/lib/account"
import { parseAccountKind, safeNext, signInPath } from "@/lib/account-kind"
import { pathAfterKind } from "@/lib/auth-redirect"
import { createSupabaseRouteClient } from "@/lib/supabase/route"

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin
  const formData = await request.formData()
  const next = safeNext(String(formData.get("next") ?? "/"))
  const requested = parseAccountKind(String(formData.get("kind") ?? ""))
  const { supabase, applyCookies } = createSupabaseRouteClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return applyCookies(
      NextResponse.redirect(new URL(signInPath(next), origin), 303)
    )
  }

  const existing = await getAccountKind(supabase)
  const kind = existing ?? await ensureAccountKind(supabase, requested)
  const destination = await pathAfterKind(supabase, kind, next)
  return applyCookies(NextResponse.redirect(new URL(destination, origin), 303))
}
