import { Button } from "@/components/ui/button"
import { startCheckout } from "@/app/billing/actions"

export function PayToPublish({
  jobId,
  compact = false,
}: {
  jobId: string
  compact?: boolean
}) {
  return (
    <form action={startCheckout}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="interval" value="month" />
      {compact ? (
        <button type="submit" className="text-base underline">
          Pay to publish
        </button>
      ) : (
        <Button type="submit">Pay to publish</Button>
      )}
    </form>
  )
}
