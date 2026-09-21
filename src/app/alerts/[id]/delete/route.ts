import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/sign-in", request.url))
  await supabase.from("job_alerts").delete().eq("id", id).eq("user_id", user.id)
  return NextResponse.redirect(new URL("/alerts", request.url))
}
