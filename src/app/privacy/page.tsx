import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "Privacy" }

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <LegalPage file="privacy.md" />
    </div>
  )
}
