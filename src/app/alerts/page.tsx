import type { Metadata } from "next"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertForm } from "./alert-form"
import { requireApplicant } from "@/lib/account"
import { AccountNav } from "@/components/site/account-nav"

export const metadata: Metadata = { title: "Job alerts" }

export default async function AlertsPage() {
  const { supabase, user } = await requireApplicant("/alerts")

  const { data: profile } = await supabase
    .from("profiles")
    .select("postcode")
    .eq("user_id", user.id)
    .maybeSingle()
  const { data: alerts } = await supabase
    .from("job_alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <AccountNav kind="applicant" />
      <h1 className="text-h1">Job alerts</h1>
      <p className="max-w-prose">
        Daily or weekly email matching your postcode, a 50km radius, and work type.
      </p>
      <AlertForm defaultPostcode={profile?.postcode ?? ""} />
      {(alerts ?? []).length === 0 ? (
        <EmptyState message="You have no alerts yet." />
      ) : (
        <ul className="flex flex-col border-t border-line">
          {(alerts ?? []).map(function renderAlert(alert) {
            return (
              <li key={alert.id} className="flex items-center justify-between border-b border-line py-5">
                <span>
                  {alert.postcode}, {alert.radius_km}km, {alert.frequency}
                </span>
                <form action={`/alerts/${alert.id}/delete`} method="post">
                  <button type="submit" className="underline">
                    Remove
                  </button>
                </form>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
