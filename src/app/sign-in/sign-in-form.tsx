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
      <div className="flex w-full max-w-form flex-col gap-6">
        <p>
          We emailed {state.email}. Open the link and tap Sign in, or enter the
          6-digit code from the email.
        </p>
        <form action="/auth/callback" method="post" className="flex flex-col gap-6">
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="next" value={state.next ?? next} />
          <Field label="Code" htmlFor="token">
            <Input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="000000"
            />
          </Field>
          <Button type="submit">Sign in with code</Button>
        </form>
      </div>
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
        No passwords. We email a link and a 6-digit code.
      </p>
    </div>
  )
}
