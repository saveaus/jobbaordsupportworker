import { notFound, redirect } from "next/navigation"
import { getSessionUser } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  return user
}

export async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in?next=/admin")
  const db = createSupabaseServiceClient()
  const { data } = await db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle()
  if (!data) notFound()
  return user
}

export async function isAdmin(userId: string): Promise<boolean> {
  const db = createSupabaseServiceClient()
  const { data } = await db.from("admins").select("user_id").eq("user_id", userId).maybeSingle()
  return Boolean(data)
}
