"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useRouter } from "next/navigation"
import { getDefaultRouteForRole } from "@/lib/auth/rbac"
import { Button } from "@/components/ui/button"
import { Input, Textarea, Label } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  Building2, Store, ChevronRight, ChevronLeft, Check, Upload,
  CheckCircle2, ArrowRight, FileText, Wrench, Globe, Briefcase,
  Sparkles, Package, Loader2, Camera, Factory
} from "lucide-react"

type AccountType = "manufacturer" | "reseller" | null

interface FormData {
  accountType: AccountType
  companyName: string
  vatNumber: string
  employeeCount: number | null
  country: string
  city: string
  address: string
  specializations: string[]
  materialsUsed: string[]
  hardwareBrands: string[]
  profileDescription: string
  website: string
  contactPhone: string
  logo: string
}

const STEPS = [
  { num: 1, title: "Tipo Account", icon: Briefcase },
  { num: 2, title: "Azienda", icon: Building2 },
  { num: 3, title: "Specializzazioni", icon: Sparkles },
  { num: 4, title: "Materiali", icon: Package },
  { num: 5, title: "Ferramenta", icon: Wrench },
  { num: 6, title: "Contatti", icon: Globe },
  { num: 7, title: "Descrizione", icon: FileText },
  { num: 8, title: "Riepilogo", icon: CheckCircle2 },
]

const SPECIALIZATIONS = [
  "Finestre", "Porte", "Portoni", "Scorrevoli", "Facciate continue",
  "Pergole bioclimatiche", "Zanzariere", "Tapparelle",
  "Infissi in alluminio", "Infissi in legno", "Infissi in PVC",
]

const MATERIAL_BRANDS = [
  "Rehau (Geneo/Synego)", "Aluplast (Ideal 8000/7000)", "Veka (Softline 82)",
  "Salamander (bluEvolution)", "Schüco (Living 82)", "Deceuninck (Decal)",
  "KBE", "Decco", "Aliplast", "Aluprof",
]

const HARDWARE_BRANDS = [
  "MACO", "Roto", "Hoppe", "Sobinco", "GU (Gretsch-Unitas)", "Siegenia", "Winkhaus",
]

const COUNTRIES = [
  "Italia", "Germania", "Austria", "Svizzera", "Francia", "Spagna",
  "Belgio", "Paesi Bassi", "Polonia", "Romania",
]

export default function OnboardingSetupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const orgId = useOrgId()
  const fileInputRef = useRef<HTMLInputElement>(null)

   const [currentStep, setCurrentStep] = useState(1)
   const [saving, setSaving] = useState(false)
   const [uploadingLogo, setUploadingLogo] = useState(false)
   const [completing, setCompleting] = useState(false)
   const [loaded, setLoaded] = useState(false)
   const [otherMaterial, setOtherMaterial] = useState("")
   const [otherHardware, setOtherHardware] = useState("")

   const [formData, setFormData] = useState<FormData>({
     accountType: null, companyName: "", vatNumber: "", employeeCount: null,
     country: "", city: "", address: "", specializations: [],
     materialsUsed: [], hardwareBrands: [], profileDescription: "",
     website: "", contactPhone: "", logo: "",
   })

   const onboardingState = useQuery(
     api.onboarding.getOnboardingState,
     orgId && formData.accountType ? { organizationId: orgId, userEmail: "" } : "skip"
   )
   const saveStep = useMutation(api.onboarding.saveOnboardingStep)
   const completeMutation = useMutation(api.onboarding.completeOnboarding)
   const generateUploadUrl = useMutation(api.upload.generateUploadUrl)

  useEffect(() => {
    if (onboardingState && !loaded && onboardingState.data) {
      if (onboardingState.data.companyName) {
        const d = onboardingState.data
        setFormData(prev => ({
          ...prev,
          companyName: d.companyName || "",
          vatNumber: d.vatNumber || "",
          employeeCount: d.employeeCount ?? null,
          country: d.country || "",
          city: d.city || "",
          address: d.address || "",
          specializations: d.specializations || [],
          materialsUsed: d.materialsUsed || [],
          hardwareBrands: d.hardwareBrands || [],
          profileDescription: d.profileDescription || "",
          website: d.website || "",
          logo: d.logo || "",
          contactPhone: d.contactPhone || "",
          accountType: onboardingState.accountType as AccountType,
        }))
      }
      setCurrentStep(onboardingState.step || 1)
      setLoaded(true)
    }
  }, [onboardingState, loaded])

  if (!orgId || !onboardingState) return <PageSkeleton />
  if (loaded && !onboardingState.needsOnboarding) {
    router.push(getDefaultRouteForRole(user?.role as any || "admin"))
    return null
  }

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveStep = async (num: number) => {
    if (!orgId || !user?.email) return
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      if (num === 1) payload.accountType = formData.accountType
      if (num === 2) { payload.companyName = formData.companyName; payload.vatNumber = formData.vatNumber || undefined; payload.employeeCount = formData.employeeCount ?? undefined }
      if (num === 3) payload.specializations = formData.specializations
      if (num === 4) payload.materialsUsed = [...formData.materialsUsed, ...(otherMaterial ? [`Altro: ${otherMaterial}`] : [])]
      if (num === 5) payload.hardwareBrands = [...formData.hardwareBrands, ...(otherHardware ? [`Altro: ${otherHardware}`] : [])]
      if (num === 6) { payload.country = formData.country; payload.city = formData.city || undefined; payload.address = formData.address || undefined; payload.contactPhone = formData.contactPhone || undefined; payload.website = formData.website || undefined }
      if (num === 7) payload.profileDescription = formData.profileDescription || undefined
      await saveStep({ organizationId: orgId, userEmail: user.email, stepData: payload })
    } catch { toast.error("Errore nel salvataggio") }
    finally { setSaving(false) }
  }

  const handleLogoUpload = async (file: File) => {
    if (!orgId || !user?.email) return
    setUploadingLogo(true)
    try {
      const uploadUrl = await generateUploadUrl({ organizationId: orgId, userEmail: user.email })
      const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file })
      if (!result.ok) throw new Error("Upload fallito")
      const { storageId } = await result.json()
      updateField("logo", storageId)
      toast.success("Logo caricato")
    } catch { toast.error("Errore upload logo") }
    finally { setUploadingLogo(false) }
  }

  const handleNext = async () => {
    await handleSaveStep(currentStep)
    setCurrentStep(prev => Math.min(prev + 1, 8))
  }

  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const handleComplete = async () => {
    if (!orgId || !user?.email || !formData.accountType) return
     setCompleting(true)
     try {
       await completeMutation({
         organizationId: orgId, userEmail: user?.email || "", accountType: formData.accountType,
         companyName: formData.companyName,
         vatNumber: formData.vatNumber || undefined,
         employeeCount: formData.employeeCount ?? undefined,
         country: formData.country, city: formData.city || undefined, address: formData.address || undefined,
         specializations: formData.specializations.length ? formData.specializations : undefined,
         materialsUsed: [...formData.materialsUsed, ...(otherMaterial ? [`Altro: ${otherMaterial}`] : [])],
         hardwareBrands: [...formData.hardwareBrands, ...(otherHardware ? [`Altro: ${otherHardware}`] : [])],
         profileDescription: formData.profileDescription || undefined,
         website: formData.website || undefined, logo: formData.logo || undefined,
         contactPhone: formData.contactPhone || undefined,
       })
       const secure = window.location.protocol === "https:" ? "; Secure" : ""
       document.cookie = `kranely_session_data=${encodeURIComponent(JSON.stringify({ role: user?.role || "admin", organizationId: orgId, onboardingCompleted: true, accountType: formData.accountType }))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`
       toast.success("Onboarding completato!")
       router.push(getDefaultRouteForRole(user?.role as any || "admin"))
    } catch (e: any) { toast.error(e.message || "Errore nel completamento") }
    finally { setCompleting(false) }
  }

  const toggleTag = (field: "specializations" | "materialsUsed" | "hardwareBrands", value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value],
    }))
  }

  const progress = ((currentStep - 1) / 7) * 100

  const stepIcon = (num: number) => {
    const s = STEPS.find(st => st.num === num)
    if (!s) return null
    const Icon = s.icon
    return <Icon className="w-5 h-5" />
  }

  return (
    <div className="min-h-screen bg-kranely-app-bg">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/[0.02] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Image src="/kranely-logo.png" alt="Kranely" width={28} height={28} className="object-contain" />
          <span className="text-sm text-white/40 ml-auto">Passo {currentStep} di 8</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-5xl mx-auto px-6 pt-4">
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Step sidebar — desktop */}
        <nav className="hidden lg:flex flex-col gap-1 w-56 shrink-0">
          {STEPS.map(s => {
            const Icon = s.icon
            const isActive = currentStep === s.num
            const isPast = currentStep > s.num
            return (
              <button
                key={s.num}
                onClick={() => { if (isPast) setCurrentStep(s.num) }}
                disabled={!isPast && !isActive}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-all",
                  isActive && "bg-kranely-accent/10 text-kranely-accent border border-kranely-accent/20",
                  isPast && "text-white/60 hover:text-white/80 cursor-pointer",
                  !isPast && !isActive && "text-white/30"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                  isActive && "bg-kranely-accent text-kranely-app-bg border-kranely-accent",
                  isPast && "border-green-500/50 text-green-400 bg-green-500/10",
                  !isPast && !isActive && "border-white/20 text-white/30"
                )}>
                  {isPast ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="font-medium">{s.title}</span>
              </button>
            )
          })}
        </nav>

        {/* Mobile step indicator */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {STEPS.map(s => (
            <div key={s.num} className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap",
              currentStep === s.num && "bg-kranely-accent/20 text-kranely-accent border border-kranely-accent/30",
              currentStep > s.num && "bg-green-500/10 text-green-400",
              currentStep < s.num && "text-white/30 bg-white/5"
            )}>
              {currentStep > s.num ? <Check className="w-3 h-3" /> : stepIcon(s.num)}
              <span>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="p-6 lg:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            {/* Step 1: Account Type */}
            {currentStep === 1 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Benvenuto in Kranely</h2>
                  <p className="text-white/50 mt-1">Prima di iniziare, raccontaci di pi&ugrave; sulla tua attivit&agrave;</p>
                </div>
                <div>
                  <Label className="text-base">Tipo di Account</Label>
                  <p className="text-sm text-white/40 mb-4">Seleziona il tipo che descrive meglio la tua azienda</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => updateField("accountType", "manufacturer")}
                      className={cn(
                        "relative p-6 rounded-xl border-2 text-left transition-all",
                        formData.accountType === "manufacturer"
                          ? "border-kranely-accent bg-kranely-accent/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      {formData.accountType === "manufacturer" && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-kranely-accent flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-kranely-app-bg" />
                        </div>
                      )}
                      <div className="w-12 h-12 rounded-lg bg-kranely-accent/20 flex items-center justify-center mb-4">
                        <Factory className="w-6 h-6 text-kranely-accent" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">Produttore</h3>
                      <p className="text-sm text-white/50">Produco e installo infissi, porte e finestre. Ho un&apos;officina e personale tecnico.</p>
                    </button>
                    <button
                      onClick={() => updateField("accountType", "reseller")}
                      className={cn(
                        "relative p-6 rounded-xl border-2 text-left transition-all",
                        formData.accountType === "reseller"
                          ? "border-kranely-accent bg-kranely-accent/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      {formData.accountType === "reseller" && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-kranely-accent flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-kranely-app-bg" />
                        </div>
                      )}
                      <div className="w-12 h-12 rounded-lg bg-kranely-accent/20 flex items-center justify-center mb-4">
                        <Store className="w-6 h-6 text-kranely-accent" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">Rivenditore</h3>
                      <p className="text-sm text-white/50">Rivendo infissi e serramenti ai clienti finali. Collaboro con produttori esterni.</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Company Info */}
            {currentStep === 2 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Informazioni Azienda</h2>
                  <p className="text-white/50 mt-1">Dati principali della tua attivit&agrave;</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Nome Azienda</Label>
                    <Input
                      value={formData.companyName}
                      onChange={e => updateField("companyName", e.target.value)}
                      placeholder="es. Rossi Infissi SRL"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Partita IVA</Label>
                    <Input
                      value={formData.vatNumber}
                      onChange={e => updateField("vatNumber", e.target.value)}
                      placeholder="IT01234567890"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Numero Dipendenti</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.employeeCount ?? ""}
                      onChange={e => updateField("employeeCount", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="es. 15"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Specializations */}
            {currentStep === 3 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Specializzazioni</h2>
                  <p className="text-white/50 mt-1">Seleziona le aree in cui operi</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(spec => (
                    <button
                      key={spec}
                      onClick={() => toggleTag("specializations", spec)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm border transition-all",
                        formData.specializations.includes(spec)
                          ? "bg-kranely-accent/20 border-kranely-accent/40 text-kranely-accent"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                      )}
                    >
                      {formData.specializations.includes(spec) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Materials */}
            {currentStep === 4 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Materiali Utilizzati</h2>
                  <p className="text-white/50 mt-1">Serie di profili PVC con cui lavori</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MATERIAL_BRANDS.map(m => (
                    <button
                      key={m}
                      onClick={() => toggleTag("materialsUsed", m)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm border transition-all",
                        formData.materialsUsed.includes(m)
                          ? "bg-kranely-accent/20 border-kranely-accent/40 text-kranely-accent"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                      )}
                    >
                      {formData.materialsUsed.includes(m) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={otherMaterial}
                    onChange={e => setOtherMaterial(e.target.value)}
                    placeholder="Altro (specifica)"
                    className="max-w-xs"
                  />
                  {otherMaterial && (
                    <button
                      onClick={() => { toggleTag("materialsUsed", `Altro: ${otherMaterial}`); setOtherMaterial("") }}
                      className="px-3 py-2 rounded-lg bg-kranely-accent/20 text-kranely-accent text-sm"
                    >
                      Aggiungi
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Hardware */}
            {currentStep === 5 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Ferramenta</h2>
                  <p className="text-white/50 mt-1">Marche di ferramenta che utilizzi</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {HARDWARE_BRANDS.map(h => (
                    <button
                      key={h}
                      onClick={() => toggleTag("hardwareBrands", h)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm border transition-all",
                        formData.hardwareBrands.includes(h)
                          ? "bg-kranely-accent/20 border-kranely-accent/40 text-kranely-accent"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                      )}
                    >
                      {formData.hardwareBrands.includes(h) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                      {h}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={otherHardware}
                    onChange={e => setOtherHardware(e.target.value)}
                    placeholder="Altro (specifica)"
                    className="max-w-xs"
                  />
                  {otherHardware && (
                    <button
                      onClick={() => { toggleTag("hardwareBrands", `Altro: ${otherHardware}`); setOtherHardware("") }}
                      className="px-3 py-2 rounded-lg bg-kranely-accent/20 text-kranely-accent text-sm"
                    >
                      Aggiungi
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Contacts */}
            {currentStep === 6 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Contatti e Localit&agrave;</h2>
                  <p className="text-white/50 mt-1">Dove operi e come contattarti</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Paese</Label>
                    <Select value={formData.country} onChange={e => updateField("country", e.target.value)} className="mt-1">
                      <option value="">Seleziona paese</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Citt&agrave;</Label>
                    <Input
                      value={formData.city}
                      onChange={e => updateField("city", e.target.value)}
                      placeholder="es. Milano"
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Indirizzo</Label>
                    <Input
                      value={formData.address}
                      onChange={e => updateField("address", e.target.value)}
                      placeholder="Via / Piazza, n. civico"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Telefono</Label>
                    <Input
                      value={formData.contactPhone}
                      onChange={e => updateField("contactPhone", e.target.value)}
                      placeholder="+39 123 456 7890"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Sito Web</Label>
                    <Input
                      value={formData.website}
                      onChange={e => updateField("website", e.target.value)}
                      placeholder="https://www.rossiinfissi.it"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Description */}
            {currentStep === 7 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Descrizione Profilo</h2>
                  <p className="text-white/50 mt-1">Presenta la tua azienda ai potenziali partner</p>
                </div>
                <div>
                  <Label>Descrizione</Label>
                  <Textarea
                    value={formData.profileDescription}
                    onChange={e => updateField("profileDescription", e.target.value)}
                    placeholder="Descrivi la tua attivit&agrave;, la tua esperienza, le certificazioni..."
                    className="mt-1 min-h-[160px]"
                  />
                  <p className="text-xs text-white/30 mt-2">
                    Questa descrizione sar&agrave; visibile nel tuo profilo pubblico nella rete Kranely.
                  </p>
                </div>
              </div>
            )}

            {/* Step 8: Summary */}
            {currentStep === 8 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Riepilogo</h2>
                  <p className="text-white/50 mt-1">Verifica i dati e carica il logo aziendale</p>
                </div>

                {/* Logo upload */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <Label>Logo Aziendale</Label>
                  <div className="mt-3 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.logo ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${formData.logo}`}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-white/30" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="border-white/20"
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {formData.logo ? "Cambia Logo" : "Carica Logo"}
                      </Button>
                      <p className="text-xs text-white/30 mt-2">PNG, JPG o WebP. Quadrato consigliato.</p>
                    </div>
                  </div>
                </div>

                {/* Data summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SummaryCard label="Tipo Account" value={formData.accountType === "manufacturer" ? "Produttore" : "Rivenditore"} />
                  <SummaryCard label="Azienda" value={formData.companyName} />
                  {formData.vatNumber && <SummaryCard label="Partita IVA" value={formData.vatNumber} />}
                  {formData.employeeCount != null && <SummaryCard label="Dipendenti" value={String(formData.employeeCount)} />}
                  <SummaryCard label="Paese" value={formData.country} />
                  {formData.city && <SummaryCard label="Citt&agrave;" value={formData.city} />}
                  {formData.contactPhone && <SummaryCard label="Telefono" value={formData.contactPhone} />}
                  {formData.website && <SummaryCard label="Sito Web" value={formData.website} />}
                  <div className="sm:col-span-2">
                    <SummaryCard
                      label="Specializzazioni"
                      value={formData.specializations.length ? formData.specializations.join(", ") : "Nessuna"}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <SummaryCard
                      label="Materiali"
                      value={formData.materialsUsed.length ? [...formData.materialsUsed, ...(otherMaterial ? [`Altro: ${otherMaterial}`] : [])].join(", ") : "Nessuno"}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <SummaryCard
                      label="Ferramenta"
                      value={formData.hardwareBrands.length ? [...formData.hardwareBrands, ...(otherHardware ? [`Altro: ${otherHardware}`] : [])].join(", ") : "Nessuna"}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              onClick={handlePrev}
              disabled={currentStep === 1}
              variant="outline"
              className="border-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Indietro
            </Button>

            <div className="flex items-center gap-3">
              {currentStep < 8 && (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !formData.accountType) ||
                    (currentStep === 2 && !formData.companyName.trim()) ||
                    saving
                  }
                  className="bg-kranely-accent text-kranely-app-bg hover:brightness-110"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Avanti <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {currentStep === 8 && (
                <Button
                  onClick={handleComplete}
                  disabled={completing || !formData.accountType || !formData.companyName.trim() || !formData.country}
                  className="bg-green-500 text-white hover:bg-green-600"
                >
                  {completing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Completa
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  )
}
