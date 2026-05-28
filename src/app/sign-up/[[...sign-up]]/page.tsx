"use client"

import { useState } from "react"
import { useAuth, type UserRole, type UserSubrole } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const ROLE_LABELS: Record<string, string> = {
  admin: "Amministratore",
  supplier: "Fornitore",
  collaborator: "Collaboratore",
  client: "Cliente",
  driver: "Autista",
}

const SUBROLE_LABELS: Record<string, string> = {
  serramenti: "Serramenti",
  edilizia: "Edilizia",
  generale: "Generale",
}

export default function SignUpPage() {
  const { signUp, isLoading, error } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<UserRole>("client")
  const [subrole, setSubrole] = useState<UserSubrole>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await signUp(email, password, fullName, role, subrole, phone)
    if (success) {
      toast.success("Account creato con successo")
      window.location.href = "/dashboard"
    } else {
      toast.error(error || "Errore nella registrazione")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-kranely-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-kranely-app-bg font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Crea il tuo account</h1>
          <p className="text-white/60 mt-2">Inizia a gestire la tua azienda con Kranely</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Tipo Account *</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-kranely-accent/50">
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {(role === "supplier" || role === "collaborator") && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Specializzazione</label>
              <select value={subrole || ""} onChange={(e) => setSubrole(e.target.value as UserSubrole || null)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-kranely-accent/50">
                <option value="">Generale</option>
                <option value="serramenti">Serramenti</option>
                <option value="edilizia">Edilizia</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Nome completo *</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50" placeholder="Mario Rossi" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50" placeholder="mario@azienda.it" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Telefono</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50" placeholder="+39 123 456 7890" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50" placeholder="Minimo 6 caratteri" required minLength={6} />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-kranely-accent focus:ring-kranely-accent/50 focus:outline-none accent-kranely-accent"
            />
            <span className="text-sm text-white/60">
              Accetto i{" "}
              <a href="/terms" className="text-kranely-accent hover:underline">Termini e Servizio</a>
              {" "}e la{" "}
              <a href="/privacy" className="text-kranely-accent hover:underline">Privacy Policy</a>
            </span>
          </label>

          <Button type="submit" disabled={isLoading || !acceptedTerms} className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Registrazione in corso..." : "Crea account"}
          </Button>
        </form>

        <p className="text-center text-sm text-white/60 mt-6">
          Hai già un account?{" "}
          <a href="/sign-in" className="text-kranely-accent hover:underline">Accedi</a>
        </p>
      </div>
    </div>
  )
}
