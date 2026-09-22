import type { ReactNode } from "react"
import { REQUIREMENTS, ROLE_CATEGORIES, WORK_TYPES } from "@/lib/constants"
import { formatLocation, formatPay, formatPostedDate } from "@/lib/format"
import { decodeJobDescription } from "@/lib/job-copy"
import { renderDescription } from "@/lib/markdown"
import type { JobRecord } from "@/lib/types"
import { Chip } from "@/components/ui/chip"

export function JobDetails({
  job,
  apply,
  headingLevel = "h2",
}: {
  job: JobRecord
  apply?: ReactNode
  headingLevel?: "h1" | "h2"
}) {
  const pay = formatPay({
    payMin: job.pay_min,
    payMax: job.pay_max,
    payPeriod: job.pay_period,
  })
  const { shifts, body } = decodeJobDescription(job.description)
  const requirements = job.requirements ?? []
  const shiftList = shifts
    ? shifts.split(",").map(function trimShift(value) {
        return value.trim()
      })
    : []
  const Heading = headingLevel

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col items-start gap-3">
        <Heading className="text-h1">{job.title}</Heading>
        <p>{job.provider_name}</p>
        <p>{formatLocation(job.suburb, job.state)}</p>
        <div className="flex flex-wrap gap-2">
          {pay ? <Chip>{pay}</Chip> : null}
          <Chip>{WORK_TYPES[job.work_type]}</Chip>
        </div>
        <p className="text-sm text-muted">
          {job.published_at ? formatPostedDate(new Date(job.published_at)) : null}
          {job.source === "imported" && job.source_name ? ` · via ${job.source_name}` : ""}
        </p>
        {apply}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2">Job details</h2>
        {pay ? (
          <DetailRow label="Pay">
            <Chip>{pay}</Chip>
          </DetailRow>
        ) : null}
        <DetailRow label="Job type">
          <Chip>{WORK_TYPES[job.work_type]}</Chip>
        </DetailRow>
        <DetailRow label="Role">
          <Chip>{ROLE_CATEGORIES[job.role_category]}</Chip>
        </DetailRow>
        {shiftList.length > 0 ? (
          <DetailRow label="Shifts">
            <span className="flex flex-wrap gap-2">
              {shiftList.map(function renderShift(shift) {
                return <Chip key={shift}>{shift}</Chip>
              })}
            </span>
          </DetailRow>
        ) : null}
      </section>

      {requirements.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-h2">Requirements</h2>
          <div className="flex flex-wrap gap-2">
            {requirements.map(function renderRequirement(code) {
              return <Chip key={code}>{REQUIREMENTS[code]}</Chip>
            })}
          </div>
        </section>
      ) : null}

      {body ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-h2">The work</h2>
          <div
            className="flex flex-col gap-4"
            dangerouslySetInnerHTML={{ __html: renderDescription(body) }}
          />
        </section>
      ) : null}
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-muted">{label}</p>
      {children}
    </div>
  )
}
