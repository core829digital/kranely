"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/Logo"
import { useAuth } from "@/lib/auth/auth-context"
import { getDefaultRouteForRole } from "@/lib/auth/rbac"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Building2, Store, ChevronRight, ChevronLeft, Check,
  Wrench, Briefcase, Sparkles, Package,
  User, MapPin, Phone, Loader2, Factory
} from "lucide-react"
import {
  SPECIALIZATIONS, MATERIAL_BRANDS, HARDWARE_BRANDS,
  COUNTRIES, EMPLOYEE_RANGES,
} from "@/data/onboarding"

type AccountType = "manufacturer" | "reseller"

interface FormData {
  accountType: AccountType | null
  companyName: string
  vatNumber: string
  employeeCount: number | null
  suppliers: string[]
  specializations: string[]
  materialsUsed: string[]
  hardwareBrands: string[]
  country: string
  city: string
  address: string
  profileDescription: string
  website: string
  contactPhone: string
  fullName: string
  email: string
  password: string
  phone: string
}

const STEP_DEFS = [
  { id: 1, title: "Tipo Azienda", icon: Briefcase },
  { id: 2, title: "Azienda", icon: Building2 },
  { id: 3, title: "Specializzazioni", icon: Sparkles },
  { id: 4, title: "Materiali", icon: Package },
  { id: 5, title: "Ferramenta", icon: Wrench },
  { id: 6, title: "Posizione", icon: MapPin },
  { id: 7, title: "Contatti", icon: Phone },
  { id: 8, title: "Account", icon: User },
  { id: 9, title: "Riepilogo", icon: Check },
]

const STORAGE_KEY = "kranely_register_onboarding"

const emptyForm: FormData = {
  accountType: null,
  companyName: "",
  vatNumber: "",
  employeeCount: null,
  suppliers: [],
  specializations: [],
  materialsUsed: [],
  hardwareBrands: [],
  country: "",
  city: "",
  address: "",
  profileDescription: "",
  website: "",
  contactPhone: "",
  fullName: "",
  email: "",
  password: "",
  phone: "",
}

function TagInput({
  options, selected, onChange, placeholder, searchable,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder: string
  searchable?: boolean
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options

  const toggleTag = (tag: string) => {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])
  }

  const visible = searchable !== false

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <button
              key={s}
              onClick={() => toggleTag(s)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-kranely-accent/15 text-kranely-accent border border-kranely-accent/20 hover:bg-kranely-accent/25 transition-colors"
            >
              {s} ✕
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        {visible && (
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
          />
        )}
        {open && visible && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-kranely-app-bg shadow-xl">
              {filtered.length === 0 ? (
                <div className="p-3 text-sm text-white/40 text-center">Nessun risultato</div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { toggleTag(opt); setQuery(""); setOpen(false) }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors",
                      selected.includes(opt) ? "text-kranely-accent" : "text-white/70"
                    )}
                  >
                    {selected.includes(opt) && <Check className="w-3 h-3 inline mr-2" />}
                    {opt}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { registerCompany, isLoading, error: authError } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    } catch {}
  }, [form])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleArrayItem = useCallback((key: "specializations" | "materialsUsed" | "hardwareBrands" | "suppliers", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }))
  }, [])

  const canNext = (): boolean => {
    switch (step) {
      case 1: return form.accountType !== null
      case 2: return form.companyName.trim().length > 0
      case 3: return form.specializations.length > 0
      case 4: return true
      case 5: return true
      case 6: return form.country.trim().length > 0
      case 7: return true
      case 8: return form.fullName.trim().length > 0 && form.email.trim().length > 0 && form.password.length >= 8
      case 9: return true
      default: return true
    }
  }

  const handleSubmit = async () => {
    if (!form.accountType || !form.companyName || !form.fullName || !form.email || !form.password) {
      toast.error("Compila tutti i campi obbligatori")
      return
    }
    setSubmitting(true)
    try {
      const ok = await registerCompany({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone || undefined,
        accountType: form.accountType,
        companyName: form.companyName,
        vatNumber: form.vatNumber || undefined,
        employeeCount: form.employeeCount ?? undefined,
        suppliers: form.suppliers.length > 0 ? form.suppliers : undefined,
        specializations: form.specializations.length > 0 ? form.specializations : undefined,
        materialsUsed: form.materialsUsed.length > 0 ? form.materialsUsed : undefined,
        hardwareBrands: form.hardwareBrands.length > 0 ? form.hardwareBrands : undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        address: form.address || undefined,
        profileDescription: form.profileDescription || undefined,
        website: form.website || undefined,
        contactPhone: form.contactPhone || undefined,
      })
      if (ok) {
        localStorage.removeItem(STORAGE_KEY)
        toast.success("Account creato con successo!")
        router.replace(getDefaultRouteForRole("admin"))
        router.refresh()
      } else {
        toast.error(authError || "Errore durante la registrazione")
      }
    } catch (e: any) {
      toast.error(e.message || "Errore durante la registrazione")
    } finally {
      setSubmitting(false)
    }
  }

  const progress = ((step - 1) / (STEP_DEFS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-kranely-app-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white">Registra la tua Azienda</h1>
          <p className="text-white/50 mt-1">
            {STEP_DEFS.find((s) => s.id === step)?.title} — Passo {step} di {STEP_DEFS.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-kranely-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Cosa sei?</h2>
              <p className="text-sm text-white/50 mb-4">Seleziona il tipo di attività che svolgi</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => update("accountType", "manufacturer")}
                  className={cn(
                    "relative p-6 rounded-xl border-2 text-left transition-all",
                    form.accountType === "manufacturer"
                      ? "border-kranely-accent bg-kranely-accent/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  {form.accountType === "manufacturer" && (
                    <Check className="absolute top-3 right-3 w-5 h-5 text-kranely-accent" />
                  )}
                  <Factory className="w-10 h-10 text-kranely-accent mb-3" />
                  <h3 className="text-white font-semibold">Fabbricante</h3>
                  <p className="text-sm text-white/40 mt-1">Produci serramenti e infissi. Hai una fabbrica, operai, e gestisci l'intero processo produttivo.</p>
                </button>
                <button
                  onClick={() => update("accountType", "reseller")}
                  className={cn(
                    "relative p-6 rounded-xl border-2 text-left transition-all",
                    form.accountType === "reseller"
                      ? "border-kranely-accent bg-kranely-accent/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  {form.accountType === "reseller" && (
                    <Check className="absolute top-3 right-3 w-5 h-5 text-kranely-accent" />
                  )}
                  <Store className="w-10 h-10 text-kranely-accent mb-3" />
                  <h3 className="text-white font-semibold">Rivenditore</h3>
                  <p className="text-sm text-white/40 mt-1">Rivendi serramenti e infissi ai clienti finali. Collabori con fabbricanti per la produzione.</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Dati Aziendali</h2>
              <p className="text-sm text-white/50 mb-4">Inserisci le informazioni della tua azienda</p>
              <div>
                <label className="block text-sm text-white/70 mb-1">Nome Azienda *</label>
                <input
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="Ragione sociale"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Partita IVA</label>
                <input
                  value={form.vatNumber}
                  onChange={(e) => update("vatNumber", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="IT00000000000"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Dipendenti</label>
                <select
                  value={form.employeeCount ?? ""}
                  onChange={(e) => update("employeeCount", e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                >
                  <option value="">Seleziona fascia</option>
                  {EMPLOYEE_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Fornitori (chi ti fornisce i materiali)</label>
                <TagInput
                  options={[]}
                  selected={form.suppliers}
                  onChange={(v) => update("suppliers", v)}
                  placeholder="Inserisci nome fornitore e premi Invio"
                  searchable={false}
                />
                <div className="flex gap-2 mt-2">
                  <input
                    placeholder="Aggiungi fornitore..."
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val && !form.suppliers.includes(val)) {
                          update("suppliers", [...form.suppliers, val])
                        }
                        (e.target as HTMLInputElement).value = ""
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/10"
                    onClick={() => {
                      const input = document.activeElement as HTMLInputElement
                      if (input?.value?.trim()) {
                        const val = input.value.trim()
                        if (!form.suppliers.includes(val)) {
                          update("suppliers", [...form.suppliers, val])
                        }
                        input.value = ""
                      }
                    }}
                  >
                    Aggiungi
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Specializzazioni</h2>
              <p className="text-sm text-white/50 mb-4">Seleziona le tue aree di specializzazione</p>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleArrayItem("specializations", s)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                      form.specializations.includes(s)
                        ? "bg-kranely-accent/15 text-kranely-accent border-kranely-accent/30"
                        : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                    )}
                  >
                    {form.specializations.includes(s) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Materiali Utilizzati</h2>
              <p className="text-sm text-white/50 mb-4">Seleziona le marche di profili che utilizzi</p>
              <TagInput
                options={MATERIAL_BRANDS}
                selected={form.materialsUsed}
                onChange={(v) => update("materialsUsed", v)}
                placeholder="Cerca marca profili (Rehau, Aluplast, Veka...)"
              />
              {form.materialsUsed.length > 0 && (
                <p className="text-xs text-white/40">{form.materialsUsed.length} selezionat{form.materialsUsed.length === 1 ? "o" : "i"}</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Ferramenta</h2>
              <p className="text-sm text-white/50 mb-4">Seleziona le marche di ferramenta che utilizzi</p>
              <TagInput
                options={HARDWARE_BRANDS}
                selected={form.hardwareBrands}
                onChange={(v) => update("hardwareBrands", v)}
                placeholder="Cerca marca ferramenta (MACO, Roto, GU...)"
              />
              {form.hardwareBrands.length > 0 && (
                <p className="text-xs text-white/40">{form.hardwareBrands.length} selezionat{form.hardwareBrands.length === 1 ? "a" : "e"}</p>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Posizione</h2>
              <p className="text-sm text-white/50 mb-4">Dove si trova la tua azienda</p>
              <div>
                <label className="block text-sm text-white/70 mb-1">Paese *</label>
                <select
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                >
                  <option value="">Seleziona paese</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Città</label>
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="Milano"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Indirizzo</label>
                <input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="Via Roma 1"
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Contatti</h2>
              <p className="text-sm text-white/50 mb-4">Come possono contattarti i tuoi clienti e partner</p>
              <div>
                <label className="block text-sm text-white/70 mb-1">Telefono Aziendale</label>
                <input
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="+39 02 12345678"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Sito Web</label>
                <input
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="https://www.azienda.it"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Descrizione Azienda</label>
                <textarea
                  value={form.profileDescription}
                  onChange={(e) => update("profileDescription", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50 min-h-[100px] resize-y"
                  placeholder="Descrivi brevemente la tua azienda, la tua esperienza e cosa offri..."
                />
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Crea il tuo Account</h2>
              <p className="text-sm text-white/50 mb-4">Ultimo passo — inserisci le tue credenziali</p>
              <div>
                <label className="block text-sm text-white/70 mb-1">Nome e Cognome *</label>
                <input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="Mario Rossi"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Telefono Personale</label>
                <input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="+39 123 456 7890"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="mario@azienda.it"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50"
                  placeholder="Minimo 8 caratteri"
                />
                {form.password.length > 0 && form.password.length < 8 && (
                  <p className="text-xs text-red-400 mt-1">Minimo 8 caratteri</p>
                )}
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Riepilogo</h2>
              <p className="text-sm text-white/50 mb-4">Conferma i dati inseriti</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/50">Tipo Azienda</span>
                  <span className="text-white font-medium">{form.accountType === "manufacturer" ? "Fabbricante" : "Rivenditore"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/50">Azienda</span>
                  <span className="text-white font-medium">{form.companyName}</span>
                </div>
                {form.vatNumber && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50">Partita IVA</span>
                    <span className="text-white font-medium">{form.vatNumber}</span>
                  </div>
                )}
                {form.employeeCount && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50">Dipendenti</span>
                    <span className="text-white font-medium">{form.employeeCount}</span>
                  </div>
                )}
                {form.specializations.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50">Specializzazioni</span>
                    <span className="text-white font-medium text-right max-w-[60%]">{form.specializations.join(", ")}</span>
                  </div>
                )}
                {form.materialsUsed.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50">Materiali</span>
                    <span className="text-white font-medium text-right max-w-[60%]">{form.materialsUsed.join(", ")}</span>
                  </div>
                )}
                {form.hardwareBrands.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50">Ferramenta</span>
                    <span className="text-white font-medium text-right max-w-[60%]">{form.hardwareBrands.join(", ")}</span>
                  </div>
                )}
                {form.country && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50">Paese</span>
                    <span className="text-white font-medium">{form.country}{form.city ? `, ${form.city}` : ""}</span>
                  </div>
                )}
                {form.fullName && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50">Referente</span>
                    <span className="text-white font-medium">{form.fullName}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-white/50">Email</span>
                  <span className="text-white font-medium">{form.email}</span>
                </div>
              </div>
              {authError && (
                <p className="text-red-400 text-sm text-center">{authError}</p>
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitting || isLoading}
                className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold disabled:opacity-50"
              >
                {submitting || isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creazione in corso...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Crea Account e Inizia</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 1 ? (
              <Button
                onClick={() => setStep(step - 1)}
                variant="ghost"
                className="text-white/50 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
              </Button>
            ) : (
              <Link
                href="/sign-in"
                className="text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                Hai già un account? Accedi
              </Link>
            )}
          </div>
          {step < 9 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold disabled:opacity-50"
            >
              Continua <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          Registrandoti accetti i{" "}
          <Link href="/terms" className="text-kranely-accent/60 hover:text-kranely-accent">Termini di Servizio</Link>
          {" "}e la{" "}
          <Link href="/privacy" className="text-kranely-accent/60 hover:text-kranely-accent">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
