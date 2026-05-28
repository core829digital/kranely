"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center">
        <span className="text-red-400 font-bold text-3xl">!</span>
      </div>
      <h1 className="text-xl font-bold text-white">Errore</h1>
      <p className="text-white/60 text-sm max-w-md text-center">
        {error.message || "Si è verificato un errore imprevisto"}
      </p>
      <Button
        onClick={reset}
        className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold"
      >
        Riprova
      </Button>
    </div>
  )
}
