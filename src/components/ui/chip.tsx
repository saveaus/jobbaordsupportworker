import type { ReactNode } from "react"

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center rounded-sm border border-line bg-panel px-2 text-sm">
      {children}
    </span>
  )
}
