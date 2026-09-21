import type { Metadata } from "next"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = { title: "Contact" }

export default function ContactPage() {
  return (
    <div className="flex max-w-prose flex-col gap-4">
      <h1 className="text-h1">Contact</h1>
      <p>
        Email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`} className="underline">
          {siteConfig.contactEmail}
        </a>
        .
      </p>
      <p className="text-sm text-muted">
        Recruitment and labour-hire agencies are not on this plan. Use this address
        to ask about an agency arrangement, or to request removal of an imported
        listing.
      </p>
    </div>
  )
}
