import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { SignInForm } from "@/app/sign-in/sign-in-form"
import { getAccountKind } from "@/lib/account"

export const metadata: Metadata = { title: "Post a job" }

export default async function ProvidersPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const kind = await getAccountKind(supabase)
    if (kind === "applicant") {
      return (
        <div className="flex max-w-prose flex-col gap-8">
          <h1 className="text-h1">Post a job</h1>
          <p>
            This account is for applying. Sign out and use a work email to hire.
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
      <h1 className="text-h1">Post a job</h1>
      <div className="flex max-w-prose flex-col gap-4">
        <p>
          Post unlimited support work jobs and receive applications with profiles
          and CVs attached.
        </p>
        <p>
          $249 a month plus GST, or $2,490 a year plus GST. The first 14 days are
          free; a card is required to start and you can cancel anytime.
        </p>
        <p className="text-sm text-muted">
          Sign in with your work email to get started.
        </p>
      </div>
      <SignInForm next="/providers/register" />
      <p className="text-sm text-muted">
        Looking for work?{" "}
        <Link href="/sign-in" className="underline">
          Sign in as an applicant
        </Link>
        .
      </p>
    </div>
  )
}
