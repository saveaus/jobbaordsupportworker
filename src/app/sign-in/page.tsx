import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getAccountKind } from "@/lib/account"
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server"
import { SignInForm } from "./sign-in-form"

export const metadata: Metadata = { title: "Sign in to apply" }

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams
  const next = typeof params.next === "string" && params.next.startsWith("/")
    ? params.next
    : "/"
  const linkFailed = params.error === "link"
  const passwordFailed = params.error === "password"
  const kindFailed = params.error === "kind"

  const user = await getSessionUser()
  if (user) {
    const supabase = await createSupabaseServerClient()
    const kind = await getAccountKind(supabase)
    if (kind === "provider") {
      return (
        <div className="flex max-w-prose flex-col gap-8">
          <h1 className="text-h1">Sign in to apply</h1>
          <p>
            This login is a business account. Sign out and use a different email
            to apply.
          </p>
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="inline-flex min-h-11 items-center underline">
              Sign out
            </button>
          </form>
        </div>
      )
    }
    redirect(next)
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">Sign in to apply</h1>
      <p className="max-w-prose">
        Applicant accounts only. Hire from a separate business login.
      </p>
      {passwordFailed ? (
        <p className="text-error">That email or password is wrong.</p>
      ) : null}
      {linkFailed ? (
        <p className="text-error">That sign-in link is invalid or has expired. Request a new one.</p>
      ) : null}
      {kindFailed ? (
        <p className="text-error">
          That email is a business account. Sign in to hire instead.
        </p>
      ) : null}
      <SignInForm next={next} kind="applicant" />
      <p className="text-sm text-muted">
        Posting jobs?{" "}
        <Link href="/providers" className="underline">
          Sign in to hire
        </Link>
        .
      </p>
    </div>
  )
}
