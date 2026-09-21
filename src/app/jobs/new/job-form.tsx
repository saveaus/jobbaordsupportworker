"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError } from "@/components/ui/field"
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input"
import { AU_STATES, REQUIREMENTS, ROLE_CATEGORIES, WORK_TYPES } from "@/lib/constants"
import { createJobAction, type JobFormState } from "./actions"

export function JobForm() {
  const [state, formAction, isPending] = useActionState<JobFormState, FormData>(
    createJobAction,
    {}
  )
  const [preview, setPreview] = useState(false)
  const [draft, setDraft] = useState({
    title: "",
    suburb: "",
    state: "",
    workType: "",
    description: "",
  })

  if (preview) {
    return (
      <div className="flex max-w-prose flex-col gap-6">
        <h2 className="text-h2">{draft.title || "Untitled job"}</h2>
        <p>
          {draft.suburb}
          {draft.state ? `, ${draft.state}` : ""} · {draft.workType}
        </p>
        <p className="whitespace-pre-wrap">{draft.description}</p>
        <Button type="button" variant="secondary" onClick={() => setPreview(false)}>
          Back to edit
        </Button>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex w-full max-w-form flex-col gap-6">
      <FormError message={state.error} />
      <Field label="Job title" htmlFor="title" error={state.fieldErrors?.title}>
        <Input
          id="title"
          name="title"
          required
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
      </Field>
      <Field label="Role category" htmlFor="roleCategory">
        <Select id="roleCategory" name="roleCategory" required defaultValue="">
          <option value="" disabled>
            Choose a category
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
      <Field label="Suburb" htmlFor="suburb">
        <Input
          id="suburb"
          name="suburb"
          required
          onChange={(e) => setDraft({ ...draft, suburb: e.target.value })}
        />
      </Field>
      <Field label="State" htmlFor="state">
        <Select
          id="state"
          name="state"
          required
          defaultValue=""
          onChange={(e) => setDraft({ ...draft, state: e.target.value })}
        >
          <option value="" disabled>
            Choose a state
          </option>
          {AU_STATES.map(function renderState(value) {
            return <option key={value}>{value}</option>
          })}
        </Select>
      </Field>
      <Field label="Postcode" htmlFor="postcode">
        <Input id="postcode" name="postcode" required inputMode="numeric" />
      </Field>
      <Field label="Work type" htmlFor="workType">
        <Select
          id="workType"
          name="workType"
          required
          defaultValue=""
          onChange={(e) => setDraft({ ...draft, workType: e.target.value })}
        >
          <option value="" disabled>
            Choose a work type
          </option>
          {Object.entries(WORK_TYPES).map(function renderType([value, label]) {
            return (
              <option key={value} value={value}>
                {label}
              </option>
            )
          })}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pay min" htmlFor="payMin" optional>
          <Input id="payMin" name="payMin" type="number" min="0" step="0.01" />
        </Field>
        <Field label="Pay max" htmlFor="payMax" optional>
          <Input id="payMax" name="payMax" type="number" min="0" step="0.01" />
        </Field>
      </div>
      <Field label="Pay period" htmlFor="payPeriod" optional>
        <Select id="payPeriod" name="payPeriod" defaultValue="hour">
          <option value="hour">Per hour</option>
          <option value="year">Per year</option>
        </Select>
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend>Requirements</legend>
        {Object.entries(REQUIREMENTS).map(function renderReq([value, label]) {
          return (
            <label key={value} className="flex min-h-11 items-center gap-2">
              <Checkbox name="requirements" value={value} />
              {label}
            </label>
          )
        })}
      </fieldset>
      <Field label="Description" htmlFor="description" help="Headings and bullets only.">
        <Textarea
          id="description"
          name="description"
          required
          rows={10}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </Field>
      <Field label="Number of positions" htmlFor="positions">
        <Input id="positions" name="positions" type="number" min="1" defaultValue="1" />
      </Field>
      <div className="flex flex-wrap gap-4">
        <Button type="button" variant="secondary" onClick={() => setPreview(true)}>
          Preview
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Publishing" : "Publish"}
        </Button>
      </div>
    </form>
  )
}
