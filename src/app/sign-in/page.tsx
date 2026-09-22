import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthSwitch } from "@/components/site/auth-switch"
import { safeNext } from "@/lib/account-kind"
import { pathAfterSignIn } from "@/lib/auth-redirect"
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server"
import { SignInForm } from "./sign-in-form"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "Sign in" }

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams
  const next = safeNext(typeof params.next === "string" ? params.next : "/")
  const linkFailed = params.error === "link"
  const passwordFailed = params.error === "password"

  const user = await getSessionUser()
  if (user) {
    const supabase = await createSupabaseServerClient()
    redirect(await pathAfterSignIn(supabase, next))
  }

  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <h1 className="text-h1">Sign in</h1>
      <p className="max-w-prose">
        Use the email and password for your account.
      </p>
      {passwordFailed ? (
        <p className="text-error">That email or password is wrong.</p>
      ) : null}
      {linkFailed ? (
        <p className="text-error">That sign-in link is invalid or has expired. Request a new one.</p>
      ) : null}
      <SignInForm next={next} />
      <AuthSwitch mode="sign-in" next={next} />
    </div>
  )
}
