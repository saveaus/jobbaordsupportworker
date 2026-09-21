import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { Button } from "@/components/ui/button"
import { Table, Td, Th } from "@/components/ui/table"
import { suspendProvider } from "./actions"

export const metadata: Metadata = { title: "Admin providers" }

export default async function AdminProvidersPage() {
  await requireAdmin()
  const db = createSupabaseServiceClient()
  const { data: providers } = await db
    .from("providers")
    .select("id, business_name, abn, email, status, stripe_subscription_status")
    .not("owner_user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h1">Providers</h1>
      <Table>
        <thead>
          <tr>
            <Th>Business</Th>
            <Th>ABN</Th>
            <Th>Subscription</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {(providers ?? []).map(function renderProvider(provider) {
            return (
              <tr key={provider.id}>
                <Td>{provider.business_name}</Td>
                <Td className="tabular-nums">{provider.abn}</Td>
                <Td>{provider.stripe_subscription_status ?? "none"}</Td>
                <Td>{provider.status}</Td>
                <Td>
                  {provider.status === "active" ? (
                    <form action={suspendProvider}>
                      <input type="hidden" name="providerId" value={provider.id} />
                      <Button type="submit" variant="secondary">
                        Suspend
                      </Button>
                    </form>
                  ) : (
                    "Suspended"
                  )}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}
