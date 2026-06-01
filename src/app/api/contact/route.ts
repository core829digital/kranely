import { NextResponse } from "next/server"
import { rateLimit, clientIp } from "@/lib/rate-limit"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME = 200
const MAX_EMAIL = 320
const MAX_MESSAGE = 5000
const LIMIT_MAX = 5
const LIMIT_WINDOW_MS = 60_000

export async function POST(req: Request) {
  try {
    const ip = clientIp(req)
    const rl = rateLimit(`contact:${ip}`, LIMIT_MAX, LIMIT_WINDOW_MS)
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Troppi tentativi. Riprova più tardi." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
    const { name, email, message } = body as Record<string, unknown>

    if (typeof name !== "string" || name.trim().length < 2 || name.length > MAX_NAME) {
      return NextResponse.json({ error: "Nome non valido" }, { status: 400 })
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email) || email.length > MAX_EMAIL) {
      return NextResponse.json({ error: "Email non valida" }, { status: 400 })
    }
    if (typeof message !== "string" || message.trim().length < 10 || message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: "Messaggio non valido (min 10 caratteri)" }, { status: 400 })
    }

    const ua = req.headers.get("user-agent") || "unknown"

    console.log("[contact]", {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      messageLength: message.length,
      ip,
      ua,
      at: new Date().toISOString(),
    })

    return NextResponse.json(
      { ok: true },
      { headers: { "X-RateLimit-Limit": String(LIMIT_MAX), "X-RateLimit-Remaining": String(rl.remaining) } }
    )
  } catch (err) {
    console.error("[contact] error", err)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
