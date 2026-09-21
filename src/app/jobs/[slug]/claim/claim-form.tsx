"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { FormError, FormSuccess } from "@/components/ui/field"
import { claimJob, type ClaimState } from "./actions"

export function ClaimForm({ jobId, slug }: { jobId: string; slug: string }) {
  const [state, formAction, isPending] = useActionState<ClaimState, FormData>(claimJob, {})
  if (state.autoApproved)
    return <FormSuccess message="Claim approved. Applications for this job now come to you." />
  if (state.queued)
    return (
      <FormSuccess message="Your claim is with an admin for review. The listing stays as a link-out until then." />
    )
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="slug" value={slug} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending" : "Claim your listing"}
      </Button>
    </form>
  )
}
