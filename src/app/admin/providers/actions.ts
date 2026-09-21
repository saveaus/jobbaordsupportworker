"use server"

import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

export async function suspendProvider(formData: FormData) {
  await requireAdmin()
  const db = createSupabaseServiceClient()
  const id = String(formData.get("providerId") ?? "")
  await db.from("providers").update({ status: "suspended" }).eq("id", id)
  await db
    .from("jobs")
    .update({ status: "unpublished", unpublished_at: new Date().toISOString() })
    .eq("provider_id", id)
    .eq("status", "live")
  redirect("/admin/providers")
}
