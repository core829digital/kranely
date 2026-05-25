"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [tokenData, setTokenData] = useState<{ token: string } | null>(null)
  const requestReset = useMutation(api.auth.requestPasswordReset)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { toast.error("Inserisci la tua email"); return }
    try {
      const result = await requestReset({ email })
      setTokenData(result)
      setSent(true)
      toast.success("Codice di reset generato")
    } catch (err: any) {
      toast.error(err.data || "Email non trovata")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-kranely-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-kranely-app-bg font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Recupera password</h1>
          <p className="text-white/60 mt-2">Inserisci la tua email per ricevere il link di reset</p>
        </div>

        {sent ? (
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] text-center space-y-4">
            <p className="text-green-400 font-medium">Codice generato!</p>
            <p className="text-sm text-white/60">Il tuo token di reset (usa /reset-password?token=...):</p>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 break-all font-mono">
              {tokenData?.token}
            </div>
            <a
              href={`/reset-password?token=${tokenData?.token}`}
              className="block text-kranely-accent hover:underline text-sm"
            >
              Vai alla pagina di reset
            </a>
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
                placeholder="admin@kranely.app"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold">
              Invia codice
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
