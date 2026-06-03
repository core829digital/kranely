"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Input, Label } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  Search, SlidersHorizontal, X, Building2, Store, MapPin,
  Briefcase, Package, Wrench, Globe, Users, ChevronDown, Filter,
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

export default function NetworkPage() {
  const { user } = useAuth()
  const orgId = useOrgId()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterAccountType, setFilterAccountType] = useState("")
  const [filterCountry, setFilterCountry] = useState("")
  const [filterSpecializations, setFilterSpecializations] = useState<string[]>([])
  const [filterMaterials, setFilterMaterials] = useState<string[]>([])
  const [filterHardware, setFilterHardware] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const results = useQuery(
    api.network.searchNetwork,
    {
      searchQuery: searchQuery || undefined,
      accountType: (filterAccountType as "manufacturer" | "reseller") || undefined,
      country: filterCountry || undefined,
      specializations: filterSpecializations.length > 0 ? filterSpecializations : undefined,
      materialsUsed: filterMaterials.length > 0 ? filterMaterials : undefined,
      hardwareBrands: filterHardware.length > 0 ? filterHardware : undefined,
    },
  )

  const hasActiveFilters = filterAccountType || filterCountry ||
    filterSpecializations.length > 0 || filterMaterials.length > 0 || filterHardware.length > 0

  const clearFilters = () => {
    setFilterAccountType(""); setFilterCountry("")
    setFilterSpecializations([]); setFilterMaterials([]); setFilterHardware([])
  }

  const toggleArrayFilter = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  const renderTag = (label: string) => {
    if (label.startsWith("Altro: ")) return label.slice(7)
    const parts = label.match(/^([^(]+)\(/)
    return parts ? parts[1].trim() : label
  }

  if (!orgId) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rete Kranely</h1>
        <p className="text-white/50 mt-1">Trova partner e fornitori nella rete Kranely</p>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca azienda o descrizione..."
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className={cn("border-white/10 gap-2", showFilters && "bg-kranely-accent/10 border-kranely-accent/30")}
        >
          <Filter className="w-4 h-4" />
          Filtri
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-kranely-accent text-kranely-app-bg text-xs flex items-center justify-center font-bold">
              {[filterAccountType, filterCountry, ...filterSpecializations, ...filterMaterials, ...filterHardware].filter(Boolean).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-white/40 hover:text-white/60 transition-colors">
            Cancella filtri
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] animate-fade-in space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={filterAccountType} onChange={e => setFilterAccountType(e.target.value)} className="mt-1">
                <option value="">Tutti</option>
                <option value="manufacturer">Produttori</option>
                <option value="reseller">Rivenditori</option>
              </Select>
            </div>
            <div>
              <Label>Paese</Label>
              <Select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="mt-1">
                <option value="">Tutti</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm text-white/60">Specializzazioni</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SPECIALIZATIONS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArrayFilter(setFilterSpecializations, s)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs border transition-all",
                    filterSpecializations.includes(s)
                      ? "bg-kranely-accent/20 border-kranely-accent/40 text-kranely-accent"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-white/60">Materiali</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {MATERIAL_BRANDS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleArrayFilter(setFilterMaterials, m)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs border transition-all",
                    filterMaterials.includes(m)
                      ? "bg-kranely-accent/20 border-kranely-accent/40 text-kranely-accent"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                  )}
                >
                  {renderTag(m)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-white/60">Ferramenta</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {HARDWARE_BRANDS.map(h => (
                <button
                  key={h}
                  onClick={() => toggleArrayFilter(setFilterHardware, h)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs border transition-all",
                    filterHardware.includes(h)
                      ? "bg-kranely-accent/20 border-kranely-accent/40 text-kranely-accent"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!results ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-xl bg-white/[0.02] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">Nessun risultato trovato</p>
          <p className="text-white/30 text-sm mt-1">Prova a modificare i filtri o la ricerca</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-white/40">
            {results.length} {results.length === 1 ? "azienda trovata" : "aziende trovate"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(org => (
              <div
                key={org._id}
                className="p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {org.logo ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${org.logo}`}
                        alt={org.companyName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-white/30" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold truncate">{org.companyName}</h3>
                      <span className={cn(
                        "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                        org.accountType === "manufacturer"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-green-500/10 text-green-400 border border-green-500/20"
                      )}>
                        {org.accountType === "manufacturer" ? "Produttore" : "Rivenditore"}
                      </span>
                    </div>
                    {(org.country || org.city) && (
                      <p className="text-xs text-white/40 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {[org.city, org.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {org.specializations && org.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {org.specializations.slice(0, 3).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50 border border-white/10">
                            {s}
                          </span>
                        ))}
                        {org.specializations.length > 3 && (
                          <span className="text-[10px] text-white/30">+{org.specializations.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {org.profileDescription && (
                  <p className="text-sm text-white/50 mt-3 line-clamp-2 leading-relaxed">
                    {org.profileDescription}
                  </p>
                )}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-kranely-accent/70 hover:text-kranely-accent mt-2 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <Globe className="w-3 h-3" />
                    {org.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
