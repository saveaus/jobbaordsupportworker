import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { pathAfterSignIn } from "@/lib/auth-redirect"
import { createSupabaseRouteClient } from "@/lib/supabase/route"

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
])

/**
 * GET: do not exchange the one-time token. Mail scanners consume GET links.
 * POST: establish the session and attach cookies to the redirect.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const confirm = new URL("/auth/confirm", url.origin)
  url.searchParams.forEach((value, key) => {
    confirm.searchParams.set(key, value)
  })
  return NextResponse.redirect(confirm)
}

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin
  const formData = await request.formData()
  const nextRaw = String(formData.get("next") ?? "/")
  const next = nextRaw.startsWith("/") ? nextRaw : "/"
  const tokenHash = String(formData.get("token_hash") ?? "")
  const code = String(formData.get("code") ?? "")
  const email = String(formData.get("email") ?? "").trim()
  const token = String(formData.get("token") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const rawType = String(formData.get("type") ?? "email")
  const type = OTP_TYPES.has(rawType as EmailOtpType)
    ? (rawType as EmailOtpType)
    : "email"

  const { supabase, applyCookies } = createSupabaseRouteClient(request)

  let errorMessage: string | null = null
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    errorMessage = error?.message ?? null
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    errorMessage = error?.message ?? null
  } else if (email && password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    errorMessage = error ? "password" : null
  } else if (email && token) {
    const { error } = await supabase.auth.verifyOtp({
      type: "email",
      email,
      token,
    })
    errorMessage = error?.message ?? null
  } else {
    errorMessage = "missing"
  }

  if (errorMessage) {
    const failed = new URL("/sign-in", origin)
    failed.searchParams.set("error", errorMessage === "password" ? "password" : "link")
    if (next !== "/") failed.searchParams.set("next", next)
    return applyCookies(NextResponse.redirect(failed, 303))
  }

  const destination = await pathAfterSignIn(supabase, next)
  return applyCookies(
    NextResponse.redirect(new URL(destination, origin), 303)
  )
}
