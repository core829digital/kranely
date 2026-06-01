"use client"

import ReactDOM from "react-dom"

export function ResourceHints() {
  ReactDOM.preconnect("https://hushed-kiwi-35.convex.cloud", { crossOrigin: "anonymous" })
  ReactDOM.prefetchDNS("https://hushed-kiwi-35.convex.cloud")
  return null
}
