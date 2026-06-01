export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.server.config")
  }
}

export async function onRequestError(err: unknown, request: unknown, context: unknown) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs")
    const eventId = Sentry.captureException(err, { extra: { request, context } })
    return { eventId }
  }
}
