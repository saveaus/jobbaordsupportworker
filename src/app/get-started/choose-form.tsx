"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ChooseForm({
  next,
  intent,
}: {
  next: string
  intent: "apply" | "hire"
}) {
  const [pending, setPending] = useState(false)
  const hireFirst = intent === "hire"

  function handleSubmit() {
    setPending(true)
  }

  const apply = (
    <form
      action="/get-started/choose"
      method="post"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="kind" value="applicant" />
      <div className="flex flex-col gap-3 border border-line p-6">
        <h2 className="text-h2">Apply for jobs</h2>
        <p>Build a profile. Apply. Start.</p>
        <Button type="submit" variant={hireFirst ? "secondary" : "primary"} disabled={pending}>
          {pending ? "Continuing" : "I want to apply"}
        </Button>
      </div>
    </form>
  )

  const hire = (
    <form
      action="/get-started/choose"
      method="post"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="kind" value="provider" />
      <div className="flex flex-col gap-3 border border-line p-6">
        <h2 className="text-h2">Hire support workers</h2>
        <p>Post jobs. Review applicants.</p>
        <Button type="submit" variant={hireFirst ? "primary" : "secondary"} disabled={pending}>
          {pending ? "Continuing" : "I want to hire"}
        </Button>
      </div>
    </form>
  )

  return (
    <div className="grid max-w-page gap-4 md:grid-cols-2">
      {hireFirst ? hire : apply}
      {hireFirst ? apply : hire}
    </div>
  )
}
