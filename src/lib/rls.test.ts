import { describe, expect, it } from "vitest"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const configured = Boolean(url && anon && service)

/**
 * These tests prove a different user is refused by RLS. They skip when
 * no local Supabase is configured so `npm test` still passes in CI
 * without secrets.
 */
describe.skipIf(!configured)("RLS refusals", () => {
  function admin() {
    return createClient(url!, service!, { auth: { persistSession: false } })
  }
  function anonClient() {
    return createClient(url!, anon!, { auth: { persistSession: false } })
  }

  it("refuses a second user reading someone else's profile", async () => {
    const a = await admin().auth.admin.createUser({
      email: `rls-a-${Date.now()}@example.com`,
      email_confirm: true,
    })
    const b = await admin().auth.admin.createUser({
      email: `rls-b-${Date.now()}@example.com`,
      email_confirm: true,
    })
    if (!a.data.user || !b.data.user) throw new Error("could not create users")

    await admin().from("profiles").insert({
      user_id: a.data.user.id,
      full_name: "Rls Applicant",
      email: a.data.user.email,
      postcode: "6163",
    })

    const { data: stolen } = await anonClient()
      .from("profiles")
      .select("*")
      .eq("user_id", a.data.user.id)
    expect(stolen ?? []).toEqual([])
  })

  it("refuses anon from reading the admins table", async () => {
    const { data, error } = await anonClient().from("admins").select("*")
    expect(data ?? []).toEqual([])
    expect(error).toBeTruthy()
  })

  it("refuses anonymous reads of applications", async () => {
    const { data } = await anonClient().from("applications").select("*")
    expect(data ?? []).toEqual([])
  })
})
