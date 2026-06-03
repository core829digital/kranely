"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, FileText, Download, Building2, Lock, Clock, Package, Truck, Factory, ChevronDown, ChevronRight } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { Doc } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/auth-context"
import { safeWindowOpen } from "@/lib/utils"

const PHASE_LABELS: Record<string, string> = {
  materiali_ricevuti: "Materiali Ricevuti",
  taglio: "Taglio",
  assemblaggio: "Assemblaggio",
  controllo_qualita: "Controllo Qualità",
  pronto: "Pronto",
}

const PHASE_ORDER = ["materiali_ricevuti", "taglio", "assemblaggio", "controllo_qualita", "pronto"]

const phaseColor = (phase: string) => {
  const idx = PHASE_ORDER.indexOf(phase)
  if (idx === -1) return "bg-white/20"
  const colors = ["bg-amber-500", "bg-blue-500", "bg-purple-500", "bg-cyan-500", "bg-green-500"]
  return colors[idx] || "bg-white/20"
}

const statusColors: Record<string, string> = {
  draft: "text-white/40", sent: "text-kranely-accent", accepted: "text-green-400",
  rejected: "text-red-400", in_lavorazione: "text-blue-400", completato: "text-green-400",
}

const entityTypeLabels: Record<string, string> = {
  client: "Cliente",
  cantiere: "Cantiere",
  quote: "Preventivo",
  supplier: "Fornitore",
}

const quoteStatusLabels: Record<string, string> = {
  draft: "Bozza",
  sent: "Inviato",
  accepted: "Approvato",
  rejected: "Rifiutato",
  in_lavorazione: "In Lavorazione",
  completato: "Completato",
}

export default function PrivateAreaPage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const [search, setSearch] = useState("")
  const [selectedQuote, setSelectedQuote] = useState<Doc<"quotes"> | null>(null)

  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const allQuotes = useQuery(api.quotes.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const documents = useQuery(api.documents.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const payments = useQuery(api.payments.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const allOrders = useQuery(api.supplierOrders.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const allProduction = useQuery(api.supplierProduction.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const allDeliveries = useQuery(api.supplierDeliveries.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")

  const isAdmin = user?.role === "admin" || user?.role === "superadmin"
  const myClient = clients?.find((c) => c.email === user?.email)
  const clientId = myClient?._id

  const quotes = isAdmin ? allQuotes : allQuotes?.filter((q) => clientId && q.clientId === clientId)
  const myCantieri = isAdmin ? cantieri : cantieri?.filter((c) => clientId && c.clientId === clientId)
  const myDocs = isAdmin ? documents : documents?.filter((d) => clientId && d.clientId === clientId)
  const myPayments = isAdmin ? payments : payments?.filter((p) => clientId && p.clientId === clientId)

  const cantiereIds = useMemo(() => new Set(myCantieri?.map((c) => c._id) || []), [myCantieri])
  const myOrders = allOrders?.filter((o) => o.cantiereId && cantiereIds.has(o.cantiereId)) || []
  const orderIds = useMemo(() => new Set(myOrders.map((o) => o._id)), [myOrders])
  const myProduction = allProduction?.filter((p) => p.orderId && orderIds.has(p.orderId)) || []
  const myDeliveries = allDeliveries?.filter((d) => (d.cantiereId && cantiereIds.has(d.cantiereId)) || (d.orderId && orderIds.has(d.orderId))) || []

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const toggleOrder = (id: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const productionByOrder = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const p of myProduction) {
      const oid = p.orderId
      if (oid) {
        if (!map.has(oid)) map.set(oid, [])
        map.get(oid)!.push(p)
      }
    }
    return map
  }, [myProduction])

  const filteredQuotes = (quotes || [])?.filter((q) => {
    if (!search) return true; const s = search.toLowerCase()
    return (q.title || "").toLowerCase().includes(s) || (q.fullName || "").toLowerCase().includes(s) || (q.email || "").toLowerCase().includes(s)
  })

  const filteredDocs = (myDocs || [])?.filter((d) => {
    if (!search) return true; return (d.title || d.name || "").toLowerCase().includes(search.toLowerCase())
  })

  if (!orgId || !allQuotes) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Area Riservata</h1><p className="text-white/60 mt-1">Documenti e preventivi condivisi con il cliente</p></div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca..." className="pl-10" /></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Preventivi</span></div><p className="text-xl font-bold text-kranely-accent">{quotes?.length || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Cantieri</span></div><p className="text-xl font-bold text-green-400">{myCantieri?.length || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">Documenti</span></div><p className="text-xl font-bold text-blue-400">{myDocs?.length || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-purple-400" /><span className="text-sm text-white/60">Pagamenti</span></div><p className="text-xl font-bold text-purple-400">{myPayments?.length || 0}</p></div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-kranely-accent" /> Preventivi</h2>
        <div className="space-y-3">
          {filteredQuotes.map((quote) => (
            <div key={quote._id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]" onClick={() => setSelectedQuote(quote)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-medium text-white">{quote.title || "Preventivo"}</h3><span className={`text-xs font-medium ${statusColors[quote.status] || "text-white/40"}`}>{quoteStatusLabels[quote.status] || quote.status}</span></div>
                  {quote.fullName && <p className="text-sm text-white/60 mt-1">{quote.fullName}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                    {quote.estimatedPrice && <span>Importo: EUR{quote.estimatedPrice.toLocaleString("it-IT")}</span>}
                    {quote.clientId && <span>Cliente: <Link href="/clients" className="text-kranely-accent hover:underline">Vai</Link></span>}
                    {quote.cantiereId && <span>Cantiere: <Link href="/cantieri" className="text-kranely-accent hover:underline">Vai</Link></span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={quote.status === "accepted" ? "success" : quote.status === "rejected" ? "destructive" : "secondary"}>{quoteStatusLabels[quote.status] || quote.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-400" /> Documenti Condivisi</h2>
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div key={doc._id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-400" /></div>
                  <div><h3 className="text-sm font-medium text-white">{doc.title || doc.fileName || "Documento"}</h3><p className="text-xs text-white/40">{doc.type || ""} - {new Date(doc._creationTime).toLocaleDateString("it-IT")}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.entityType && <Badge variant="secondary">{entityTypeLabels[doc.entityType] || doc.entityType}</Badge>}
                  <Button size="sm" variant="outline" className="border-white/10 bg-white text-black hover:bg-white/90" title="Scarica" aria-label="Scarica" onClick={() => safeWindowOpen(doc.fileUrl)}><Download className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {myOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Package className="w-5 h-5 text-violet-400" />Stato Ordini e Produzione</h2>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/10">
            {myOrders.map((o) => {
              const prods = productionByOrder.get(o._id) || []
              const isExpanded = expandedOrders.has(o._id)
              const totalProgress = prods.length > 0
                ? Math.round(prods.reduce((s, p) => s + (p.progressPercentage || 0), 0) / prods.length)
                : o.status === "delivered" ? 100 : o.status === "shipped" ? 85 : o.status === "in_production" ? 40 : 10
              return (
                <div key={o._id} className="p-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => prods.length > 0 && toggleOrder(o._id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {prods.length > 0 && <span className="text-white/30 shrink-0">{isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</span>}
                        <p className="text-sm text-white font-medium truncate">{o.description || `Ordine #${o._id.slice(-6)}`}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 max-w-[200px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${totalProgress >= 100 ? "bg-green-500" : totalProgress >= 50 ? "bg-violet-500" : "bg-amber-500"}`} style={{ width: `${Math.min(totalProgress, 100)}%` }} />
                        </div>
                        <span className="text-xs text-white/40">{totalProgress}%</span>
                      </div>
                    </div>
                    <Badge className={o.status === "delivered" ? "bg-green-500/20 text-green-400" : o.status === "shipped" ? "bg-cyan-500/20 text-cyan-400" : o.status === "in_production" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}>
                      {o.status === "delivered" ? "Consegnato" : o.status === "shipped" ? "Spedito" : o.status === "in_production" ? "In Produzione" : o.status === "confirmed" ? "Confermato" : "In Attesa"}
                    </Badge>
                  </div>
                  {isExpanded && prods.length > 0 && (
                    <div className="ml-5 mt-3 space-y-2">
                      {prods.map((p) => {
                        const phaseIdx = PHASE_ORDER.indexOf(p.phase)
                        return (
                          <div key={p._id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-white font-medium">{p.description || "Produzione"}</p>
                              <Badge className={p.status === "completed" ? "bg-green-500/20 text-green-400" : p.status === "in_progress" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}>
                                {p.status === "completed" ? "Completato" : p.status === "in_progress" ? "In Corso" : "In Attesa"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {PHASE_ORDER.map((ph, i) => {
                                const isActive = phaseIdx >= i
                                const isCurrent = phaseIdx === i && p.status === "in_progress"
                                return (
                                  <div key={ph} className="flex-1 flex flex-col items-center gap-1">
                                    <div className={`w-full h-1.5 rounded-full ${isActive && p.status === "completed" ? "bg-green-500" : isCurrent ? "bg-violet-500 animate-pulse" : isActive ? phaseColor(ph) : "bg-white/10"}`} />
                                    <span className={`text-[9px] leading-tight text-center ${isCurrent ? "text-violet-300 font-medium" : isActive ? "text-white/60" : "text-white/20"}`}>{PHASE_LABELS[ph]}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {myDeliveries.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="p-4 border-b border-white/10 flex items-center gap-2"><Truck className="w-4 h-4 text-cyan-400" /><h3 className="text-white font-semibold">Consegne</h3></div>
              <div className="divide-y divide-white/10">
                {myDeliveries.map((d) => (
                  <div key={d._id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{d.description || "Consegna"}</p>
                      <p className="text-xs text-white/40">{d.expectedDate ? new Date(d.expectedDate).toLocaleDateString("it-IT") : ""}{d.deliveryDate ? ` — Effettuata: ${new Date(d.deliveryDate).toLocaleDateString("it-IT")}` : ""}</p>
                    </div>
                    <Badge className={d.status === "consegnato" ? "bg-green-500/20 text-green-400" : d.status === "in_transito" ? "bg-blue-500/20 text-blue-400" : d.status === "partito" ? "bg-cyan-500/20 text-cyan-400" : "bg-yellow-500/20 text-yellow-400"}>
                      {d.status === "consegnato" ? "Consegnato" : d.status === "in_transito" ? "In Transito" : d.status === "partito" ? "Partito" : "Pianificato"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {filteredQuotes.length === 0 && filteredDocs.length === 0 && myOrders.length === 0 && <div className="p-12 text-center text-white/40"><Lock className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun contenuto condiviso</p></div>}

      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selectedQuote?.title || "Preventivo"}</DialogTitle></DialogHeader>
          {selectedQuote && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-white/40">Stato</span><p className="text-white capitalize">{quoteStatusLabels[selectedQuote.status] || selectedQuote.status}</p></div>
                <div><span className="text-xs text-white/40">Tipo</span><p className="text-white">{selectedQuote.quoteType}</p></div>
                {selectedQuote.estimatedPrice && <div><span className="text-xs text-white/40">Importo</span><p className="text-kranely-accent font-semibold">EUR{selectedQuote.estimatedPrice.toLocaleString("it-IT")}</p></div>}
                {selectedQuote.fullName && <div><span className="text-xs text-white/40">Cliente</span><p className="text-white">{selectedQuote.fullName}</p></div>}
                {selectedQuote.email && <div><span className="text-xs text-white/40">Email</span><p className="text-white">{selectedQuote.email}</p></div>}
                {selectedQuote.phone && <div><span className="text-xs text-white/40">Telefono</span><p className="text-white">{selectedQuote.phone}</p></div>}
              </div>
              {selectedQuote.notes && <div><span className="text-xs text-white/40">Note</span><p className="text-white/80 mt-1">{selectedQuote.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
