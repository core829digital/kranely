"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Eye, Edit2, Trash2, Building2, FileText, CreditCard, Calendar, CheckCircle2, Truck } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function CantieriPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pianificato" | "in_corso" | "completato" | "sospeso">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedCantiereId, setSelectedCantiereId] = useState<Id<"cantieri"> | null>(null)
  const [formData, setFormData] = useState({
    clientId: "", name: "", address: "", startDate: "", endDate: "", status: "pianificato" as "pianificato" | "in_corso" | "completato" | "sospeso", description: "", quoteId: "", totalBudget: "", managerId: ""
  })

  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId!, search: search || undefined, status: filterStatus !== "all" ? filterStatus : undefined, userEmail: user?.email } : "skip")
  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const selectedCantiere = useQuery(api.cantieri.get, selectedCantiereId ? { id: selectedCantiereId, organizationId: orgId! } : "skip")
  const cantierePayments = useQuery(api.payments.list, selectedCantiereId ? { organizationId: orgId!!, cantiereId: selectedCantiereId, userEmail: user?.email } : "skip")
  const cantiereDocuments = useQuery(api.documents.list, selectedCantiereId ? { organizationId: orgId!!, cantiereId: selectedCantiereId, userEmail: user?.email } : "skip")
  const cantiereOrders = useQuery(api.supplierOrders.list, selectedCantiereId ? { organizationId: orgId!!, cantiereId: selectedCantiereId, userEmail: user?.email } : "skip")
  const cantiereTasks = useQuery(api.tasks.list, selectedCantiereId ? { organizationId: orgId!!, cantiereId: selectedCantiereId, userEmail: user?.email } : "skip")
  const allCantiereAppointments = useQuery(api.appointments.list, selectedCantiereId ? { organizationId: orgId!!, userEmail: user?.email } : "skip")
  const cantiereAppointments = allCantiereAppointments?.filter((a) => a.cantiereId === selectedCantiereId) || []

  const createCantiere = useMutation(api.cantieri.create)
  const updateCantiere = useMutation(api.cantieri.update)
  const deleteCantiere = useMutation(api.cantieri.remove)

  const openCreate = () => {
    setFormData({ clientId: "", name: "", address: "", startDate: "", endDate: "", status: "pianificato", description: "", quoteId: "", totalBudget: "", managerId: "" })
    setShowCreateDialog(true)
  }

  const openEdit = (c: any) => {
    setSelectedCantiereId(c._id)
    setFormData({ clientId: c.clientId, name: c.name, address: c.address, startDate: c.startDate || "", endDate: c.endDate || "", status: c.status, description: c.description || "", quoteId: c.quoteId || "", totalBudget: c.totalBudget?.toString() || "", managerId: c.managerId || "" })
    setShowEditDialog(true)
  }

  const openDetail = (c: any) => {
    setSelectedCantiereId(c._id)
    setShowDetailDialog(true)
  }

  const handleCreate = async () => {
    if (!formData.name || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try {
      await createCantiere({ organizationId: orgId!, clientId: formData.clientId as Id<"clients">, name: formData.name, address: formData.address, startDate: formData.startDate || undefined, endDate: formData.endDate || undefined, status: formData.status, description: formData.description || undefined, quoteId: formData.quoteId ? formData.quoteId as Id<"quotes"> : undefined, totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : undefined })
      setShowCreateDialog(false)
      toast.success("Cantiere creato")
    } catch (e) { toast.error("Errore nella creazione") }
  }

  const handleUpdate = async () => {
    if (!selectedCantiereId) return
    try {
      await updateCantiere({ id: selectedCantiereId, organizationId: orgId!, name: formData.name, address: formData.address, startDate: formData.startDate || undefined, endDate: formData.endDate || undefined, status: formData.status, description: formData.description || undefined, totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : undefined })
      setShowEditDialog(false)
      toast.success("Cantiere aggiornato")
    } catch (e) { toast.error("Errore nell'aggiornamento") }
  }

  const handleDelete = async (id: Id<"cantieri">) => {
    if (!confirm("Eliminare questo cantiere?")) return
    try { await deleteCantiere({ id, organizationId: orgId! }); toast.success("Cantiere eliminato") } catch (e) { toast.error("Errore nell'eliminazione") }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "success" | "default" | "secondary" | "destructive" | "warning" }> = {
      pianificato: { label: "Pianificato", variant: "default" }, in_corso: { label: "In Corso", variant: "success" }, completato: { label: "Completato", variant: "secondary" }, sospeso: { label: "Sospeso", variant: "destructive" },
    }
    const { label, variant } = map[status] || { label: status, variant: "secondary" }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getClientName = (clientId: Id<"clients">) => clients?.find((c) => c._id === clientId)?.fullName || "..."

  if (!orgId || !cantieri || !clients) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Cantieri</h1><p className="text-white/60 mt-1">{cantieri.length} cantieri trovati</p></div>
        <Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo Cantiere</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca cantieri..." className="pl-10" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
          <option value="all">Tutti gli stati</option><option value="pianificato">Pianificato</option><option value="in_corso">In Corso</option><option value="completato">Completato</option><option value="sospeso">Sospeso</option>
        </select>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Cantiere</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden md:table-cell">Indirizzo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Budget</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Periodo</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cantieri.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-kranely-accent/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-kranely-accent" /></div>
                      <div><p className="text-sm font-medium text-white">{c.name}</p><p className="text-xs text-white/40">{c.address}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.clientId ? <Link href="/clients" className="text-sm text-kranely-accent hover:underline">{getClientName(c.clientId)}</Link> : "-"}</td>
                  <td className="px-4 py-3 text-sm text-white/60 hidden md:table-cell">{c.address}</td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium hidden lg:table-cell">EUR{c.totalBudget?.toLocaleString("it-IT") || 0}</td>
                  <td className="px-4 py-3 text-sm text-white/60 hidden lg:table-cell">{c.startDate && <span>{c.startDate}{c.endDate ? ` - ${c.endDate}` : ""}</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(c)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cantieri.length === 0 && <div className="p-12 text-center text-white/40"><Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun cantiere trovato</p><Button onClick={openCreate} variant="outline" className="mt-4 border-white/20"><Plus className="w-4 h-4 mr-2" /> Crea il primo cantiere</Button></div>}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nuovo Cantiere</DialogTitle><DialogDescription>Compila i dati del cantiere</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Nome Cantiere *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Cantiere Via Roma" /></div>
            <div><Label>Cliente *</Label><select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Seleziona cliente</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}</select></div>
            <div><Label>Indirizzo *</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Via Roma 15, Milano" /></div>
            <div><Label>Data Inizio</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
            <div><Label>Data Fine</Label><Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="pianificato">Pianificato</option><option value="in_corso">In Corso</option><option value="completato">Completato</option><option value="sospeso">Sospeso</option></select></div>
            <div><Label>Budget (EUR)</Label><Input type="number" value={formData.totalBudget} onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })} placeholder="0" /></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrizione del cantiere..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">Crea Cantiere</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Modifica Cantiere</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Nome</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Indirizzo</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="pianificato">Pianificato</option><option value="in_corso">In Corso</option><option value="completato">Completato</option><option value="sospeso">Sospeso</option></select></div>
            <div><Label>Data Inizio</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
            <div><Label>Data Fine</Label><Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></div>
            <div><Label>Budget (EUR)</Label><Input type="number" value={formData.totalBudget} onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleUpdate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Dettagli Cantiere</DialogTitle></DialogHeader>
          {selectedCantiere && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-kranely-accent/10 flex items-center justify-center"><Building2 className="w-6 h-6 text-kranely-accent" /></div>
                  <div><h3 className="text-lg font-semibold text-white">{selectedCantiere.name}</h3><p className="text-sm text-white/60">{selectedCantiere.address}</p></div>
                </div>
                {statusBadge(selectedCantiere.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40">Cliente</span><p className="text-white">{selectedCantiere.clientId ? getClientName(selectedCantiere.clientId) : "-"}</p></div>
                <div><span className="text-white/40">Budget</span><p className="text-kranely-accent font-bold">EUR{selectedCantiere.totalBudget?.toLocaleString("it-IT") || 0}</p></div>
                <div><span className="text-white/40">Inizio</span><p className="text-white">{selectedCantiere.startDate || "-"}</p></div>
                <div><span className="text-white/40">Fine</span><p className="text-white">{selectedCantiere.endDate || "-"}</p></div>
              </div>
              {selectedCantiere.totalBudget && selectedCantiere.totalBudget > 0 && cantierePayments && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Budget vs Speso</span>
                    <span className="text-white/80">
                      EUR{cantierePayments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")} / EUR{selectedCantiere.totalBudget.toLocaleString("it-IT")}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5">
                    {(() => {
                      const spent = cantierePayments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0)
                      const pct = Math.min(Math.round((spent / selectedCantiere.totalBudget!) * 100), 100)
                      const overBudget = spent > selectedCantiere.totalBudget!
                      return (
                        <div
                          className={`h-2.5 rounded-full transition-all ${overBudget ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      )
                    })()}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={cantierePayments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0) > selectedCantiere.totalBudget ? "text-red-400" : "text-green-400"}>
                      {(() => {
                        const spent = cantierePayments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0)
                        const pct = Math.round((spent / selectedCantiere.totalBudget!) * 100)
                        return `${pct}% utilizzato`
                      })()}
                    </span>
                    <span className="text-white/40">
                      Residuo: EUR{Math.max(0, selectedCantiere.totalBudget - cantierePayments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0)).toLocaleString("it-IT")}
                    </span>
                  </div>
                </div>
              )}
              {selectedCantiere.description && <div><span className="text-white/40 text-sm">Descrizione</span><p className="text-sm text-white mt-1">{selectedCantiere.description}</p></div>}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><CreditCard className="w-4 h-4" /> Pagamenti ({cantierePayments?.length || 0})</h4>
                {cantierePayments && cantierePayments.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-center"><p className="text-lg font-bold text-green-400">EUR{cantierePayments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")}</p><p className="text-xs text-white/60">Pagati</p></div>
                    <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20 text-center"><p className="text-lg font-bold text-yellow-400">EUR{cantierePayments.filter((p) => p.status === "in_attesa").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")}</p><p className="text-xs text-white/60">In attesa</p></div>
                    <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-center"><p className="text-lg font-bold text-red-400">EUR{cantierePayments.filter((p) => p.status === "in_ritardo").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")}</p><p className="text-xs text-white/60">Scaduti</p></div>
                  </div>
                ) : <p className="text-xs text-white/40">Nessun pagamento</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4" /> Documenti ({cantiereDocuments?.length || 0})</h4>
                {cantiereDocuments && cantiereDocuments.length > 0 ? (
                  <div className="space-y-2">{cantiereDocuments.slice(0, 5).map((d) => (<div key={d._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{d.title}</span><Badge variant="secondary">{d.type}</Badge></div>))}</div>
                ) : <p className="text-xs text-white/40">Nessun documento</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Truck className="w-4 h-4" /> Ordini Fornitori ({cantiereOrders?.length || 0})</h4>
                {cantiereOrders && cantiereOrders.length > 0 ? (
                  <div className="space-y-2">{cantiereOrders.slice(0, 5).map((o) => (<div key={o._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{o.description || "Ordine"}</span><Badge variant={o.status === "delivered" ? "success" : o.status === "confirmed" ? "default" : "secondary"}>{o.status}</Badge></div>))}</div>
                ) : <p className="text-xs text-white/40">Nessun ordine fornitore</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Attivita ({cantiereTasks?.length || 0})</h4>
                {cantiereTasks && cantiereTasks.length > 0 ? (
                  <div className="space-y-2">{cantiereTasks.slice(0, 5).map((t) => (<div key={t._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{t.title}</span><Badge variant={t.status === "completato" ? "success" : t.status === "in_corso" ? "default" : "secondary"}>{t.status}</Badge></div>))}</div>
                ) : <p className="text-xs text-white/40">Nessuna attivita</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4" /> Appuntamenti ({cantiereAppointments?.length || 0})</h4>
                {cantiereAppointments && cantiereAppointments.length > 0 ? (
                  <div className="space-y-2">{cantiereAppointments.slice(0, 5).map((a) => (<div key={a._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{a.title}</span><span className="text-xs text-white/40">{a.appointmentDate}</span></div>))}</div>
                ) : <p className="text-xs text-white/40">Nessun appuntamento</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
