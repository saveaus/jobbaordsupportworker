"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Turnstile } from "@/components/turnstile"
import { sendMagicLink, type SignInState } from "@/app/sign-in/actions"

/**
 * Plain panel under the first 10 results for signed-out visitors.
 * No pop-ups, no modals. The server never sends more than 10 rows.
 */
export function TeaserPanel({ totalCount }: { totalCount: number }) {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    sendMagicLink,
    {}
  )

  return (
    <div className="border-t border-line bg-panel px-6 py-8">
      {state.sent ? (
        <p>We&apos;ve emailed a sign-in link to {state.email}. Open it to see every job.</p>
      ) : (
        <form action={formAction} className="flex max-w-form flex-col gap-4">
          <p className="font-semibold">
            Sign up free to see all {totalCount.toLocaleString("en-AU")} jobs
          </p>
          <FormError message={state.error} />
          <label htmlFor="teaser-email" className="sr-only">
            Email
          </label>
          <Input
            id="teaser-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com.au"
            autoComplete="email"
          />
          <input type="hidden" name="next" value="/" />
          <Turnstile />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending link" : "Sign up free"}
          </Button>
        </form>
      )}
    </div>
  )
}
