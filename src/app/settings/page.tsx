import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { deleteAccount } from "./actions"
import { getAccountKind } from "@/lib/account"
import { AccountNav } from "@/components/site/account-nav"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/settings")

  const kind = await getAccountKind(supabase)

  return (
    <div className="flex flex-col gap-8">
      {kind ? <AccountNav kind={kind} /> : null}
      <div className="flex max-w-form flex-col gap-8">
        <h1 className="text-h1">Settings</h1>
        <p>
          Deleting your account removes your profile, applications, jobs you posted, and stored
          files. This cannot be undone.
        </p>
        <form action={deleteAccount}>
          <Button type="submit" variant="secondary">
            Delete my account and data
          </Button>
        </form>
      </div>
    </div>
  )
}
