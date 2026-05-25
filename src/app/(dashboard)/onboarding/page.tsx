"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { UserCheck, Key, Mail, User, Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const token = searchParams.get("token") || ""
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const collaboratorData = useQuery(
    api.collaborators.getByOnboardingToken,
    token ? { token } : "skip"
  )
  const completeOnboarding = useMutation(api.collaborators.completeOnboarding)

  useEffect(() => {
    if (collaboratorData && !collaboratorData.expired) {
      if (collaboratorData.fullName) setFullName(collaboratorData.fullName)
      if (collaboratorData.phone) setPhone(collaboratorData.phone)
    }
  }, [collaboratorData])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
        <div className="text-center p-12"><Key className="w-12 h-12 mx-auto mb-4 text-white/20" /><p className="text-white/60">Token di onboarding mancante</p></div>
      </div>
    )
  }

  if (collaboratorData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
        <Loader2 className="w-8 h-8 animate-spin text-kranely-accent" />
      </div>
    )
  }

  if (!collaboratorData || collaboratorData.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
        <div className="text-center p-12"><Key className="w-12 h-12 mx-auto mb-4 text-red-400" /><p className="text-white/60">{collaboratorData?.expired ? "Token scaduto. Contatta l'amministratore." : "Token non valido"}</p></div>
      </div>
    )
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { toast.error("Inserisci il tuo nome"); return }
    if (password.length < 6) { toast.error("La password deve essere almeno 6 caratteri"); return }
    setSaving(true)
    try {
      await completeOnboarding({ token, fullName: fullName.trim(), phone: phone.trim() || undefined, newPassword: password })
      toast.success("Onboarding completato con successo!")
      setDone(true)
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'onboarding")
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
        <div className="w-full max-w-md px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Benvenuto!</h1>
          <p className="text-white/60">Il tuo account è stato attivato. Ora puoi accedere con le tue credenziali.</p>
          <Button onClick={() => router.push(user ? "/dashboard" : "/sign-in")} className="bg-kranely-accent text-kranely-app-bg">
            {user ? "Vai alla dashboard" : "Vai al login"}
          </Button>
        </div>
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
          <h1 className="text-2xl font-bold text-white">Completa registrazione</h1>
          <p className="text-white/60 mt-2">Imposta i tuoi dati per attivare l'account</p>
        </div>

        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Nome completo</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Il tuo nome" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Telefono</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+39 000 000 0000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2"><Key className="w-3.5 h-3.5" /> Nuova password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caratteri" required minLength={6} />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold">
            {saving ? "Salvataggio..." : "Completa registrazione"}
          </Button>
        </form>
      </div>
    </div>
  )
}
