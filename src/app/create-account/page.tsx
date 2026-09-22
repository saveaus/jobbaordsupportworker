import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthSwitch } from "@/components/site/auth-switch"
import { safeNext } from "@/lib/account-kind"
import { pathAfterSignIn } from "@/lib/auth-redirect"
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server"
import { CreateAccountForm } from "./create-account-form"

export const metadata: Metadata = { title: "Create account" }

export default async function CreateAccountPage({
  searchParams,
}: PageProps<"/create-account">) {
  const params = await searchParams
  const next = safeNext(typeof params.next === "string" ? params.next : "/")

  const user = await getSessionUser()
  if (user) {
    const supabase = await createSupabaseServerClient()
    redirect(await pathAfterSignIn(supabase, next))
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">Create account</h1>
      <p className="max-w-prose">
        One account. Then choose to apply or hire.
      </p>
      <CreateAccountForm next={next} />
      <AuthSwitch mode="create-account" next={next} />
    </div>
  )
}
