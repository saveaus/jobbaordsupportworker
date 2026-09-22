import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { syncSubscription } from "@/lib/stripe-sync"
import { publishDraftJob } from "@/lib/publish-draft"
import { sendWelcomeProvider } from "@/lib/email/templates"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret)
    return NextResponse.json({ error: "missing signature" }, { status: 400 })

  const stripe = getStripe()
  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  const db = createSupabaseServiceClient()
  const { error } = await db.from("stripe_events").insert({ id: event.id, type: event.type })
  if (error?.code === "23505") return NextResponse.json({ received: true })

  const handled = new Set([
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_failed",
    "invoice.paid",
  ])
  if (!handled.has(event.type)) return NextResponse.json({ received: true })

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      subscription?: string
      customer?: string
      client_reference_id?: string
      metadata?: { job_id?: string; provider_id?: string }
    }
    if (session.client_reference_id && session.customer) {
      await db
        .from("providers")
        .update({ stripe_customer_id: session.customer as string })
        .eq("id", session.client_reference_id)
      const { data: provider } = await db
        .from("providers")
        .select("email")
        .eq("id", session.client_reference_id)
        .maybeSingle()
      if (provider?.email) await sendWelcomeProvider(provider.email)
    }
    if (session.subscription) await syncSubscription(session.subscription as string)
    const jobId = session.metadata?.job_id
    const providerId = session.metadata?.provider_id ?? session.client_reference_id
    if (jobId && providerId) await publishDraftJob(jobId, providerId)
    return NextResponse.json({ received: true })
  }

  const object = event.data.object as { subscription?: string; id?: string; object?: string }
  const subscriptionId =
    object.object === "subscription" ? object.id : (object.subscription as string | undefined)
  if (subscriptionId) await syncSubscription(subscriptionId)

  return NextResponse.json({ received: true })
}
