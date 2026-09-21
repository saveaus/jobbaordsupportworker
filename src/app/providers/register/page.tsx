import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { RegisterForm } from "./register-form"
import { getAccountKind } from "@/lib/account"

export const metadata: Metadata = { title: "Provider sign up" }

export default async function ProviderRegisterPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/providers")

  const kind = await getAccountKind(supabase)
  if (kind === "applicant") redirect("/account")

  const provider = await getProviderForUser(supabase)
  if (provider) redirect("/dashboard")

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">Provider sign up</h1>
      <RegisterForm defaultEmail={user.email ?? ""} />
    </div>
  )
}
