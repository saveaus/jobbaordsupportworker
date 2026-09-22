import { ButtonLink } from "@/components/ui/button"
import { createAccountPath } from "@/lib/account-kind"

/**
 * Plain panel under the first 10 results for signed-out visitors.
 * No pop-ups, no modals. The server never sends more than 10 rows.
 */
export function TeaserPanel({ totalCount }: { totalCount: number }) {
  return (
    <div className="border-t border-line bg-slate-20 px-6 py-8">
      <div className="flex max-w-form flex-col gap-4">
        <p className="font-semibold">
          Create a free account to see all {totalCount.toLocaleString("en-AU")} jobs
        </p>
        <p>Then choose to apply or hire.</p>
        <ButtonLink href={createAccountPath("/")}>Create account</ButtonLink>
      </div>
    </div>
  )
}
