function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1"
}

function isLocalSiteUrl(url: string) {
  try {
    return isLocalHost(new URL(url).hostname)
  } catch {
    return /localhost|127\.0\.0\.1/.test(url)
  }
}

function withHttps(host: string) {
  const trimmed = host.replace(/\/$/, "")
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://"))
    return trimmed
  return `https://${trimmed}`
}

/**
 * Public origin for emails, Stripe, and metadata. Ignores a localhost
 * NEXT_PUBLIC_SITE_URL on Vercel so magic links do not send people
 * back to a local machine.
 */
export function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured && !isLocalSiteUrl(configured))
    return configured.replace(/\/$/, "")

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (production) return withHttps(production)

  if (process.env.VERCEL_URL) return withHttps(process.env.VERCEL_URL)

  return configured?.replace(/\/$/, "") || "http://localhost:3000"
}
