import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAccountKind } from "@/lib/account"
import { safeNext, signInPath } from "@/lib/account-kind"
import { pathAfterKind } from "@/lib/auth-redirect"
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server"
import { ChooseForm } from "./choose-form"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "Apply or hire" }

export default async function GetStartedPage({
  searchParams,
}: PageProps<"/get-started">) {
  const params = await searchParams
  const next = safeNext(typeof params.next === "string" ? params.next : "/")
  const intent = params.intent === "hire" ? "hire" : "apply"

  const user = await getSessionUser()
  if (!user) redirect(signInPath(next === "/" ? "/get-started" : next))

  const supabase = await createSupabaseServerClient()
  const kind = await getAccountKind(supabase)
  if (kind) redirect(await pathAfterKind(supabase, kind, next))

  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <h1 className="text-h1">Apply or hire</h1>
      <p className="max-w-prose">
        One account. Pick how you will use it.
      </p>
      <ChooseForm next={next} intent={intent} />
    </div>
  )
}
