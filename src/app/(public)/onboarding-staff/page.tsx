"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/Logo"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { UserCheck, Key, Mail, User, Phone, Loader2 } from "lucide-react"
import Link from "next/link"

export default function OnboardingStaffPage() {
  const router = useRouter()
  const { signUp, isLoading } = useAuth()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { toast.error("Inserisci il nome completo"); return }
    if (!email.trim() || !email.includes("@")) { toast.error("Inserisci un'email valida"); return }
    if (password.length < 6) { toast.error("La password deve essere almeno 6 caratteri"); return }
    if (password !== confirmPassword) { toast.error("Le password non coincidono"); return }

    try {
      const ok = await signUp(email.trim().toLowerCase(), password, fullName.trim(), "collaborator", undefined, phone.trim() || undefined)
      if (ok) {
        toast.success("Registrazione completata!")
        router.push("/dashboard")
      }
    } catch (err: any) {
      toast.error(err.message || "Errore registrazione")
    }
  }

  return (
    <div className="min-h-screen bg-kranely-app-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold text-white">Registrazione Staff</h1>
          <p className="text-white/60 mt-2">Crea il tuo account per accedere alla piattaforma</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="staff-name" className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Nome completo</label>
            <Input id="staff-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Il tuo nome" required autoComplete="name" />
          </div>
          <div>
            <label htmlFor="staff-email" className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</label>
            <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@esempio.it" required autoComplete="email" />
          </div>
          <div>
            <label htmlFor="staff-phone" className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Telefono (opzionale)</label>
            <Input id="staff-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+39 000 000 0000" autoComplete="tel" />
          </div>
          <div>
            <label htmlFor="staff-password" className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2"><Key className="w-3.5 h-3.5" /> Password</label>
            <Input id="staff-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caratteri" required minLength={6} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="staff-confirm" className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2"><Key className="w-3.5 h-3.5" /> Conferma Password</label>
            <Input id="staff-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ripeti la password" required minLength={6} autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold">
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registrazione...</> : "Registrati"}
          </Button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          Hai già un account? <Link href="/sign-in" className="text-kranely-accent hover:underline">Accedi</Link>
        </p>
      </div>
    </div>
  )
}
