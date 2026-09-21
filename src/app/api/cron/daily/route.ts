import { NextResponse } from "next/server"
import { runDailyCron } from "@/lib/cron/daily"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get("authorization") ?? request.headers.get("x-cron-secret")
  const token = header?.replace(/^Bearer\s+/i, "")
  if (!secret || token !== secret)
    return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  await runDailyCron()
  return NextResponse.json({ ok: true })
}
