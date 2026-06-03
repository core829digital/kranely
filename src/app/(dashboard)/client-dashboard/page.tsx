"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { FileText, Building2, CreditCard, CheckCircle2, Clock, AlertCircle, MessageSquare, Eye, Euro, TrendingUp, AlertTriangle, Package, Truck, Factory, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

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

export default function ClientDashboardPage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const [confirmDelivery, setConfirmDelivery] = useState<any>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const confirmDeliveryMut = useMutation(api.supplierDeliveries.confirmByClient)

  const clientData = useQuery(
    api.clientDashboard.getClientDashboard,
    orgId && user?.email ? { organizationId: orgId, clientEmail: user.email, userEmail: user?.email } : "skip"
  )

  if (!orgId || !user) return <PageSkeleton />

  if (!clientData) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-transparent border border-teal-500/20 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative"><h1 className="text-2xl font-bold text-white">Area Cliente</h1><p className="text-white/60 mt-1">Benvenuto, {user.fullName || user.email}</p></div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h2 className="text-xl font-semibold text-white mb-2">Nessun dato trovato</h2>
          <p className="text-white/60 max-w-md mx-auto">
            Non ci sono ancora dati associati al tuo account. Contatta l&apos;amministrazione per associare la tua email ai tuoi cantieri e preventivi.
          </p>
        </div>
      </div>
    )
  }

  const { client, cantieri, payments, quotes, documents, budget, supplierTracking } = clientData

  const toggleOrder = (id: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const productionByOrder = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const p of supplierTracking?.production || []) {
      const oid = p.orderId
      if (oid) {
        if (!map.has(oid)) map.set(oid, [])
        map.get(oid)!.push(p)
      }
    }
    return map
  }, [supplierTracking?.production])

  const handleConfirmDelivery = async () => {
    if (!confirmDelivery) return
    try {
      await confirmDeliveryMut({ deliveryId: confirmDelivery._id, organizationId: orgId, userEmail: user?.email })
      toast.success("Consegna confermata con successo")
      setConfirmDelivery(null)
    } catch (e: any) { toast.error(e.message || "Errore nella conferma") }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-transparent border border-teal-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white">Area Cliente</h1><p className="text-white/60 mt-1">Benvenuto, {client.fullName || user.email} — i tuoi cantieri, preventivi e pagamenti</p></div>
          <div className="w-10 h-10 rounded-lg bg-teal-500/15 flex items-center justify-center"><span className="text-lg text-teal-400">◆</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Cantieri Attivi</CardTitle>
            <Building2 className="w-4 h-4 text-teal-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-teal-400">{cantieri.active}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Completati</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-400">{cantieri.completed}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Preventivi</CardTitle>
            <FileText className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-cyan-400">{quotes.total}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Da Pagare</CardTitle>
            <Clock className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-yellow-400">EUR{payments.pending.toLocaleString("it-IT")}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">I Miei Cantieri</h3>
            <Link href="/cantieri"><Button variant="outline" size="sm" className="border-white/10"><Eye className="w-3 h-3 mr-1" />Vedi</Button></Link>
          </div>
          {cantieri.list.length === 0 ? (
            <div className="p-8 text-center text-white/40"><Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun cantiere</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {cantieri.list.slice(0, 5).map((c) => (
                <div key={c._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{c.name}</p>
                    <p className="text-xs text-white/40">{c.address || ""}</p>
                  </div>
                  <Badge className={
                    c.status === "completato" ? "bg-green-500/20 text-green-400" :
                    c.status === "in_corso" ? "bg-blue-500/20 text-blue-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }>
                    {c.status === "completato" ? "Completato" : c.status === "in_corso" ? "In Corso" : c.status === "pianificato" ? "Pianificato" : c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">I Miei Preventivi</h3>
            <Link href="/quotes"><Button variant="outline" size="sm" className="border-white/10"><Eye className="w-3 h-3 mr-1" />Vedi</Button></Link>
          </div>
          {quotes.list.length === 0 ? (
            <div className="p-8 text-center text-white/40"><FileText className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun preventivo</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {quotes.list.slice(0, 5).map((q) => (
                <div key={q._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{q.title || `Preventivo #${q._id.slice(-6)}`}</p>
                    <p className="text-xs text-white/40">{q.estimatedPrice ? `EUR${q.estimatedPrice.toLocaleString("it-IT")}` : ""}</p>
                  </div>
                  <Badge className={
                    q.status === "accepted" ? "bg-green-500/20 text-green-400" :
                    q.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    q.status === "sent" ? "bg-blue-500/20 text-blue-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }>
                    {q.status === "accepted" ? "Approvato" :
                     q.status === "rejected" ? "Rifiutato" :
                     q.status === "sent" ? "Inviato" : "Bozza"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white/[0.02] border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Euro className="w-4 h-4 text-kranely-accent" /> Situazione Pagamenti</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.list.length === 0 ? (
              <p className="text-white/40 text-sm">Nessun pagamento registrato</p>
            ) : (
              <div className="divide-y divide-white/10">
                {payments.list.map((p) => (
                  <div key={p._id} className="py-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white">{p.description}</p>
                      <p className="text-xs text-white/40">{p.dueDate ? `Scadenza: ${p.dueDate}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">EUR{p.amount.toLocaleString("it-IT")}</p>
                      <Badge className={
                        p.status === "pagato" ? "bg-green-500/20 text-green-400 text-[10px]" :
                        p.status === "in_ritardo" ? "bg-red-500/20 text-red-400 text-[10px]" :
                        p.status === "in_verifica" ? "bg-blue-500/20 text-blue-400 text-[10px]" :
                        "bg-yellow-500/20 text-yellow-400 text-[10px]"
                      }>
                        {p.status === "pagato" ? "Pagato" :
                         p.status === "in_attesa" ? "In attesa" :
                         p.status === "in_ritardo" ? "Scaduto" :
                         p.status === "in_verifica" ? "In verifica" : p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/[0.02] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Budget totale</span>
                <span className="text-white font-medium">EUR{budget.total.toLocaleString("it-IT")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Speso</span>
                <span className="text-green-400 font-medium">EUR{budget.spent.toLocaleString("it-IT")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Residuo</span>
                <span className="text-blue-400 font-medium">EUR{budget.remaining.toLocaleString("it-IT")}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${budget.usagePercent > 90 ? "bg-red-500" : budget.usagePercent > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(budget.usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-white/40 text-center">{budget.usagePercent}% del budget utilizzato</p>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center gap-2"><FileText className="w-4 h-4 text-kranely-accent" /> Documenti</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.list.length === 0 ? (
                <p className="text-white/40 text-sm">Nessun documento</p>
              ) : (
                <div className="space-y-2">
                  {documents.list.map((d) => (
                    <div key={d._id} className="flex items-center justify-between p-2 rounded bg-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3 h-3 text-white/40 shrink-0" />
                        <span className="text-sm text-white truncate">{d.title}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-white/10 shrink-0 ml-2">{d.type || "documento"}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {documents.total > 5 && (
                <p className="text-xs text-white/40 mt-2">+{documents.total - 5} altri documenti</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {supplierTracking && (supplierTracking.orders.length > 0 || supplierTracking.deliveries.length > 0) && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-violet-400" />
            <h3 className="text-white font-semibold">Stato Ordini e Produzione</h3>
          </div>

          {supplierTracking.orders.map((o: any) => {
            const prods = productionByOrder.get(o._id) || []
            const isExpanded = expandedOrders.has(o._id)
            const totalProgress = prods.length > 0
              ? Math.round(prods.reduce((s: number, p: any) => s + (p.progressPercentage || 0), 0) / prods.length)
              : o.status === "delivered" ? 100 : o.status === "shipped" ? 85 : o.status === "in_production" ? 40 : o.status === "confirmed" ? 10 : 0

            return (
              <div key={o._id} className="border-b border-white/5 last:border-0">
                <div
                  className="flex items-center justify-between py-3 cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 rounded transition-colors"
                  onClick={() => prods.length > 0 && toggleOrder(o._id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {prods.length > 0 && (
                        <span className="text-white/30 shrink-0">{isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</span>
                      )}
                      <p className="text-sm text-white font-medium truncate">{o.description || o.orderNumber || "Ordine"}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 max-w-[200px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          totalProgress >= 100 ? "bg-green-500" : totalProgress >= 50 ? "bg-violet-500" : "bg-amber-500"
                        }`} style={{ width: `${totalProgress}%` }} />
                      </div>
                      <span className="text-xs text-white/40">{totalProgress}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {o.expectedDelivery && (
                      <span className="text-xs text-white/40 hidden sm:block">Prev: {o.expectedDelivery}</span>
                    )}
                    <Badge className={
                      o.status === "delivered" ? "bg-green-500/20 text-green-400" :
                      o.status === "shipped" ? "bg-cyan-500/20 text-cyan-400" :
                      o.status === "in_production" ? "bg-purple-500/20 text-purple-400" :
                      o.status === "confirmed" ? "bg-blue-500/20 text-blue-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }>
                      {o.status === "delivered" ? "Consegnato" : o.status === "shipped" ? "Spedito" : o.status === "in_production" ? "In Produzione" : o.status === "confirmed" ? "Confermato" : "In Attesa"}
                    </Badge>
                  </div>
                </div>

                {isExpanded && prods.length > 0 && (
                  <div className="ml-5 pb-3 space-y-2">
                    {prods.map((p: any) => {
                      const phaseIdx = PHASE_ORDER.indexOf(p.phase)
                      return (
                        <div key={p._id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-white font-medium">{p.description || "Produzione"}</p>
                            <Badge className={
                              p.status === "completed" ? "bg-green-500/20 text-green-400" :
                              p.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }>
                              {p.status === "completed" ? "Completato" : p.status === "in_progress" ? "In Corso" : "In Attesa"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 mb-2">
                            {PHASE_ORDER.map((ph, i) => {
                              const isActive = phaseIdx >= i
                              const isCurrent = phaseIdx === i && p.status === "in_progress"
                              return (
                                <div key={ph} className="flex-1 flex flex-col items-center gap-1">
                                  <div className={`w-full h-1.5 rounded-full transition-all ${
                                    isActive && p.status === "completed" ? "bg-green-500" :
                                    isCurrent ? "bg-violet-500 animate-pulse" :
                                    isActive ? phaseColor(ph) : "bg-white/10"
                                  }`} />
                                  <span className={`text-[9px] leading-tight text-center ${
                                    isCurrent ? "text-violet-300 font-medium" :
                                    isActive ? "text-white/60" : "text-white/20"
                                  }`}>{PHASE_LABELS[ph]}</span>
                                </div>
                              )
                            })}
                          </div>

                          <div className="flex items-center justify-between text-xs text-white/40">
                            {p.quantity != null && <span>Q.tà: {p.completed ?? 0}/{p.quantity}</span>}
                            {p.estimatedCompletion && <span>Fine prevista: {p.estimatedCompletion}</span>}
                            {p.progressPercentage != null && <span>{p.progressPercentage}%</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {supplierTracking.deliveries.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4 mb-2 pt-3 border-t border-white/5">
                <Truck className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm text-white/70 font-medium">Consegne</h4>
              </div>
              {supplierTracking.deliveries.map((d: any) => (
                <div key={d._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{d.description || "Consegna"}</p>
                    <p className="text-xs text-white/40">
                      {d.expectedDate ? new Date(d.expectedDate).toLocaleDateString("it-IT") : ""}
                      {d.deliveryDate ? ` — Effettuata: ${new Date(d.deliveryDate).toLocaleDateString("it-IT")}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      d.status === "consegnato" ? "bg-green-500/20 text-green-400" :
                      d.status === "in_transito" ? "bg-blue-500/20 text-blue-400" :
                      d.status === "partito" ? "bg-cyan-500/20 text-cyan-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }>
                      {d.status === "consegnato" ? "Consegnato" : d.status === "in_transito" ? "In Transito" : d.status === "partito" ? "Partito" : "Pianificato"}
                    </Badge>
                    {d.status !== "consegnato" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                        onClick={() => setConfirmDelivery(d)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />Conferma
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-kranely-accent" />
          <h3 className="text-white font-semibold">Comunicazioni</h3>
        </div>
        <p className="text-white/60 text-sm mb-4">Puoi contattare l&apos;amministrazione per qualsiasi richiesta</p>
        <Link href="/messages">
          <Button className="bg-kranely-accent text-kranely-app-bg">
            <MessageSquare className="w-4 h-4 mr-2" />Apri Chat
          </Button>
        </Link>
      </div>

      <Dialog open={!!confirmDelivery} onOpenChange={(open) => !open && setConfirmDelivery(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conferma Ricezione</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="text-white/80">Confermi di aver ricevuto la seguente consegna?</p>
            <p className="text-white font-medium mt-2">{confirmDelivery?.description || "Consegna"}</p>
            {confirmDelivery?.expectedDate && (
              <p className="text-sm text-white/60">Prevista il: {new Date(confirmDelivery.expectedDate).toLocaleDateString("it-IT")}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelivery(null)} className="border-white/10">Annulla</Button>
            <Button onClick={handleConfirmDelivery} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />Conferma Ricevuta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
