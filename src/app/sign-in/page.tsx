import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/supabase/server"
import { SignInForm } from "./sign-in-form"

export const metadata: Metadata = { title: "Sign in" }

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams
  const next = typeof params.next === "string" && params.next.startsWith("/")
    ? params.next
    : "/"
  const linkFailed = params.error === "link"
  const passwordFailed = params.error === "password"

  const user = await getSessionUser()
  if (user) redirect(next)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">Sign in</h1>
      <p className="max-w-prose">
        Apply for support work jobs. Sign in with email and password, or email a
        link.
      </p>
      {passwordFailed ? (
        <p className="text-error">That email or password is wrong.</p>
      ) : null}
      {linkFailed ? (
        <p className="text-error">That sign-in link is invalid or has expired. Request a new one.</p>
      ) : null}
      <SignInForm next={next} />
      <p className="text-sm text-muted">
        Posting jobs?{" "}
        <Link href="/providers" className="underline">
          Sign in as a business
        </Link>
        .
      </p>
    </div>
  )
}
