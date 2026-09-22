import type { ReactNode } from "react"
import Link from "next/link"
import { formatLocation, formatPay, formatPostedDate } from "@/lib/format"
import { Chip } from "@/components/ui/chip"

export interface JobCardData {
  href: string
  title: string
  providerName: string
  suburb: string
  state: string
  workType: string
  payMin?: number | null
  payMax?: number | null
  payPeriod?: "hour" | "year" | null
  postedAt: Date
  sourceName?: string | null
}

export function JobCard({
  job,
  selected = false,
  action,
}: {
  job: JobCardData
  selected?: boolean
  action?: ReactNode
}) {
  const pay = formatPay(job)
  return (
    <div
      className={`flex rounded-sm border ${
        selected ? "border-night bg-panel" : "border-line hover:border-night"
      }`}
    >
      <Link
        href={job.href as never}
        aria-current={selected ? "true" : undefined}
        className="flex min-w-0 flex-1 flex-col gap-2 p-4"
      >
        <span className="line-clamp-2 font-semibold" title={job.title}>
          {job.title}
        </span>
        <span>{job.providerName}</span>
        <span className="text-sm text-muted">{formatLocation(job.suburb, job.state)}</span>
        <span className="flex flex-wrap gap-2">
          {pay ? <Chip>{pay}</Chip> : null}
          <Chip>{job.workType}</Chip>
        </span>
        <span className="text-sm text-muted">
          {formatPostedDate(job.postedAt)}
          {job.sourceName ? ` · via ${job.sourceName}` : ""}
        </span>
      </Link>
      {action ? <div className="shrink-0 self-start p-1">{action}</div> : null}
    </div>
  )
}
