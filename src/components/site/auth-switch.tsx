import Link from "next/link"
import { createAccountPath, signInPath } from "@/lib/account-kind"

export function AuthSwitch({
  mode,
  next,
}: {
  mode: "sign-in" | "create-account"
  next: string
}) {
  if (mode === "sign-in")
    return (
      <p className="text-sm text-muted">
        No account?{" "}
        <Link href={createAccountPath(next)} className="underline">
          Create account
        </Link>
      </p>
    )

  return (
    <p className="text-sm text-muted">
      Already have an account?{" "}
      <Link href={signInPath(next)} className="underline">
        Sign in
      </Link>
    </p>
  )
}
