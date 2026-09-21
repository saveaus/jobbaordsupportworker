"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { unsubscribeByEmail, type UnsubState } from "./actions"

export function UnsubscribeForm() {
  const [state, formAction, isPending] = useActionState<UnsubState, FormData>(
    unsubscribeByEmail,
    {}
  )
  return (
    <form action={formAction} className="flex w-full max-w-form flex-col gap-6">
      <FormError message={state.error} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required />
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving" : "Unsubscribe"}
      </Button>
    </form>
  )
}
