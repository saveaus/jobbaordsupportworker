import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"
import { PageNav } from "@/components/site/page-nav"

export const metadata: Metadata = { title: "Terms" }

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageNav backHref="/" backLabel="Back to jobs" />
      <LegalPage file="terms.md" />
    </div>
  )
}
