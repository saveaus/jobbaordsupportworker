import { NextResponse } from "next/server"
import { recordJobView } from "@/lib/views"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as { providerId?: string }
  if (body.providerId) await recordJobView(id, body.providerId)
  return NextResponse.json({ ok: true })
}
