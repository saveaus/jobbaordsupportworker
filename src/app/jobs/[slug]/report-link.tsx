"use client"

import { useActionState } from "react"
import { reportJob, type ReportState } from "./report-actions"

export function ReportLink({ jobId }: { jobId: string }) {
  const [state, formAction, isPending] = useActionState<ReportState, FormData>(reportJob, {})

  if (state.sent) return <p className="text-sm text-muted">Thanks. We will review this job.</p>
  if (state.error) return <p className="text-sm text-error">{state.error}</p>

  return (
    <form action={formAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center text-sm text-muted underline"
      >
        Report this job
      </button>
    </form>
  )
}
