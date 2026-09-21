import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { firstRelation } from "@/lib/relation"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 })

  const { data: application } = await supabase
    .from("applications")
    .select("id, access_expires_at, applicant_user_id, jobs(provider_id, providers(owner_user_id))")
    .eq("job_id", id)
    .eq("applicant_user_id", userId)
    .maybeSingle()

  if (!application) return NextResponse.json({ error: "not found" }, { status: 404 })
  if (application.access_expires_at && new Date(application.access_expires_at) <= new Date())
    return NextResponse.json({ error: "access expired" }, { status: 403 })

  const job = firstRelation(
    application.jobs as
      | { providers: { owner_user_id: string }[] | { owner_user_id: string } | null }[]
      | { providers: { owner_user_id: string }[] | { owner_user_id: string } | null }
      | null
  )
  const owner = firstRelation(job?.providers ?? null)
  if (owner?.owner_user_id !== user.id)
    return NextResponse.json({ error: "not allowed" }, { status: 403 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("cv_path")
    .eq("user_id", userId)
    .maybeSingle()
  if (!profile?.cv_path) return NextResponse.json({ error: "no cv" }, { status: 404 })

  const service = createSupabaseServiceClient()
  const { data, error } = await service.storage
    .from("cvs")
    .createSignedUrl(profile.cv_path, 60 * 5)
  if (error || !data) return NextResponse.json({ error: "could not create link" }, { status: 500 })

  return NextResponse.redirect(data.signedUrl)
}
