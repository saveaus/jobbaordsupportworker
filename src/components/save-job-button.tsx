import { signInPath } from "@/lib/account-kind"
import { toggleSavedJob } from "@/app/saved/actions"
import { IconBookmark } from "@/components/ui/icons"

export function SaveJobButton({
  jobId,
  saved,
  next,
  signedIn,
}: {
  jobId: string
  saved: boolean
  next: string
  signedIn: boolean
}) {
  const label = saved ? "Saved" : "Save"
  const className =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-night hover:bg-panel"

  if (!signedIn) {
    return (
      <a href={signInPath(next)} className={className} aria-label="Save job">
        <IconBookmark />
      </a>
    )
  }

  return (
    <form action={toggleSavedJob}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="next" value={next} />
      <button type="submit" className={className} aria-label={label} aria-pressed={saved}>
        <IconBookmark filled={saved} />
      </button>
    </form>
  )
}
