"use client"

import { useActionState } from "react"
import { Button, ButtonLink } from "@/components/ui/button"
import { Field, FormError, FormSuccess } from "@/components/ui/field"
import { Textarea } from "@/components/ui/input"
import { applyToJob, type ApplyState } from "./actions"

export function ApplyForm({ jobId, jobSlug }: { jobId: string; jobSlug: string }) {
  const [state, formAction, isPending] = useActionState<ApplyState, FormData>(applyToJob, {})

  if (state.sent)
    return (
      <div className="flex flex-col items-start gap-4">
        <FormSuccess message="Your application has been sent. We have emailed you a copy." />
        <ButtonLink href="/applications" variant="secondary">
          View applications
        </ButtonLink>
      </div>
    )

  return (
    <form action={formAction} className="flex w-full max-w-form flex-col gap-4">
      <FormError message={state.error} />
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="jobSlug" value={jobSlug} />
      <Field label="Short message" htmlFor="message" optional>
        <Textarea id="message" name="message" rows={3} maxLength={500} />
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending" : "Apply"}
      </Button>
    </form>
  )
}
