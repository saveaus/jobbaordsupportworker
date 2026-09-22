"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError } from "@/components/ui/field"
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input"
import {
  AU_STATES,
  REQUIREMENTS,
  ROLE_CATEGORIES,
  SHIFT_TYPES,
  WORK_TYPES,
} from "@/lib/constants"
import { createJobAction, type JobFormState } from "./actions"

export function JobForm({ requiresPayment = false }: { requiresPayment?: boolean }) {
  const [state, formAction, isPending] = useActionState<JobFormState, FormData>(
    createJobAction,
    {}
  )

  return (
    <form action={formAction} className="flex w-full flex-col gap-6" autoComplete="off">
      <FormError message={state.error} />

      <Field label="Job title" htmlFor="title" error={state.fieldErrors?.title}>
        <Input
          id="title"
          name="title"
          required
          autoFocus
          placeholder="Disability support worker"
          hasError={!!state.fieldErrors?.title}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Role" htmlFor="roleCategory">
          <Select id="roleCategory" name="roleCategory" required defaultValue="">
            <option value="" disabled>
              Choose
            </option>
            {Object.entries(ROLE_CATEGORIES).map(function renderCat([value, label]) {
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            })}
          </Select>
        </Field>
        <Field label="Work type" htmlFor="workType">
          <Select id="workType" name="workType" required defaultValue="casual">
            {Object.entries(WORK_TYPES).map(function renderType([value, label]) {
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            })}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-[1fr_5.5rem_5.5rem]">
        <Field label="Suburb" htmlFor="suburb" error={state.fieldErrors?.suburb}>
          <Input
            id="suburb"
            name="suburb"
            required
            placeholder="Fremantle"
            hasError={!!state.fieldErrors?.suburb}
          />
        </Field>
        <Field label="State" htmlFor="state">
          <Select id="state" name="state" required defaultValue="">
            <option value="" disabled>
              —
            </option>
            {AU_STATES.map(function renderState(value) {
              return (
                <option key={value} value={value}>
                  {value}
                </option>
              )
            })}
          </Select>
        </Field>
        <Field label="Postcode" htmlFor="postcode" error={state.fieldErrors?.postcode}>
          <Input
            id="postcode"
            name="postcode"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="6160"
            hasError={!!state.fieldErrors?.postcode}
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold">Pay per hour</legend>
        <div className="flex flex-wrap items-center gap-3">
          <PayInput
            id="payMin"
            name="payMin"
            placeholder="38"
            label="From, dollars per hour"
            hasError={!!state.fieldErrors?.payMin}
          />
          <span aria-hidden className="text-muted">
            –
          </span>
          <PayInput
            id="payMax"
            name="payMax"
            placeholder="45"
            label="To, dollars per hour"
            hasError={!!state.fieldErrors?.payMax}
          />
        </div>
        {state.fieldErrors?.payMin ? (
          <p className="text-sm text-error">{state.fieldErrors.payMin}</p>
        ) : null}
        {state.fieldErrors?.payMax ? (
          <p className="text-sm text-error">{state.fieldErrors.payMax}</p>
        ) : null}
        <input type="hidden" name="payPeriod" value="hour" />
      </fieldset>

      <CheckGroup legend="Shifts" name="shifts" options={SHIFT_TYPES} />
      <CheckGroup legend="Must hold" name="requirements" options={REQUIREMENTS} />

      <Field
        label="The work"
        htmlFor="description"
        error={state.fieldErrors?.description}
      >
        <Textarea
          id="description"
          name="description"
          required
          rows={6}
          placeholder="Two-person assist in a SIL house. Meal support and community access."
          hasError={!!state.fieldErrors?.description}
        />
      </Field>

      <div className="flex flex-col items-start gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving" : requiresPayment ? "Continue to payment" : "Post job"}
        </Button>
        {requiresPayment ? (
          <p className="text-sm text-muted">14 days free. Then $249 a month plus GST.</p>
        ) : null}
      </div>
    </form>
  )
}

function PayInput({
  id,
  name,
  placeholder,
  label,
  hasError,
}: {
  id: string
  name: string
  placeholder: string
  label: string
  hasError?: boolean
}) {
  return (
    <div
      className={`flex h-11 w-28 overflow-hidden rounded-sm border bg-paper ${hasError ? "border-error" : "border-line"}`}
    >
      <span aria-hidden className="flex items-center pl-3 text-muted">
        $
      </span>
      <input
        id={id}
        name={name}
        type="number"
        min="0"
        step="1"
        inputMode="decimal"
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={hasError || undefined}
        className="h-full min-w-0 w-full bg-transparent px-2 text-base text-ink placeholder:text-muted focus:outline-none"
      />
    </div>
  )
}

function CheckGroup({
  legend,
  name,
  options,
}: {
  legend: string
  name: string
  options: Record<string, string>
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-semibold">{legend}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(options).map(function renderOption([value, label]) {
          return (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-line bg-paper px-3 text-base has-[:checked]:border-night has-[:checked]:bg-panel"
            >
              <Checkbox name={name} value={value} />
              {label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
