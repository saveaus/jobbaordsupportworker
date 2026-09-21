import { cookies, headers } from "next/headers"
import { createHash } from "node:crypto"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

const VISITOR_COOKIE = "vid"
const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|headless/i

/**
 * Count a view once per visitor per job per day. Excludes known bots,
 * the job's own provider, and admins. Stored as a daily total, not a
 * row per view.
 */
export async function recordJobView(jobId: string, providerId: string) {
  const headerStore = await headers()
  const ua = headerStore.get("user-agent") ?? ""
  if (BOT_UA.test(ua)) return

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle()
    if (provider?.id === providerId) return

    const service = createSupabaseServiceClient()
    const { data: admin } = await service
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()
    if (admin) return
  }

  const cookieStore = await cookies()
  let visitorId = cookieStore.get(VISITOR_COOKIE)?.value
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    cookieStore.set(VISITOR_COOKIE, visitorId, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
      httpOnly: true,
    })
  }

  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" })
  const stamp = createHash("sha256").update(`${visitorId}:${jobId}:${day}`).digest("hex")
  const seenCookie = `v_${stamp.slice(0, 16)}`
  if (cookieStore.get(seenCookie)?.value) return
  cookieStore.set(seenCookie, "1", {
    maxAge: 60 * 60 * 24,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  })

  await supabase.rpc("increment_job_views", { p_job_id: jobId })
}
