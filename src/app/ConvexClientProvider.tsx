"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"

const convex = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)
  : null

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  if (!convex) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Convex: NEXT_PUBLIC_CONVEX_URL non impostata. Avvia `npx convex dev`.")
    }
    return <>{children}</>
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
