/**
 * Static grey placeholder lines in the shape of content. No spinners,
 * no pulse animation (animations are banned by the design brief).
 */
export function SkeletonLine({ className }: { className?: string }) {
  return <div aria-hidden className={`h-4 rounded-sm bg-panel ${className ?? ""}`} />
}

export function SkeletonJobRow() {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-5">
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-1/2" />
      <SkeletonLine className="w-1/3" />
    </div>
  )
}

export function SkeletonJobList({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-label="Loading" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonJobRow key={index} />
      ))}
    </div>
  )
}
