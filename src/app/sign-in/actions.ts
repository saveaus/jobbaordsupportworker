"use server"

import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"
import { siteConfig } from "@/config/site"
import { accountKindFromNext } from "@/lib/account-kind"

export interface SignInState {
  error?: string
  sent?: boolean
  email?: string
}

const signInSchema = z.object({
  email: z.email(),
  next: z.string().startsWith("/").catch("/"),
})

export async function sendMagicLink(
  _previous: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    next: String(formData.get("next") ?? "/"),
  })
  if (!parsed.success)
    return { error: "Enter a valid email address." }

  const { email, next } = parsed.data
  const kind = accountKindFromNext(next)

  const isHuman = await verifyTurnstile(
    formData.get("cf-turnstile-response")?.toString()
  )
  if (!isHuman)
    return { error: "We couldn't verify your browser. Reload the page and try again." }

  const allowed = await checkRateLimit({
    action: "magic-link",
    email,
    max: 5,
    windowSeconds: 3600,
  })
  if (!allowed)
    return { error: "Too many sign-in emails requested. Try again in an hour." }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${siteConfig.url}/auth/callback?next=${encodeURIComponent(next)}`,
      data: { account_kind: kind },
    },
  })
  if (error)
    return { error: "We couldn't send the email. Check the address and try again." }

  return { sent: true, email }
}
