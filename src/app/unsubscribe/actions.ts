"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

export interface UnsubState {
  error?: string
}

export async function unsubscribeByEmail(
  _previous: UnsubState,
  formData: FormData
): Promise<UnsubState> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim())
  if (!parsed.success) return { error: "Enter a valid email address." }
  const db = createSupabaseServiceClient()
  await db.from("email_suppressions").upsert({ email: parsed.data.toLowerCase() })
  redirect("/unsubscribe?done=1")
}
