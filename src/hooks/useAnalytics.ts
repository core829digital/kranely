"use client"

import { useCallback, useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useAuth } from "@/lib/auth/auth-context"

let sessionId: string | null = null
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr"
  if (!sessionId) {
    const existing = localStorage.getItem("kranely_analytics_session")
    if (existing) {
      sessionId = existing
    } else {
      sessionId = crypto.randomUUID()
      localStorage.setItem("kranely_analytics_session", sessionId)
    }
  }
  return sessionId
}

export function useAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const trackView = useMutation(api.analytics.trackPageView)
  const trackEvent = useMutation(api.analytics.trackFeatureEvent)
  const trackSession = useMutation(api.analytics.trackSessionEvent)
  const { user } = useAuth()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    const sid = getSessionId()
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")

    trackView({
      path: fullPath,
      title: document.title,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      sessionId: sid,
      userEmail: user?.email,
      isAuthenticated: !!user,
    })
  }, [pathname, searchParams, trackView, user])

  const trackFeature = useCallback(
    (eventName: string, eventData?: Record<string, unknown>) => {
      trackEvent({
        eventName,
        eventData: eventData ?? undefined,
        page: pathname,
        sessionId: getSessionId(),
        userEmail: user?.email,
        isAuthenticated: !!user,
      })
    },
    [trackEvent, pathname, user],
  )

  const trackSignIn = useCallback(
    (email: string) => {
      trackSession({
        userEmail: email,
        sessionId: getSessionId(),
        event: "sign_in",
        userAgent: navigator.userAgent,
      })
    },
    [trackSession],
  )

  const trackSignOut = useCallback(
    (email: string) => {
      trackSession({
        userEmail: email,
        sessionId: getSessionId(),
        event: "sign_out",
      })
    },
    [trackSession],
  )

  return { trackFeature, trackSignIn, trackSignOut }
}
