import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  accountKindFromNext,
  ensureAccountKind,
  getApplicantProfile,
} from "@/lib/account"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const nextParam = url.searchParams.get("next")
  const next = nextParam?.startsWith("/") ? nextParam : "/"

  if (!code)
    return NextResponse.redirect(new URL("/sign-in?error=link", url.origin))

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error)
    return NextResponse.redirect(new URL("/sign-in?error=link", url.origin))

  const requested = accountKindFromNext(next)
  const kind = await ensureAccountKind(supabase, requested)

  if (kind === "provider") {
    const destination = requested === "provider" ? next : "/dashboard"
    return NextResponse.redirect(new URL(destination, url.origin))
  }

  const applicantNext = requested === "provider" ? "/account" : next
  const { isComplete } = await getApplicantProfile(supabase)
  if (!isComplete && !applicantNext.startsWith("/profile")) {
    return NextResponse.redirect(
      new URL(`/profile?next=${encodeURIComponent(applicantNext)}`, url.origin)
    )
  }

  return NextResponse.redirect(new URL(applicantNext, url.origin))
}
