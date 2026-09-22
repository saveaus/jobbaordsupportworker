"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"
import { safeNext } from "@/lib/account-kind"
import { pathAfterSignIn } from "@/lib/auth-redirect"
import { getRequestSiteUrl } from "@/lib/request-site-url"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface CreateAccountState {
  error?: string
  sent?: boolean
  email?: string
}

const createSchema = z
  .object({
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
    next: z.string().startsWith("/").catch("/"),
  })
  .refine(function passwordsMatch(value) {
    return value.password === value.confirmPassword
  }, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export async function createAccount(
  _previous: CreateAccountState,
  formData: FormData
): Promise<CreateAccountState> {
  const parsed = createSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    next: safeNext(String(formData.get("next") ?? "/")),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? "Check the form and try again." }
  }

  const { email, password, next } = parsed.data

  const isHuman = await verifyTurnstile(
    formData.get("cf-turnstile-response")?.toString()
  )
  if (!isHuman)
    return { error: "We couldn't verify your browser. Reload the page and try again." }

  const allowed = await checkRateLimit({
    action: "sign-up",
    email,
    max: 5,
    windowSeconds: 3600,
  })
  if (!allowed)
    return { error: "Too many accounts started. Try again in an hour." }

  const supabase = await createSupabaseServerClient()
  const origin = await getRequestSiteUrl()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  })
  if (error) {
    const already = /already|registered|exists/i.test(error.message)
    return {
      error: already
        ? "That email already has an account. Sign in."
        : "We couldn't create that account. Try again in a minute.",
    }
  }
  if (data.user && !data.session && (data.user.identities?.length ?? 0) === 0)
    return { error: "That email already has an account. Sign in." }

  if (!data.session)
    return { sent: true, email }

  redirect(await pathAfterSignIn(supabase, next))
}
