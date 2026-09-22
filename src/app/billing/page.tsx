import { redirect } from "next/navigation"

export default async function BillingPage({
  searchParams,
}: PageProps<"/billing">) {
  const params = await searchParams
  const checkout = params.checkout === "ok" ? "?checkout=ok" : ""
  redirect(`/jobs/new${checkout}`)
}
