"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useOrgId } from "@/hooks/useOrgId"
import { useAuth } from "@/lib/auth/auth-context"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageSkeleton } from "@/components/Skeletons"
import { Search, Activity, User as UserIcon, FileText, Building2, Truck, Shield, CreditCard, HardHat, Package } from "lucide-react"

const entityIcons: Record<string, any> = {
  client: UserIcon, cantiere: Building2, quote: FileText,
  supplier: Truck, certificate: Shield, payment: CreditCard,
  collaborator: HardHat, delivery: Package,
}

const entityLabels: Record<string, string> = {
  client: "Cliente", cantiere: "Cantiere", quote: "Preventivo",
  supplier: "Fornitore", certificate: "Certificato", payment: "Pagamento",
  collaborator: "Collaboratore", delivery: "Consegna", document: "Documento",
  order: "Ordine", appointment: "Appuntamento",
}

export default function ActivityLogPage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const [search, setSearch] = useState("")
  const [entityFilter, setEntityFilter] = useState("all")

  const activities = useQuery(api.activityLog.list, orgId ? { organizationId: orgId } : "skip")

  if (user?.role !== "admin" && user?.role !== "superadmin") {
    return <div className="p-12 text-center text-white/40"><Activity className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Accesso non autorizzato</p></div>
  }

  if (!activities) return <PageSkeleton />

  const filtered = activities.filter((a) => {
    if (entityFilter !== "all" && a.entityType !== entityFilter) return false
    if (!search) return true
    const s = search.toLowerCase()
    return (a.action || "").toLowerCase().includes(s) || (a.entityName || "").toLowerCase().includes(s) || (a.userEmail || "").toLowerCase().includes(s) || (a.details || "").toLowerCase().includes(s)
  })

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Registro Attività</h1><p className="text-white/60 mt-1">Storico completo delle operazioni eseguite</p></div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca attività..." className="pl-10" />
        </div>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-kranely-accent/50">
          <option value="all">Tutti i tipi</option>
          {Object.entries(entityLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-white/40"><Activity className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessuna attività trovata</p></div>
        ) : (
          filtered.map((a) => {
            const Icon = entityIcons[a.entityType as keyof typeof entityIcons] || Activity
            return (
              <div key={a._id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-start gap-3 hover:bg-white/[0.04] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white capitalize">{a.action}</span>
                    <Badge variant="secondary" className="text-[10px]">{entityLabels[a.entityType] || a.entityType}</Badge>
                    {a.entityName && <span className="text-sm text-white/60 truncate max-w-[200px]">&quot;{a.entityName}&quot;</span>}
                  </div>
                  {a.details && <p className="text-xs text-white/40 mt-1">{a.details}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/30">
                    <span>{a.userEmail}</span>
                    <span>{new Date(a._creationTime).toLocaleString("it-IT")}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-white/30 text-center">{filtered.length} attività trovate</p>
    </div>
  )
}
