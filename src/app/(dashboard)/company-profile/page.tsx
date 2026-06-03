"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { Button } from "@/components/ui/button"
import { Input, Textarea, Label } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Building2, Save, Upload, Loader2, Camera, X, Check,
  Pencil, Eye, EyeOff
} from "lucide-react"

const COUNTRIES = [
  "Italia", "Germania", "Austria", "Svizzera", "Francia", "Spagna",
  "Belgio", "Paesi Bassi", "Polonia", "Romania",
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

export default function CompanyProfilePage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profile = useQuery(
    api.organizations.getPublicProfile,
    orgId ? { orgId, userEmail: user?.email } : "skip",
  )
  const updateProfile = useMutation(api.organizations.updateCompanyProfile)
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)

  const [companyName, setCompanyName] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [employeeCount, setEmployeeCount] = useState<number | null>(null)
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [specializations, setSpecializations] = useState<string[]>([])
  const [materialsUsed, setMaterialsUsed] = useState<string[]>([])
  const [hardwareBrands, setHardwareBrands] = useState<string[]>([])
  const [profileDescription, setProfileDescription] = useState("")
  const [website, setWebsite] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [logo, setLogo] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (profile && !loaded) {
      setCompanyName(profile.companyName || "")
      setVatNumber(profile.vatNumber || "")
      setEmployeeCount(profile.employeeCount ?? null)
      setCountry(profile.country || "")
      setCity(profile.city || "")
      setAddress("")
      setSpecializations(profile.specializations || [])
      setMaterialsUsed(profile.materialsUsed || [])
      setHardwareBrands(profile.hardwareBrands || [])
      setProfileDescription(profile.profileDescription || "")
      setWebsite(profile.website || "")
      setContactPhone(profile.contactPhone || "")
      setLogo(profile.logo || "")
      setLoaded(true)
    }
  }, [profile, loaded])

  const handleLogoUpload = async (file: File) => {
    if (!orgId || !user?.email) return
    setUploadingLogo(true)
    try {
      const uploadUrl = await generateUploadUrl({ organizationId: orgId, userEmail: user.email })
      const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file })
      if (!result.ok) throw new Error("Upload fallito")
      const { storageId } = await result.json()
      setLogo(storageId)
      toast.success("Logo caricato")
    } catch { toast.error("Errore upload logo") }
    finally { setUploadingLogo(false) }
  }

  const handleSave = async () => {
    if (!orgId || !user?.email) return
    if (!companyName.trim()) { toast.error("Il nome azienda è obbligatorio"); return }
    setSaving(true)
    try {
      await updateProfile({
        id: orgId, userEmail: user.email,
        companyName: companyName.trim(),
        vatNumber: vatNumber || undefined,
        employeeCount: employeeCount ?? undefined,
        country, city: city || undefined, address: address || undefined,
        specializations: specializations.length > 0 ? specializations : undefined,
        materialsUsed: materialsUsed.length > 0 ? materialsUsed : undefined,
        hardwareBrands: hardwareBrands.length > 0 ? hardwareBrands : undefined,
        profileDescription: profileDescription || undefined,
        website: website || undefined, logo: logo || undefined,
        contactPhone: contactPhone || undefined,
      })
      toast.success("Profilo aggiornato")
    } catch (e: any) { toast.error(e.message || "Errore nel salvataggio") }
    finally { setSaving(false) }
  }

  const toggleTag = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value])
  }

  if (!orgId || !profile) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profilo Azienda</h1>
          <p className="text-white/50 mt-1">Il tuo profilo pubblico nella rete Kranely</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPreview(!preview)}
            variant="outline"
            className="border-white/10 gap-2"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? "Modifica" : "Anteprima"}
          </Button>
          {!preview && (
            <Button onClick={handleSave} disabled={saving} className="bg-kranely-accent text-kranely-app-bg gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salva
            </Button>
          )}
        </div>
      </div>

      {preview ? (
        /* Preview card — matches the network search card style */
        <div className="max-w-lg p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {logo ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${logo}`}
                  alt={companyName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-7 h-7 text-white/30" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold truncate">{companyName || "Nome Azienda"}</h3>
                <span className={cn(
                  "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                  profile.accountType === "manufacturer"
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-green-500/10 text-green-400 border border-green-500/20"
                )}>
                  {profile.accountType === "manufacturer" ? "Produttore" : "Rivenditore"}
                </span>
              </div>
              {(country || city) && (
                <p className="text-xs text-white/40 mb-2">{city && `${city}, `}{country}</p>
              )}
              {specializations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {specializations.slice(0, 4).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50 border border-white/10">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {profileDescription && (
            <p className="text-sm text-white/50 mt-3 leading-relaxed">{profileDescription}</p>
          )}
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-kranely-accent/70 hover:text-kranely-accent mt-2">
              {website}
            </a>
          )}
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Logo */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
            <Label>Logo Aziendale</Label>
            <div className="mt-3 flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {logo ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${logo}`}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-white/30" />
                )}
              </div>
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }} />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="border-white/20" disabled={uploadingLogo}>
                  {uploadingLogo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {logo ? "Cambia Logo" : "Carica Logo"}
                </Button>
                {logo && (
                  <button onClick={() => setLogo("")} className="ml-2 text-xs text-red-400/60 hover:text-red-400">Rimuovi</button>
                )}
                <p className="text-xs text-white/30 mt-2">PNG, JPG o WebP. Quadrato consigliato.</p>
              </div>
            </div>
          </div>

          {/* Company info */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-lg font-semibold text-white">Informazioni</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nome Azienda</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Partita IVA</Label>
                <Input value={vatNumber} onChange={e => setVatNumber(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Dipendenti</Label>
                <Input type="number" min={0} value={employeeCount ?? ""} onChange={e => setEmployeeCount(e.target.value ? parseInt(e.target.value) : null)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-lg font-semibold text-white">Sede</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Paese</Label>
                <Select value={country} onChange={e => setCountry(e.target.value)} className="mt-1">
                  <option value="">Seleziona</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label>Città</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Indirizzo</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-lg font-semibold text-white">Specializzazioni</h2>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(s => (
                <button key={s} onClick={() => toggleTag(specializations, setSpecializations, s)}
                  className={cn("px-4 py-2 rounded-full text-sm border transition-all",
                    specializations.includes(s)
                      ? "bg-kranely-accent/20 border-kranely-accent/40 text-kranely-accent"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                  )}>
                  {specializations.includes(s) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-lg font-semibold text-white">Materiali Utilizzati</h2>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_BRANDS.map(m => (
                <button key={m} onClick={() => toggleTag(materialsUsed, setMaterialsUsed, m)}
                  className={cn("px-4 py-2 rounded-full text-sm border transition-all",
                    materialsUsed.includes(m)
                      ? "bg-kranely-accent/20 border-kranely-accent/40 text-kranely-accent"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                  )}>
                  {materialsUsed.includes(m) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Hardware */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-lg font-semibold text-white">Ferramenta</h2>
            <div className="flex flex-wrap gap-2">
              {HARDWARE_BRANDS.map(h => (
                <button key={h} onClick={() => toggleTag(hardwareBrands, setHardwareBrands, h)}
                  className={cn("px-4 py-2 rounded-full text-sm border transition-all",
                    hardwareBrands.includes(h)
                      ? "bg-kranely-accent/20 border-kranely-accent/40 text-kranely-accent"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                  )}>
                  {hardwareBrands.includes(h) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-lg font-semibold text-white">Contatti</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Telefono</Label>
                <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Sito Web</Label>
                <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" className="mt-1" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-lg font-semibold text-white">Descrizione</h2>
            <Textarea
              value={profileDescription}
              onChange={e => setProfileDescription(e.target.value)}
              placeholder="Descrivi la tua attività..."
              className="min-h-[120px]"
            />
            <p className="text-xs text-white/30">Questa descrizione sarà visibile nel profilo pubblico.</p>
          </div>

          {/* Save sticky footer */}
          <div className="sticky bottom-0 py-4 bg-kranely-app-bg border-t border-white/10 -mx-6 px-6">
            <Button onClick={handleSave} disabled={saving} className="bg-kranely-accent text-kranely-app-bg gap-2 w-full sm:w-auto">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salva Profilo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
