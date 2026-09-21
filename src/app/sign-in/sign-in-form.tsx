"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Turnstile } from "@/components/turnstile"
import { sendMagicLink, type SignInState } from "./actions"

export function SignInForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    sendMagicLink,
    {}
  )

  if (state.sent)
    return (
      <p>
        We&apos;ve emailed a sign-in link to {state.email}. Open it on this device to
        continue.
      </p>
    )

  return (
    <div className="flex w-full max-w-form flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6">
        <FormError message={state.error} />
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com.au"
          />
        </Field>
        <input type="hidden" name="next" value={next} />
        <Turnstile />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending link" : "Email me a sign-in link"}
        </Button>
      </form>
      <p className="text-sm text-muted">
        No passwords. We&apos;ll email you a link that signs you in.
      </p>
    </div>
  )
}
