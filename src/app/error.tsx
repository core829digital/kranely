"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error)
    }
    if (typeof window !== "undefined" && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error)
    }
  }, [error])

  return (
    <main id="main-content" className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-kranely-accent mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-semibold mb-3">Qualcosa è andato storto</h1>
        <p className="text-white/70 mb-2">
          Si è verificato un errore inatteso. Il nostro team è stato notificato.
        </p>
        {error.digest && (
          <p className="text-xs text-white/40 mb-6 font-mono">ID errore: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Riprova
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Torna alla home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
