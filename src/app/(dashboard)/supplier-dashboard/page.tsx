"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Package, Send, ClipboardList, Factory, Truck, MessageSquare, CheckCircle2, Clock, Building2, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea, Input } from "@/components/ui/input"

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

export default function SupplierDashboardPage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const [showQuoteRequest, setShowQuoteRequest] = useState(false)
  const [quoteMessage, setQuoteMessage] = useState("")

  const suppliers = useQuery(api.suppliers.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const supplierOrders = useQuery(api.supplierOrders.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const supplierProduction = useQuery(api.supplierProduction.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const supplierDeliveries = useQuery(api.supplierDeliveries.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const createRequest = useMutation(api.supplierRequests.create)
  const updateProduction = useMutation(api.supplierProduction.update)

  if (!orgId || !user) return <PageSkeleton />

  const myProfile = suppliers?.find((s) => s.email === user.email) || null
  const supplierId = myProfile?._id

  const myOrders = supplierOrders?.filter((o) => supplierId && o.supplierId === supplierId) || []
  const inProduction = supplierProduction?.filter((p) => supplierId && p.supplierId === supplierId) || []
  const myDeliveries = supplierDeliveries?.filter((d) => supplierId && d.supplierId === supplierId) || []

  const advancePhase = async (prod: any, direction: "next" | "prev") => {
    const idx = PHASE_ORDER.indexOf(prod.phase || "materiali_ricevuti")
    const nextIdx = direction === "next" ? idx + 1 : idx - 1
    if (nextIdx < 0 || nextIdx >= PHASE_ORDER.length) return
    const newPhase = PHASE_ORDER[nextIdx]
    try {
      await updateProduction({
        id: prod._id,
        organizationId: orgId,
        userEmail: user?.email,
        phase: newPhase,
        status: "in_progress",
        progressPercentage: Math.round(((nextIdx + 1) / PHASE_ORDER.length) * 100),
      })
      toast.success(`Fase avanzata a: ${PHASE_LABELS[newPhase]}`)
    } catch (e: any) { toast.error(e.message || "Errore") }
  }

  const markProductionComplete = async (prod: any) => {
    try {
      await updateProduction({
        id: prod._id,
        organizationId: orgId,
        userEmail: user?.email,
        status: "completed",
        phase: "pronto",
        progressPercentage: 100,
      })
      toast.success("Produzione completata!")
    } catch (e: any) { toast.error(e.message || "Errore") }
  }

  const handleQuoteRequest = async () => {
    if (!quoteMessage) { toast.error("Inserisci una descrizione"); return }
    try {
      await createRequest({ organizationId: orgId, title: quoteMessage, userEmail: user?.email })
      setShowQuoteRequest(false)
      setQuoteMessage("")
      toast.success("Richiesta inviata")
    } catch (e) { toast.error("Errore nell'invio") }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-500/20 via-violet-500/10 to-transparent border border-violet-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white">Dashboard Fornitore</h1><p className="text-white/60 mt-1">{user.fullName || user.email} — produzione, ordini e consegne</p></div>
          <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center"><span className="text-lg text-violet-400">◈</span></div><Button onClick={() => setShowQuoteRequest(true)} className="bg-kranely-accent text-kranely-app-bg"><Send className="w-4 h-4 mr-2" />Richiedi Preventivo</Button></div>
        </div>
      </div>

      <Tabs defaultValue="produzione" className="space-y-6">
        <TabsList>
          <TabsTrigger value="produzione"><Factory className="w-4 h-4 mr-2" />Produzione</TabsTrigger>
          <TabsTrigger value="ordini"><Package className="w-4 h-4 mr-2" />Ordini</TabsTrigger>
          <TabsTrigger value="consegne"><Truck className="w-4 h-4 mr-2" />Consegne</TabsTrigger>
          <TabsTrigger value="richieste"><ClipboardList className="w-4 h-4 mr-2" />Richieste</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2" />Chat Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="produzione">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">In Produzione</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-violet-400">{inProduction.filter((p) => p.status === "in_progress").length}</p></CardContent>
            </Card>
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">Completati</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-green-400">{inProduction.filter((p) => p.status === "completed").length}</p></CardContent>
            </Card>
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">In Attesa</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-yellow-400">{inProduction.filter((p) => p.status === "pending").length}</p></CardContent>
            </Card>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="p-4 border-b border-white/10"><h3 className="text-white font-semibold">Stato Produzione</h3></div>
            {inProduction.length === 0 ? (
              <div className="p-8 text-center text-white/40"><Factory className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessuna produzione in corso</p></div>
            ) : (
              <div className="divide-y divide-white/10">
                {inProduction.map((p) => {
                  const phaseIdx = PHASE_ORDER.indexOf(p.phase || "materiali_ricevuti")
                  const isComplete = p.status === "completed"
                  return (
                    <div key={p._id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white font-medium">{p.description || "Produzione"}</p>
                          <p className="text-xs text-white/40">{p.quantity ? `${p.quantity} pz` : ""}</p>
                        </div>
                        <Badge className={
                          isComplete ? "bg-green-500/20 text-green-400" :
                          p.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }>
                          {isComplete ? "Completato" : p.status === "in_progress" ? "In Corso" : "In Attesa"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        {PHASE_ORDER.map((ph, i) => {
                          const isActive = !isComplete && phaseIdx >= i
                          const isCurrent = !isComplete && phaseIdx === i && p.status === "in_progress"
                          return (
                            <div key={ph} className="flex-1 flex flex-col items-center gap-1">
                              <div className={`w-full h-1.5 rounded-full transition-all ${
                                isComplete ? "bg-green-500" :
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

                      {!isComplete && (
                        <div className="flex items-center gap-2 mt-2">
                          {phaseIdx > 0 && (
                            <Button size="sm" variant="outline" className="border-white/10 h-7 text-xs"
                              onClick={() => advancePhase(p, "prev")}>
                              <ChevronLeft className="w-3 h-3 mr-1" />Indietro
                            </Button>
                          )}
                          {p.progressPercentage != null && (
                            <span className="text-xs text-white/40 mr-auto">{p.progressPercentage}%</span>
                          )}
                          {phaseIdx < PHASE_ORDER.length - 1 && (
                            <Button size="sm" variant="outline" className="border-white/10 h-7 text-xs"
                              onClick={() => advancePhase(p, "next")}>
                              Avanti<ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                          {phaseIdx >= PHASE_ORDER.length - 1 && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                              onClick={() => markProductionComplete(p)}>
                              <CheckCircle2 className="w-3 h-3 mr-1" />Completa
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ordini">
          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">I Miei Ordini</h3>
              <Link href="/suppliers"><Button variant="outline" size="sm" className="border-white/10"><Building2 className="w-4 h-4 mr-1" />Vedi Tutti</Button></Link>
            </div>
            {myOrders.length === 0 ? (
              <div className="p-8 text-center text-white/40"><Package className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun ordine</p></div>
            ) : (
              <div className="divide-y divide-white/10">
                {myOrders.slice(0, 10).map((o) => (
                  <div key={o._id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{o.description || `Ordine #${o._id.slice(-6)}`}</p>
                      <p className="text-xs text-white/40">{o.totalAmount ? `EUR${o.totalAmount.toLocaleString("it-IT")}` : ""}</p>
                    </div>
                    <Badge className={
                      o.status === "delivered" ? "bg-green-500/20 text-green-400" :
                      o.status === "confirmed" ? "bg-blue-500/20 text-blue-400" :
                      o.status === "in_production" ? "bg-purple-500/20 text-purple-400" :
                      o.status === "shipped" ? "bg-cyan-500/20 text-cyan-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }>
                      {o.status === "delivered" ? "Consegnato" : o.status === "in_production" ? "In Produzione" : o.status === "shipped" ? "Spedito" : o.status === "confirmed" ? "Confermato" : "In Attesa"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="consegne">
          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="p-4 border-b border-white/10"><h3 className="text-white font-semibold">Consegne</h3></div>
            {myDeliveries.length === 0 ? (
              <div className="p-8 text-center text-white/40"><Truck className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessuna consegna pianificata</p></div>
            ) : (
              <div className="divide-y divide-white/10">
                {myDeliveries.map((d) => (
                  <div key={d._id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{d.description || "Consegna"}</p>
                      <p className="text-xs text-white/40">{d.expectedDate ? new Date(d.expectedDate).toLocaleDateString("it-IT") : ""}</p>
                    </div>
                    <Badge className={
                      d.status === "consegnato" ? "bg-green-500/20 text-green-400" :
                      d.status === "in_transito" ? "bg-blue-500/20 text-blue-400" :
                      d.status === "partito" ? "bg-cyan-500/20 text-cyan-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }>
                      {d.status === "consegnato" ? "Consegnato" : d.status === "in_transito" ? "In Transito" : d.status === "partito" ? "Partito" : "Pianificato"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="richieste">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <p className="text-white/60 mb-4">Invia una richiesta di preventivo all&apos;amministrazione</p>
            <Button onClick={() => setShowQuoteRequest(true)} className="bg-kranely-accent text-kranely-app-bg"><Send className="w-4 h-4 mr-2" />Nuova Richiesta</Button>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-kranely-accent" />
              <h3 className="text-white font-semibold">Chat con Amministrazione</h3>
            </div>
            <Link href="/messages">
              <Button className="w-full bg-kranely-accent text-kranely-app-bg">
                <MessageSquare className="w-4 h-4 mr-2" />Apri Chat Admin
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showQuoteRequest} onOpenChange={setShowQuoteRequest}>
        <DialogContent>
          <DialogHeader><DialogTitle>Richiedi Preventivo</DialogTitle></DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Descrivi cosa ti serve..."
              value={quoteMessage}
              onChange={(e) => setQuoteMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteRequest(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleQuoteRequest} className="bg-kranely-accent text-kranely-app-bg">Invia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
