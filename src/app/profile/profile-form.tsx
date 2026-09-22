"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError, FormSuccess } from "@/components/ui/field"
import { Checkbox, Input, Textarea } from "@/components/ui/input"
import { WORK_TYPES } from "@/lib/constants"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { ProfileRecord } from "@/lib/types"
import { saveProfile, type ProfileState } from "./actions"

export function ProfileForm({
  email,
  profile,
  next,
}: {
  email: string
  profile: ProfileRecord | null
  next: string
}) {
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(saveProfile, {})
  const [cvName, setCvName] = useState(profile?.cv_path ? "CV on file" : "")

  async function handleCvChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setCvName("File is over 5MB.")
      return
    }
    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const { error } = await supabase.storage.from("cvs").upload(path, file, { upsert: true })
    if (error) {
      setCvName("Could not upload the CV.")
      return
    }
    const hidden = document.getElementById("cv_path") as HTMLInputElement | null
    if (hidden) hidden.value = path
    setCvName(file.name)
  }

  return (
    <form action={formAction} className="flex w-full max-w-form flex-col gap-6">
      <FormError message={state.error} />
      {state.saved ? <FormSuccess message="Your profile has been saved." /> : null}
      <input type="hidden" name="next" value={next} />
      <Field label="Name" htmlFor="fullName" error={state.fieldErrors?.fullName}>
        <Input
          id="fullName"
          name="fullName"
          required
          defaultValue={profile?.full_name ?? ""}
          hasError={!!state.fieldErrors?.fullName}
        />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required defaultValue={profile?.email ?? email} />
      </Field>
      <Field label="Postcode" htmlFor="postcode" error={state.fieldErrors?.postcode}>
        <Input
          id="postcode"
          name="postcode"
          required
          inputMode="numeric"
          defaultValue={profile?.postcode ?? ""}
          hasError={!!state.fieldErrors?.postcode}
        />
      </Field>
      <Field label="Phone" htmlFor="phone" optional>
        <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend>Work types wanted</legend>
        {Object.entries(WORK_TYPES).map(function renderType([value, label]) {
          return (
            <label key={value} className="flex min-h-11 items-center gap-2">
              <Checkbox
                name="workTypes"
                value={value}
                defaultChecked={profile?.work_types?.includes(value as never)}
              />
              {label}
            </label>
          )
        })}
      </fieldset>

      <Field label="About me" htmlFor="about" optional help="500 characters.">
        <Textarea id="about" name="about" maxLength={500} defaultValue={profile?.about ?? ""} rows={5} />
      </Field>

      <Field label="CV" htmlFor="cv" optional help="PDF or Word, 5MB.">
        <Input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx" onChange={handleCvChange} />
        {cvName ? <p className="text-sm text-muted">{cvName}</p> : null}
      </Field>
      <input id="cv_path" type="hidden" name="cvPath" defaultValue={profile?.cv_path ?? ""} />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving" : "Save profile"}
      </Button>
    </form>
  )
}
