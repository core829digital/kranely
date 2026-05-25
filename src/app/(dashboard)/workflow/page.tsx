"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Plus, Search, CheckCircle2, Clock, ArrowRight, Truck, FileText, Package, Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

const workflowSteps = [
  { id: 1, name: "Richiesta", icon: FileText, description: "Richiesta materiale inviata al fornitore" },
  { id: 2, name: "Conferma Ricevuta", icon: CheckCircle2, description: "Fornitore conferma ricezione richiesta" },
  { id: 3, name: "Preventivo", icon: FileText, description: "Fornitore invia preventivo" },
  { id: 4, name: "Approvazione", icon: CheckCircle2, description: "Preventivo approvato" },
  { id: 5, name: "Ordine", icon: Package, description: "Ordine confermato al fornitore" },
  { id: 6, name: "In Produzione", icon: Clock, description: "Fornitore sta producendo" },
  { id: 7, name: "Spedito", icon: Truck, description: "Materiale spedito" },
  { id: 8, name: "Consegnato", icon: Package, description: "Materiale consegnato in cantiere" },
  { id: 9, name: "Verifica", icon: CheckCircle2, description: "Verifica qualita e conformita" },
]

export default function WorkflowPage() {
  const orgId = useOrgId()
  const [search, setSearch] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<Id<"supplierOrders"> | null>(null)
  const [formData, setFormData] = useState({ supplierId: "", cantiereId: "", quoteId: "", orderNumber: "", description: "", totalAmount: "", expectedDelivery: "", notes: "" })
  const [editFormData, setEditFormData] = useState({ orderNumber: "", description: "", totalAmount: "", expectedDelivery: "", notes: "" })

  const orders = useQuery(api.supplierOrders.list, orgId ? { organizationId: orgId } : "skip")
  const suppliers = useQuery(api.suppliers.list, orgId ? { organizationId: orgId } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId } : "skip")
  const deliveries = useQuery(api.supplierDeliveries.list, orgId ? { organizationId: orgId } : "skip")

  const createOrder = useMutation(api.supplierOrders.create)
  const updateOrder = useMutation(api.supplierOrders.update)
  const removeOrder = useMutation(api.supplierOrders.remove)

  const openCreate = () => { setFormData({ supplierId: "", cantiereId: "", quoteId: "", orderNumber: "", description: "", totalAmount: "", expectedDelivery: "", notes: "" }); setShowCreateDialog(true) }

  const openEdit = (order: any) => {
    setEditFormData({ orderNumber: order.orderNumber || "", description: order.description || "", totalAmount: order.totalAmount?.toString() || "", expectedDelivery: order.expectedDelivery || "", notes: order.notes || "" })
    setEditingOrderId(order._id)
    setShowEditDialog(true)
  }

  const handleEdit = async () => {
    if (!editingOrderId) return
    try {
      await updateOrder({
        id: editingOrderId,
        description: editFormData.description || undefined,
        orderNumber: editFormData.orderNumber || undefined,
        totalAmount: editFormData.totalAmount ? parseFloat(editFormData.totalAmount) : undefined,
        expectedDelivery: editFormData.expectedDelivery || undefined,
        notes: editFormData.notes || undefined,
      })
      setShowEditDialog(false); toast.success("Ordine aggiornato")
    } catch (e) { toast.error("Errore aggiornamento") }
  }

  const handleDelete = async (id: Id<"supplierOrders">) => {
    if (!confirm("Eliminare questo ordine?")) return
    try { await removeOrder({ id }); toast.success("Ordine eliminato") } catch (e) { toast.error("Errore") }
  }

  const handleCreate = async () => {
    if (!formData.supplierId || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try { await createOrder({ organizationId: orgId, supplierId: formData.supplierId as Id<"suppliers">, description: formData.description, orderNumber: formData.orderNumber, totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : undefined, expectedDelivery: formData.expectedDelivery || undefined, cantiereId: formData.cantiereId ? formData.cantiereId as Id<"cantieri"> : undefined, quoteId: formData.quoteId ? formData.quoteId as Id<"quotes"> : undefined, status: "pending" }); setShowCreateDialog(false); toast.success("Ordine creato") } catch (e) { toast.error("Errore") }
  }

  const advanceStatus = async (id: Id<"supplierOrders">, currentStatus: string) => {
    const statusFlow: Record<string, string> = { pending: "confirmed", confirmed: "in_production", in_production: "shipped", shipped: "delivered" }
    const nextStatus = statusFlow[currentStatus]
    if (!nextStatus) return
    try { await updateOrder({ id, status: nextStatus as any }); toast.success(`Stato aggiornato: ${nextStatus}`) } catch (e) { toast.error("Errore") }
  }

  const getStatusStep = (status: string): number => { const map: Record<string, number> = { pending: 1, confirmed: 2, in_production: 6, shipped: 7, delivered: 8, cancelled: 0 }; return map[status] || 0 }

  const statusBadge = (status: string) => { const map: Record<string, { label: string; variant: "success" | "default" | "secondary" | "destructive" | "warning" }> = { pending: { label: "In Attesa", variant: "default" }, confirmed: { label: "Confermato", variant: "success" }, in_production: { label: "In Produzione", variant: "warning" }, shipped: { label: "Spedito", variant: "default" }, delivered: { label: "Consegnato", variant: "success" }, cancelled: { label: "Annullato", variant: "destructive" } }; const { label, variant } = map[status] || { label: status, variant: "secondary" }; return <Badge variant={variant}>{label}</Badge> }

  const getSupplierName = (id: string) => suppliers?.find((s) => s._id === id)?.companyName
  const getCantiereName = (id: string) => cantieri?.find((c) => c._id === id)?.name

  const filteredOrders = orders?.filter((o) => { if (!search) return true; const s = search.toLowerCase(); return (o.orderNumber || "").toLowerCase().includes(s) || (o.description || "").toLowerCase().includes(s) }) || []

  if (!orgId || !orders || !suppliers) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Workflow Ordini</h1><p className="text-white/60 mt-1">Workflow 9 step ordini fornitori</p></div><Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo Ordine</Button></div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca ordini..." className="pl-10" /></div>
      </div>
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white mb-3">Fasi del Workflow</h3>
        <div className="flex flex-wrap gap-2">{workflowSteps.map((step) => (<div key={step.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-xs"><step.icon className="w-3 h-3 text-kranely-accent" /><span className="text-white/60">{step.id}. {step.name}</span></div>))}</div>
      </div>
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const currentStep = getStatusStep(order.status)
          const orderDeliveries = deliveries?.filter((d) => d.orderId === order._id) || []
          return (
            <div key={order._id} className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1"><h3 className="text-lg font-semibold text-white">{order.orderNumber}</h3>{statusBadge(order.status)}</div>
                  <p className="text-sm text-white/60">{order.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                    <span>Fornitore: <Link href="/suppliers" className="text-kranely-accent hover:underline">{getSupplierName(order.supplierId)}</Link></span>
                    {order.cantiereId && <span>Cantiere: <Link href="/cantieri" className="text-kranely-accent hover:underline">{getCantiereName(order.cantiereId)}</Link></span>}
                    {order.totalAmount && <span>Importo: <span className="text-kranely-accent">EUR{order.totalAmount.toLocaleString("it-IT")}</span></span>}
                    {order.expectedDelivery && <span>Consegna: {order.expectedDelivery}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(order)} className="p-1.5 rounded bg-white text-black hover:bg-white/80" title="Modifica"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(order._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600" title="Elimina"><Trash2 className="w-4 h-4" /></button>
                  {order.status !== "delivered" && order.status !== "cancelled" && (<Button size="sm" onClick={() => advanceStatus(order._id, order.status)} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">Avanza <ArrowRight className="w-4 h-4 ml-1" /></Button>)}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                {workflowSteps.map((step) => {
                  const isCompleted = step.id < currentStep; const isCurrent = step.id === currentStep; const isPending = step.id > currentStep
                  return (<div key={step.id} className="flex items-center flex-1"><div className="flex flex-col items-center flex-1"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? "bg-green-500/20 text-green-400" : isCurrent ? "bg-kranely-accent/20 text-kranely-accent" : "bg-white/5 text-white/20"}`}>{isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}</div><span className={`text-[10px] mt-1 text-center ${isCompleted ? "text-green-400" : isCurrent ? "text-kranely-accent" : "text-white/20"}`}>{step.name}</span></div>{step.id < 9 && <div className={`flex-1 h-0.5 ${isCompleted ? "bg-green-500/40" : "bg-white/10"}`} />}</div>)
                })}
              </div>
              {orderDeliveries.length > 0 && (<div className="mt-4 pt-4 border-t border-white/10"><h4 className="text-xs font-semibold text-white/60 mb-2">Consegne</h4><div className="space-y-2">{orderDeliveries.map((d) => (<div key={d._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-xs"><span className="text-white">{d.description}</span><Badge variant={d.status === "consegnato" ? "success" : d.status === "in_transito" ? "default" : "secondary"}>{d.status}</Badge></div>))}</div></div>)}
            </div>
          )
        })}
      </div>
      {filteredOrders.length === 0 && <div className="p-12 text-center text-white/40"><Package className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun ordine fornitore</p></div>}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Nuovo Ordine Fornitore</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label>Numero Ordine *</Label><Input value={formData.orderNumber} onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })} placeholder="ORD-2026-001" /></div>
            <div><Label>Fornitore *</Label><select value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Seleziona</option>{suppliers.map((s) => <option key={s._id} value={s._id}>{s.companyName}</option>)}</select></div>
            <div className="md:col-span-2"><Label>Descrizione *</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Label>Importo (EUR)</Label><Input type="number" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} /></div>
            <div><Label>Consegna Prevista</Label><Input type="date" value={formData.expectedDelivery} onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })} /></div>
            <div><Label>Cantiere</Label><select value={formData.cantiereId} onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{cantieri?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Crea Ordine</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Modifica Ordine</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label>Numero Ordine</Label><Input value={editFormData.orderNumber} onChange={(e) => setEditFormData({ ...editFormData, orderNumber: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Input value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} /></div>
            <div><Label>Importo (EUR)</Label><Input type="number" value={editFormData.totalAmount} onChange={(e) => setEditFormData({ ...editFormData, totalAmount: e.target.value })} /></div>
            <div><Label>Consegna Prevista</Label><Input type="date" value={editFormData.expectedDelivery} onChange={(e) => setEditFormData({ ...editFormData, expectedDelivery: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleEdit} className="bg-kranely-accent text-kranely-app-bg">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
