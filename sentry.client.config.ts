import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const isProduction = process.env.NODE_ENV === "production"

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || (isProduction ? "production" : "development"),
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    debug: false,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event) {
      if (event.exception) {
        const err = event.exception.values?.[0]
        if (err?.type === "AbortError" || err?.value?.includes("AbortError")) {
          return null
        }
      }
      return event
    },
  })
}
