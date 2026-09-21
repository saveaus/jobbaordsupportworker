import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react"

/**
 * Plain table per the design brief: horizontal lines only, no zebra
 * stripes, left-aligned text, right-aligned numbers, 14px grey header.
 */
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full border-collapse text-base ${className ?? ""}`} {...props} />
}

interface CellProps {
  numeric?: boolean
}

export function Th({
  numeric,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <th
      scope="col"
      className={`border-b border-line py-3 pr-4 text-sm font-normal text-muted ${
        numeric ? "text-right tabular-nums" : "text-left"
      } ${className ?? ""}`}
      {...props}
    />
  )
}

export function Td({
  numeric,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <td
      className={`border-b border-line py-3 pr-4 align-top ${
        numeric ? "text-right tabular-nums" : "text-left"
      } ${className ?? ""}`}
      {...props}
    />
  )
}
