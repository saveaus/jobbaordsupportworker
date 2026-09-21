import { SkeletonJobList } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-4 w-64 bg-panel" />
      <SkeletonJobList rows={6} />
    </div>
  )
}
