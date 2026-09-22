import { verificationLabel } from "@/lib/verification"

export function VerifiedScore({ percent }: { percent: number }) {
  return (
    <p className="font-mono text-sm text-night-25" aria-label={verificationLabel(percent)}>
      {verificationLabel(percent)}
    </p>
  )
}
