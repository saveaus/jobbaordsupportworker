"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Field, FormError } from "@/components/ui/field"
import { Checkbox, Input } from "@/components/ui/input"
import { Turnstile } from "@/components/turnstile"
import { registerProvider, type RegisterState } from "./actions"

export function RegisterForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(
    registerProvider,
    {}
  )
  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex w-full max-w-form flex-col gap-6">
      <FormError message={state.error} />
      <Field label="Business name" htmlFor="businessName" error={errors.businessName}>
        <Input id="businessName" name="businessName" required hasError={!!errors.businessName} />
      </Field>
      <Field
        label="ABN"
        htmlFor="abn"
        error={errors.abn}
        help="11 digits. One account per ABN."
      >
        <Input
          id="abn"
          name="abn"
          required
          inputMode="numeric"
          autoComplete="off"
          hasError={!!errors.abn}
        />
      </Field>
      <Field label="Contact name" htmlFor="contactName" error={errors.contactName}>
        <Input id="contactName" name="contactName" required hasError={!!errors.contactName} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          hasError={!!errors.email}
        />
      </Field>
      <Field label="Phone" htmlFor="phone" error={errors.phone}>
        <Input id="phone" name="phone" type="tel" required hasError={!!errors.phone} />
      </Field>

      <div className="flex flex-col gap-2">
        <label className="flex min-h-11 items-start gap-2 pt-3">
          <Checkbox name="isEmployer" className="mt-1" />
          <span>We are the employer for the jobs we post.</span>
        </label>
        {errors.isEmployer ? <p className="text-sm text-error">{errors.isEmployer}</p> : null}
        <p className="text-sm text-muted">
          Recruitment and labour-hire agencies are not allowed on this plan.{" "}
          <Link href="/contact" className="underline">
            Agency? Contact us.
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex min-h-11 items-start gap-2 pt-3">
          <Checkbox name="consent" className="mt-1" />
          <span>
            I agree to the{" "}
            <Link href="/privacy" className="underline">
              privacy policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="underline">
              terms
            </Link>
            .
          </span>
        </label>
        {errors.consent ? <p className="text-sm text-error">{errors.consent}</p> : null}
      </div>

      <Turnstile />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating account" : "Continue"}
      </Button>
      <p className="text-sm text-muted">
        Next: write the job, then start the 14-day trial. $249 a month plus GST
        after. Cancel anytime.
      </p>
    </form>
  )
}
