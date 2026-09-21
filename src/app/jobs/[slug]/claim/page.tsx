import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getProviderForUser } from "@/lib/queries/provider"
import { ClaimForm } from "./claim-form"
import type { AppPageProps } from "@/lib/page-props"

export const metadata: Metadata = { title: "Claim this listing" }

export default async function ClaimPage({ params }: AppPageProps) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, suburb, state, source, provider_id, provider_name")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle()
  if (!job || job.source !== "imported") notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/jobs/${slug}/claim`)

  const provider = await getProviderForUser(supabase)
  if (!provider) redirect("/providers/register")

  return (
    <div className="flex max-w-form flex-col gap-8">
      <h1 className="text-h1">Claim this listing</h1>
      <p>
        {job.title} in {job.suburb}, {job.state}, listed as {job.provider_name}.
      </p>
      <ClaimForm jobId={job.id} slug={slug} />
    </div>
  )
}
