"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Turnstile } from "@/components/turnstile"
import { createAccount, type CreateAccountState } from "./actions"

export function CreateAccountForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState<CreateAccountState, FormData>(
    createAccount,
    {}
  )

  if (state.sent)
    return (
      <p className="max-w-prose">
        We emailed {state.email}. Open the link to confirm the account, then
        choose apply or hire.
      </p>
    )

  return (
    <form action={formAction} className="flex w-full max-w-form flex-col gap-6">
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
      <Field label="Password" htmlFor="password" help="At least 8 characters.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>
      <input type="hidden" name="next" value={next} />
      <Turnstile />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating account" : "Create account"}
      </Button>
    </form>
  )
}
