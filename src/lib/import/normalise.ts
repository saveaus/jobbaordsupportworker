/**
 * Provider name and import key normalisation, shared by provider
 * registration, the CSV importer and claim matching.
 */
export function normaliseProviderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(pty\.?\s*ltd\.?|proprietary limited|limited|ltd\.?|inc\.?|incorporated|co\.?)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Dedupe key: normalised title + provider + suburb. */
export function buildImportKey(title: string, provider: string, suburb: string): string {
  const clean = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()
  return [clean(title), normaliseProviderName(provider), clean(suburb)].join("|")
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "outlook.com.au",
  "hotmail.com",
  "hotmail.com.au",
  "live.com",
  "live.com.au",
  "yahoo.com",
  "yahoo.com.au",
  "icloud.com",
  "me.com",
  "bigpond.com",
  "bigpond.net.au",
  "optusnet.com.au",
  "protonmail.com",
  "proton.me",
  "aol.com",
  "mail.com",
])

export function isFreeEmailDomain(domain: string): boolean {
  return FREE_EMAIL_DOMAINS.has(domain.toLowerCase())
}

/**
 * Claim routing: auto-approve only when the claimant's email domain
 * matches the provider's website domain and is not a free-mail domain.
 */
export function shouldAutoApproveClaim(
  claimantEmail: string,
  providerWebsiteDomain: string | null
): boolean {
  const domain = claimantEmail.split("@")[1]?.toLowerCase()
  if (!domain || isFreeEmailDomain(domain)) return false
  if (!providerWebsiteDomain) return false
  const website = providerWebsiteDomain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
  return domain === website || domain.endsWith(`.${website}`) || website.endsWith(`.${domain}`)
}
