import type { Metadata } from "next"
import { PageNav } from "@/components/site/page-nav"
import { JobForm } from "../job-form"
import { requireProviderForPost } from "../require-provider"

export const metadata: Metadata = { title: "Write the listing" }

export default async function WriteJobPage() {
  const { requiresPayment } = await requireProviderForPost("/jobs/new/write")

  return (
    <div className="flex max-w-form flex-col gap-6">
      <PageNav backHref="/jobs/new" backLabel="Back" />
      <h1 className="text-h1">Write the listing</h1>
      <JobForm requiresPayment={requiresPayment} />
    </div>
  )
}
