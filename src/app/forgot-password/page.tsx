"use client"

import { useState } from "react"
import { Logo } from "@/components/Logo"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const requestReset = useMutation(api.auth.requestPasswordReset)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { toast.error("Inserisci la tua email"); return }
    setLoading(true)
    try {
      await requestReset({ email })
      setSent(true)
      toast.success("Email inviata! Controlla la tua casella di posta")
    } catch (err: any) {
      toast.error(err.data || "Email non trovata")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-white">Recupera password</h1>
          <p className="text-white/60 mt-2">Inserisci la tua email per ricevere il link di reset</p>
        </div>

        {sent ? (
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <span className="text-green-400 text-3xl">&#10003;</span>
            </div>
            <p className="text-green-400 font-medium">Email inviata!</p>
            <p className="text-sm text-white/60">
              Se l&apos;indirizzo email è registrato, riceverai un link per resettare la tua password.
              Controlla la tua casella di posta (anche nella cartella spam).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                placeholder="tua@email.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold">
              {loading ? "Invio in corso..." : "Invia link di reset"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-white/60 mt-6">
          <a href="/sign-in" className="text-kranely-accent hover:underline">Torna al login</a>
        </p>
      </div>
    </div>
  )
}
