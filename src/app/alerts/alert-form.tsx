"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError, FormSuccess } from "@/components/ui/field"
import { Checkbox, Input, Select } from "@/components/ui/input"
import { WORK_TYPES } from "@/lib/constants"
import { saveAlert, type AlertState } from "./actions"

export function AlertForm({ defaultPostcode }: { defaultPostcode: string }) {
  const [state, formAction, isPending] = useActionState<AlertState, FormData>(saveAlert, {})

  return (
    <form action={formAction} className="flex w-full max-w-form flex-col gap-6">
      <FormError message={state.error} />
      {state.saved ? <FormSuccess message="Alert saved. We will email matching jobs." /> : null}
      <Field label="Postcode" htmlFor="postcode">
        <Input id="postcode" name="postcode" required defaultValue={defaultPostcode} />
      </Field>
      <Field label="Radius" htmlFor="radius">
        <Select id="radius" name="radius" defaultValue="50">
          <option value="25">25 km</option>
          <option value="50">50 km</option>
          <option value="100">100 km</option>
        </Select>
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend>Work type</legend>
        {Object.entries(WORK_TYPES).map(function renderType([value, label]) {
          return (
            <label key={value} className="flex min-h-11 items-center gap-2">
              <Checkbox name="workTypes" value={value} />
              {label}
            </label>
          )
        })}
      </fieldset>
      <Field label="Frequency" htmlFor="frequency">
        <Select id="frequency" name="frequency" defaultValue="daily">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </Select>
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving" : "Save alert"}
      </Button>
    </form>
  )
}
