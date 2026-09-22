"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { REQUIREMENTS, type RequirementCode } from "@/lib/constants"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { RequirementCheck } from "@/lib/verification"
import { submitRequirementCheck, type CheckState } from "./check-actions"

const STATUS_COPY: Record<string, string> = {
  pending: "In review",
  verified: "Verified",
  rejected: "Needs a new file",
}

export function RequirementChecks({
  checks,
}: {
  checks: RequirementCheck[]
}) {
  const byCode = new Map(checks.map((check) => [check.requirement, check]))

  return (
    <section className="flex max-w-form flex-col gap-6">
      <h2 className="text-h2">Requirements</h2>
      <p className="max-w-prose">
        Upload evidence for each check. We mark it verified after review.
        Providers see the verified score after you apply.
      </p>
      <ul className="flex flex-col gap-8">
        {(Object.keys(REQUIREMENTS) as RequirementCode[]).map(function renderRow(code) {
          return (
            <li key={code} className="flex flex-col gap-3 border-t border-line pt-6">
              <RequirementRow
                code={code}
                check={byCode.get(code) ?? null}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function RequirementRow({
  code,
  check,
}: {
  code: RequirementCode
  check: RequirementCheck | null
}) {
  const [state, formAction, isPending] = useActionState<CheckState, FormData>(
    submitRequirementCheck,
    {}
  )
  const [fileName, setFileName] = useState("")
  const [path, setPath] = useState(check?.evidence_path ?? "")
  const locked = check?.status === "verified"

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setFileName("File is over 5MB.")
      return
    }
    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const nextPath = `${user.id}/${code}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const { error } = await supabase.storage
      .from("requirement-evidence")
      .upload(nextPath, file, { upsert: true })
    if (error) {
      setFileName("Could not upload that file.")
      return
    }
    setPath(nextPath)
    setFileName(file.name)
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{REQUIREMENTS[code]}</p>
        <p className="font-mono text-sm text-night-25">
          {check ? STATUS_COPY[check.status] : "Not submitted"}
        </p>
      </div>
      {check?.status === "rejected" && check.review_note ? (
        <p className="text-sm text-error">{check.review_note}</p>
      ) : null}
      <FormError message={state.error} />
      {locked ? null : (
        <>
          <Field label="Evidence" htmlFor={`file-${code}`} help="PDF, Word or image. 5MB.">
            <Input
              id={`file-${code}`}
              name="file"
              type="file"
              accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
            {fileName ? <p className="text-sm text-muted">{fileName}</p> : null}
          </Field>
          <input type="hidden" name="requirement" value={code} />
          <input type="hidden" name="evidencePath" value={path} />
          <Button type="submit" variant="secondary" disabled={isPending || !path}>
            {isPending ? "Submitting" : "Submit for review"}
          </Button>
        </>
      )}
    </form>
  )
}
