import { createHmac } from "node:crypto"
import { Resend } from "resend"
import { siteConfig } from "@/config/site"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

const secret = () => process.env.CRON_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev"

export function unsubscribeToken(email: string): string {
  const hmac = createHmac("sha256", secret()).update(email.toLowerCase()).digest("hex").slice(0, 24)
  return Buffer.from(JSON.stringify({ e: email.toLowerCase(), h: hmac })).toString("base64url")
}

export function parseUnsubscribeToken(token: string): string | null {
  try {
    const { e, h } = JSON.parse(Buffer.from(token, "base64url").toString()) as {
      e: string
      h: string
    }
    const expected = createHmac("sha256", secret()).update(e.toLowerCase()).digest("hex").slice(0, 24)
    if (h !== expected) return null
    return e
  } catch {
    return null
  }
}

export function unsubscribeUrl(email: string): string {
  return `${siteConfig.url}/unsubscribe?token=${unsubscribeToken(email)}`
}

interface SendInput {
  to: string
  subject: string
  template: string
  relatedId?: string
  html: string
  from?: "transactional" | "alerts"
  /** Auth and billing notices are never suppressed. */
  essential?: boolean
}

/**
 * Idempotent send: unique (recipient, template, related_id, AEST date)
 * in email_log. Honours the suppression list except for essential mail.
 */
export async function sendEmail({
  to,
  subject,
  template,
  relatedId = "",
  html,
  from = "transactional",
  essential = false,
}: SendInput): Promise<boolean> {
  const db = createSupabaseServiceClient()

  if (!essential) {
    const { data: suppressed } = await db
      .from("email_suppressions")
      .select("email")
      .eq("email", to.toLowerCase())
      .maybeSingle()
    if (suppressed) return false
  }

  const { error: logError } = await db.from("email_log").insert({
    recipient: to.toLowerCase(),
    template,
    related_id: relatedId,
  })
  if (logError) {
    if (logError.code === "23505") return false
    throw logError
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.info(`[email:${template}] ${to} — ${subject}`)
    return true
  }

  const fromAddress =
    from === "alerts"
      ? process.env.EMAIL_FROM_ALERTS ?? `${siteConfig.name} <alerts@localhost>`
      : process.env.EMAIL_FROM_TRANSACTIONAL ?? `${siteConfig.name} <no-reply@localhost>`

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
  })
  if (error) {
    console.error("Resend error", error)
    return false
  }
  return true
}

export function emailLayout(body: string, email: string): string {
  const unsub = unsubscribeUrl(email)
  return `<!doctype html>
<html lang="en-AU">
<body style="margin:0;padding:0;background:#F5F6FF;color:#0B110F;font-family:ui-sans-serif,system-ui,sans-serif;font-size:16px;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#FFFFFF;">
    <p style="margin:0 0 24px;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#55B216;">${siteConfig.name}</p>
    <div>${body}</div>
    <p style="margin-top:32px;font-size:14px;color:#4A5854;">
      Jobs listed. Providers verified.<br>
      <a href="${unsub}" style="color:#0B110F;">Unsubscribe or manage emails</a>
    </p>
  </div>
</body>
</html>`
}
