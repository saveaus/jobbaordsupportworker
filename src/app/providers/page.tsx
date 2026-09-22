import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { SignInForm } from "@/app/sign-in/sign-in-form"
import { getAccountKind } from "@/lib/account"

export const metadata: Metadata = { title: "Sign in to hire" }

export default async function ProvidersPage({
  searchParams,
}: PageProps<"/providers">) {
  const params = await searchParams
  const passwordFailed = params.error === "password"
  const linkFailed = params.error === "link"
  const kindFailed = params.error === "kind"

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const kind = await getAccountKind(supabase)
    if (kind === "applicant") {
      return (
        <div className="flex max-w-prose flex-col gap-8">
          <h1 className="text-h1">Sign in to hire</h1>
          <p>
            This login is an applicant account. Sign out and use a work email to
            hire.
          </p>
          <p className="text-sm text-muted">
            <Link href="/account" className="underline">
              Back to your account
            </Link>
          </p>
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="inline-flex min-h-11 items-center underline">
              Sign out
            </button>
          </form>
        </div>
      )
    }
    const provider = await getProviderForUser(supabase)
    redirect(provider ? "/dashboard" : "/providers/register")
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">Sign in to hire</h1>
      <div className="flex max-w-prose flex-col gap-4">
        <p>
          Post unlimited support work jobs and receive applications with profiles
          and CVs attached.
        </p>
        <p>
          $249 a month plus GST, or $2,490 a year plus GST. The first 14 days are
          free; a card is required to start and you can cancel anytime.
        </p>
        <p className="font-mono text-sm text-night-25">
          Business accounts only. Apply from a separate login.
        </p>
      </div>
      {passwordFailed ? (
        <p className="text-error">That email or password is wrong.</p>
      ) : null}
      {linkFailed ? (
        <p className="text-error">That sign-in link is invalid or has expired. Request a new one.</p>
      ) : null}
      {kindFailed ? (
        <p className="text-error">
          That email is an applicant account. Sign in to apply instead.
        </p>
      ) : null}
      <SignInForm next="/providers/register" kind="provider" />
      <p className="text-sm text-muted">
        Looking for work?{" "}
        <Link href="/sign-in" className="underline">
          Sign in to apply
        </Link>
        .
      </p>
    </div>
  )
}
