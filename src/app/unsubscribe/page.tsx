import type { Metadata } from "next"
import { parseUnsubscribeToken } from "@/lib/email/send"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { UnsubscribeForm } from "./form"
import type { AppPageProps } from "@/lib/page-props"

export const metadata: Metadata = { title: "Unsubscribe" }

export default async function UnsubscribePage({ searchParams }: AppPageProps) {
  const params = await searchParams
  const token = typeof params.token === "string" ? params.token : ""
  const email = token ? parseUnsubscribeToken(token) : null
  const done = params.done === "1"

  if (done)
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-h1">Unsubscribed</h1>
        <p>You will not receive further marketing or alert emails from us.</p>
      </div>
    )

  if (email) {
    const db = createSupabaseServiceClient()
    await db.from("email_suppressions").upsert({ email })
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-h1">Unsubscribed</h1>
        <p>{email} has been removed from job alerts and other optional email.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">Unsubscribe</h1>
      <UnsubscribeForm />
    </div>
  )
}
