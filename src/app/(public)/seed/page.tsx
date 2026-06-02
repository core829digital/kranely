"use client"

import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useState } from "react"
import Link from "next/link"

export default function SeedPage() {
  const seed = useMutation(api.seed.seed)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSeed = async () => {
    setLoading(true)
    setStatus("Popolamento database in corso...")
    try {
      const result = await seed({})
      setStatus(`Database popolato con successo! Organizzazione: ${result.orgId}, Admin: ${result.adminId}, Clienti: ${result.clients.length}, Fornitori: ${result.suppliers.length}, Preventivi: ${result.quotes.length}, Cantieri: ${result.cantieri.length}`)
    } catch (e) {
      setStatus(`Errore: ${e instanceof Error ? e.message : "Errore sconosciuto"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Seed Database</h1>
          <p className="text-sm text-white/60 mt-2">
            Popola il database con dati demo per test
          </p>
        </div>

        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full py-3 px-6 rounded-lg bg-[#c8ff66] text-black font-semibold hover:bg-[#c8ff66]/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Popolamento..." : "Popola Database Demo"}
        </button>

        {status && (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 whitespace-pre-wrap">
            {status}
          </div>
        )}



        <div className="text-center">
          <Link href="/sign-in" className="text-sm text-[#c8ff66] hover:underline">
            Vai al login
          </Link>
        </div>
      </div>
    </div>
  )
}
