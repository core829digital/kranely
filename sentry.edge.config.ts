import * as Sentry from "@sentry/nextjs"
import type { NextRequest } from "next/server"

type EdgeRouteContext = { request: NextRequest }

export async function withSentryMiddleware(handler: (req: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return handler(request)
    return Sentry.withScope(async (scope) => {
      scope.setTag("middleware", "kranely")
      try {
        return await handler(request)
      } catch (err) {
        Sentry.captureException(err)
        throw err
      }
    })
  }
}

export const _ctx: EdgeRouteContext = { request: undefined as unknown as NextRequest }
