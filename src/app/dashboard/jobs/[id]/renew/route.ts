import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    redirect(`/sign-in?next=/dashboard/jobs/${id}/renew`)
  await supabase.rpc("renew_job", { p_job_id: id })
  redirect("/dashboard")
}
