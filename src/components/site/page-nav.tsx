import Link from "next/link"
import { IconChevronDown } from "@/components/ui/icons"

export function PageNav({
  backHref,
  backLabel = "Back",
  className,
}: {
  backHref: string
  backLabel?: string
  className?: string
}) {
  return (
    <Link
      href={backHref}
      className={`inline-flex min-h-11 w-fit items-center gap-2 text-sm hover:underline ${className ?? "text-muted hover:text-ink"}`}
    >
      <IconChevronDown className="-rotate-90" />
      {backLabel}
    </Link>
  )
}
