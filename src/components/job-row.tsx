import Link from "next/link"
import Image from "next/image"
import { formatLocation, formatPay, formatPostedDate } from "@/lib/format"

export interface JobRowData {
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
  logoUrl?: string | null
  sourceName?: string | null
}

/**
 * Single-column job row per the brief: title (600) / provider /
 * suburb, state / work type / pay if given / posted date. 40px logo
 * left if available, otherwise nothing. Whole row clickable, 1px line
 * below, 20px vertical padding, #F7F7F7 hover.
 */
export function JobRow({ job }: { job: JobRowData }) {
  const pay = formatPay(job)
  return (
    <Link
      href={job.href as never}
      className="flex gap-4 border-b border-line px-2 py-5 hover:bg-panel"
    >
      {job.logoUrl ? (
        <Image
          src={job.logoUrl}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-sm object-contain"
        />
      ) : null}
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-semibold">{job.title}</span>
        <span>
          {job.providerName} · {formatLocation(job.suburb, job.state)}
        </span>
        <span>
          {job.workType}
          {pay ? ` · ${pay}` : ""}
        </span>
        <span className="text-sm text-muted">
          {formatPostedDate(job.postedAt)}
          {job.sourceName ? ` · via ${job.sourceName}` : ""}
        </span>
      </span>
    </Link>
  )
}
