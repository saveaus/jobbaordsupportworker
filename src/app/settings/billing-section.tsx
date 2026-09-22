import { ButtonLink } from "@/components/ui/button"
import { formatDate } from "@/lib/format"

export function BillingSection({
  status,
  trialEnd,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  checkoutOk,
}: {
  status: string | null
  trialEnd: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  checkoutOk: boolean
}) {
  const isPastDue = status === "past_due"

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">Billing</h2>
      {isPastDue ? (
        <p className="text-error">Payment failed. Update your card to keep jobs live.</p>
      ) : null}
      {!status ? (
        <>
          <p>Start a trial to post jobs.</p>
          <ButtonLink href="/jobs/new">Post a job</ButtonLink>
        </>
      ) : (
        <>
          <p className="font-mono text-sm text-night-25">
            {status}
            {trialEnd ? ` · trial ends ${formatDate(new Date(trialEnd))}` : ""}
            {currentPeriodEnd
              ? ` · period ends ${formatDate(new Date(currentPeriodEnd))}`
              : ""}
          </p>
          {cancelAtPeriodEnd ? (
            <p>Cancellation is scheduled. Jobs stay live until the period ends.</p>
          ) : null}
          <ButtonLink href="/billing/portal" variant="secondary">
            Manage billing
          </ButtonLink>
        </>
      )}
      {checkoutOk ? <p>Your trial is active.</p> : null}
    </section>
  )
}
