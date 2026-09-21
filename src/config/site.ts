export const siteConfig = {
  /**
   * Working name — the final name is undecided (see DECISIONS.md).
   * Everything (logo, favicon letter, page titles, email footers) reads
   * from this constant so renaming is a one-line change.
   */
  name: "Supportwork",
  tagline: "Support work jobs. Every state.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.CONTACT_EMAIL ?? "contact@supportwork.au",
}
