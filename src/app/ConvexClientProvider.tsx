"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { useMemo } from "react"

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return null
    return new ConvexReactClient(url)
  }, [])

  if (!convex) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Convex: NEXT_PUBLIC_CONVEX_URL non impostata. Avvia `npx convex dev`.")
    }
    return <>{children}</>
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
