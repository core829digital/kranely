"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error)
    }
  }, [error])

  return (
    <html lang="it">
      <body style={{ background: "#0F172A", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ textAlign: "center", maxWidth: "32rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.75rem" }}>Errore critico</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem" }}>
              L'applicazione ha riscontrato un errore critico. Ricarica la pagina per continuare.
            </p>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "1.5rem", fontFamily: "monospace" }}>
                ID errore: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.5rem",
                background: "#C7AE6A",
                color: "#0F172A",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ricarica applicazione
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
