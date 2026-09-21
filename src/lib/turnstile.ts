/**
 * Server-side Cloudflare Turnstile verification. When no secret is
 * configured (local development), verification passes.
 */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    }
  )
  if (!response.ok) return false
  const result = (await response.json()) as { success: boolean }
  return result.success
}
