"use server"

import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

export async function deleteAccount() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const service = createSupabaseServiceClient()
  await service.storage.from("cvs").remove(
    ((await service.storage.from("cvs").list(user.id)).data ?? []).map((f) => `${user.id}/${f.name}`)
  )
  await service.auth.admin.deleteUser(user.id)
  await supabase.auth.signOut()
  redirect("/")
}
