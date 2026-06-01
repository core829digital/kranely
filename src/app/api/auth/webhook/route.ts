import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const ip = clientIp(req)
  const rl = rateLimit(`auth-webhook:${ip}`, 30, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 })

  const SUPABASE_WEBHOOK_SECRET = process.env.SUPABASE_AUTH_WEBHOOK_SECRET
  if (!SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Auth webhook non configurato", hint: "Imposta SUPABASE_AUTH_WEBHOOK_SECRET" },
      { status: 501 }
    )
  }

  try {
    const body = await req.text()
    const sig = req.headers.get("x-supabase-signature")
    if (sig !== SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
    const payload = JSON.parse(body)
    console.log("[auth-webhook]", payload?.type, payload?.user?.id)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[auth-webhook] error", err)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }
}
