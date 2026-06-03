import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { fetchMutation } from "convex/nextjs"
import { api } from "../../../../../convex/_generated/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const ip = clientIp(req)
  const rl = rateLimit(`stripe-webhook:${ip}`, 100, 60_000)
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 })
  }

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
  if (!STRIPE_SECRET || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe non configurato", hint: "Imposta STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET in .env.local" },
      { status: 501 }
    )
  }

  try {
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2026-04-22.dahlia" })

    const sig = req.headers.get("stripe-signature")
    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
    }
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any
        const meta = session.metadata
        if (meta?.type === "payment" && meta.organizationId && meta.paymentId) {
          await fetchMutation(api.stripe.handlePaymentCheckoutCompleted, {
            organizationId: meta.organizationId,
            paymentId: meta.paymentId,
          })
          console.log("[stripe] payment completed via checkout", meta.paymentId)
        }
        break
      }
      case "payment_intent.succeeded":
        console.log("[stripe] payment ok", event.id)
        break
      case "payment_intent.payment_failed":
        console.warn("[stripe] payment failed", event.id)
        break
      default:
        console.log("[stripe] unhandled", event.type)
    }

    return NextResponse.json({ received: true, type: event.type })
  } catch (err) {
    console.error("[stripe-webhook] error", err)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }
}