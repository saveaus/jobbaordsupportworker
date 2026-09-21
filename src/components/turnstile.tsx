"use client"

import Script from "next/script"

/**
 * Invisible Cloudflare Turnstile widget. Renders nothing when no site
 * key is configured (local development). The token is submitted in the
 * cf-turnstile-response form field.
 */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  if (!siteKey) return null
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <div className="cf-turnstile" data-sitekey={siteKey} data-size="invisible" />
    </>
  )
}
