"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [done, setDone] = useState(false)
  const resetPassword = useMutation(api.auth.resetPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { toast.error("Token mancante"); return }
    if (password.length < 6) { toast.error("La password deve essere almeno 6 caratteri"); return }
    if (password !== confirm) { toast.error("Le password non coincidono"); return }
    try {
      await resetPassword({ token, newPassword: password })
      setDone(true)
      toast.success("Password aggiornata con successo!")
    } catch (err: any) {
      toast.error(err.data || "Errore nel reset della password")
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
        <div className="text-center p-8"><p className="text-red-400">Token di reset mancante</p></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-kranely-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-kranely-app-bg font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reimposta password</h1>
          <p className="text-white/60 mt-2">Scegli una nuova password per il tuo account</p>
        </div>

        {done ? (
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] text-center space-y-4">
            <p className="text-green-400 font-medium">Password aggiornata!</p>
            <p className="text-sm text-white/60">Ora puoi accedere con la nuova password.</p>
            <a href="/sign-in" className="block text-kranely-accent hover:underline text-sm">Vai al login</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Nuova password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                placeholder="Minimo 6 caratteri" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Conferma password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                placeholder="Ripeti la password" required minLength={6} />
            </div>
            <Button type="submit" className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold">
              Reimposta password
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
