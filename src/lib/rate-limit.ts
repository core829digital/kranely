type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

function gc(now: number) {
  if (buckets.size < 256) return
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k)
  }
}

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; remaining: number; resetMs: number } {
  const now = Date.now()
  gc(now)
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, resetMs: windowMs }
  }
  if (b.count >= max) {
    return { ok: false, remaining: 0, resetMs: b.resetAt - now }
  }
  b.count++
  return { ok: true, remaining: max - b.count, resetMs: b.resetAt - now }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown"
}
