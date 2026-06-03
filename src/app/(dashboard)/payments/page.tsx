"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Eye, Edit2, Trash2, Users, Building2, CreditCard, TrendingUp, TrendingDown, Calendar, CheckCircle, Truck, FileText, Loader2, Upload, Download } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { safeWindowOpen } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function PaymentsPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "in_attesa" | "pagato" | "in_ritardo" | "in_verifica" | "parziale">("all")
  const [filterType, setFilterType] = useState<"all" | "incoming" | "outgoing">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showProofUploadDialog, setShowProofUploadDialog] = useState(false)
  const [editingId, setEditingId] = useState<Id<"payments"> | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<Id<"payments"> | null>(null)
  const [markAsPaidPaymentId, setMarkAsPaidPaymentId] = useState<Id<"payments"> | null>(null)
  const [formData, setFormData] = useState<any>({ clientId: "", cantiereId: "", amount: "", description: "", dueDate: "", type: "client", status: "in_attesa", method: "bonifico", notes: "", supplierId: "" })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const proofFileRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  const payments = useQuery(api.payments.list, orgId ? { organizationId: orgId!, status: filterStatus !== "all" ? filterStatus : undefined, type: filterType !== "all" ? filterType : undefined, userEmail: user?.email } : "skip")
  const stats = useQuery(api.payments.stats, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const suppliers = useQuery(api.suppliers.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const paymentDetail = useQuery(api.payments.getWithProof, selectedPaymentId && orgId ? { id: selectedPaymentId, organizationId: orgId! } : "skip")

  const createPayment = useMutation(api.payments.create)
  const createCheckoutSession = useMutation(api.stripe.createPaymentCheckoutSession)
  const updatePayment = useMutation(api.payments.update)
  const deletePayment = useMutation(api.payments.remove)
  const markAsPaid = useMutation(api.payments.markAsPaid)
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)
  const saveFile = useMutation(api.upload.saveFile)

  const openCreate = () => {
    setFormData({ type: "client", description: "", amount: "", status: "in_attesa", dueDate: "", clientId: "", cantiereId: "", supplierId: "", method: "bonifico", notes: "" })
    setShowCreateDialog(true)
  }

  const openDetail = (p: any) => {
    setSelectedPaymentId(p._id)
    setShowDetailDialog(true)
  }

  const openEdit = (p: any) => {
    setFormData({ type: p.type, description: p.description, amount: p.amount.toString(), status: p.status, dueDate: p.dueDate || "", clientId: p.clientId || "", cantiereId: p.cantiereId || "", supplierId: p.supplierId || "", method: p.method || "bonifico", notes: p.notes || "" })
    setEditingId(p._id)
    setShowEditDialog(true)
  }

  const openMarkAsPaid = (p: any) => {
    setMarkAsPaidPaymentId(p._id)
    setFormData({ ...formData, method: p.method || "bonifico" })
    setProofFile(null)
    setShowProofUploadDialog(true)
  }

  const handleCreate = async () => {
    if (!formData.description || !formData.amount || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try {
      await createPayment({ organizationId: orgId!, type: formData.type, description: formData.description, amount: parseFloat(formData.amount), status: formData.status, dueDate: formData.dueDate || undefined, clientId: formData.clientId ? formData.clientId as Id<"clients"> : undefined, cantiereId: formData.cantiereId ? formData.cantiereId as Id<"cantieri"> : undefined, supplierId: formData.supplierId ? formData.supplierId as Id<"suppliers"> : undefined, method: formData.method, notes: formData.notes || undefined, userEmail: user?.email })
      setShowCreateDialog(false); toast.success("Pagamento registrato")
    } catch (e) { toast.error("Errore") }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try {
      await updatePayment({ id: editingId, organizationId: orgId!, userEmail: user?.email, description: formData.description, amount: parseFloat(formData.amount), status: formData.status, dueDate: formData.dueDate || undefined, method: formData.method, notes: formData.notes || undefined })
      setShowEditDialog(false); toast.success("Pagamento aggiornato")
    } catch (e) { toast.error("Errore") }
  }

  const handleMarkAsPaidWithProof = async () => {
    if (!markAsPaidPaymentId) return
    setUploadingProof(true)
    try {
      let proofDocId: Id<"documents"> | undefined
      if (proofFile) {
        const uploadUrl = await generateUploadUrl({ organizationId: orgId!, userEmail: user?.email || "" })
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": proofFile.type }, body: proofFile })
        if (!result.ok) throw new Error("Upload ricevuta fallito")
        const { storageId } = await result.json()
        proofDocId = await saveFile({
          organizationId: orgId!,
          storageId,
          fileName: `ricevuta-${markAsPaidPaymentId.slice(0, 8)}`,
          type: "invoice",
          fileSize: proofFile.size,
          description: "Ricevuta di pagamento",
        })
      }
      await markAsPaid({ id: markAsPaidPaymentId, organizationId: orgId!, method: formData.method, proofDocId, userEmail: user?.email })
      setShowProofUploadDialog(false)
      toast.success("Pagamento segnato come pagato con ricevuta")
    } catch (e: any) {
      toast.error(e.message || "Errore")
    } finally {
      setUploadingProof(false)
    }
  }

  const handleDelete = async (id: Id<"payments">) => {
    if (!confirm("Eliminare questo pagamento?")) return
    try { await deletePayment({ id, organizationId: orgId!, userEmail: user?.email }); toast.success("Pagamento eliminato") } catch (e) { toast.error("Errore") }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "success" | "default" | "secondary" | "destructive" | "warning" }> = {
      pagato: { label: "Pagato", variant: "success" },
      in_attesa: { label: "In Attesa", variant: "default" },
      in_ritardo: { label: "Scaduto", variant: "destructive" },
      in_verifica: { label: "In Verifica", variant: "warning" },
      parziale: { label: "Parziale", variant: "secondary" },
    }
    const { label, variant } = map[status] || { label: status, variant: "secondary" }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getEntityName = (type: string, id: string) => {
    if (type === "clientId") return clients?.find((c) => c._id === id)?.fullName
    if (type === "cantiereId") return cantieri?.find((c) => c._id === id)?.name
    if (type === "supplierId") return suppliers?.find((s) => s._id === id)?.companyName
    return null
  }

  if (!orgId || !payments || !stats) return <PageSkeleton />

  const isPwa = user?.role === "admin" || user?.role === "superadmin"

  const filteredPayments = payments.filter((p) => { if (!search) return true; const s = search.toLowerCase(); return p.description.toLowerCase().includes(s) })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Pagamenti</h1><p className="text-white/60 mt-1">{filteredPayments.length} pagamenti trovati</p></div>
        {isPwa && <Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo Pagamento</Button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isPwa && <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-400" /><span className="text-xs text-white/60">Entrate Totali</span></div><p className="text-xl font-bold text-green-400">EUR{stats.paidIncoming.toLocaleString("it-IT")}</p></div>}
        {isPwa && <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-red-400" /><span className="text-xs text-white/60">Uscite Totali</span></div><p className="text-xl font-bold text-red-400">EUR{stats.paidOutgoing.toLocaleString("it-IT")}</p></div>}
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-yellow-400" /><span className="text-xs text-white/60">In Attesa</span></div><p className="text-xl font-bold text-yellow-400">EUR{stats.pendingAmount.toLocaleString("it-IT")}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4 text-red-400" /><span className="text-xs text-white/60">Scaduti</span></div><p className="text-xl font-bold text-red-400">EUR{stats.overdueAmount.toLocaleString("it-IT")}</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca pagamenti..." className="pl-10" /></div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti i tipi</option><option value="client">Entrate</option><option value="supplier">Uscite Fornitori</option><option value="collaborator">Uscite Collaboratori</option></select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti gli stati</option><option value="pagato">Pagato</option><option value="in_attesa">In Attesa</option><option value="in_ritardo">Scaduto</option><option value="in_verifica">In Verifica</option></select>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Descrizione</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden md:table-cell">Entita</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Stato</th>
{isPwa && <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Importo</th>}
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Scadenza</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPayments.map((p) => (
                <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${p.type === "client" ? "bg-green-500/10" : "bg-red-500/10"}`}>{p.type === "client" ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{p.description}</p>
                        <p className="text-xs text-white/40">{p.method || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {p.clientId && <Link href="/clients" className="text-sm text-kranely-accent hover:underline">{getEntityName("clientId", p.clientId)}</Link>}
                    {p.cantiereId && <Link href="/cantieri" className="text-sm text-kranely-accent hover:underline">{getEntityName("cantiereId", p.cantiereId)}</Link>}
                    {p.supplierId && <Link href="/suppliers" className="text-sm text-kranely-accent hover:underline">{getEntityName("supplierId", p.supplierId)}</Link>}
                    {!p.clientId && !p.cantiereId && !p.supplierId && <span className="text-sm text-white/40">-</span>}
                  </td>
                  <td className="px-4 py-3"><Badge variant={p.type === "client" ? "success" : "destructive"}>{p.type === "client" ? "Entrata" : p.type === "supplier" ? "Fornitore" : "Collaboratore"}</Badge></td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  {isPwa && <td className={`px-4 py-3 text-sm font-medium hidden lg:table-cell ${p.type === "client" ? "text-green-400" : "text-red-400"}`}>EUR{p.amount.toLocaleString("it-IT")}</td>}
                  <td className="px-4 py-3 text-sm text-white/60 hidden lg:table-cell">{p.dueDate || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(p)} className="p-1.5 rounded bg-white text-black hover:bg-white/80" title="Dettagli"><Eye className="w-4 h-4" /></button>
                      {isPwa && p.status !== "pagato" && <button onClick={() => openMarkAsPaid(p)} className="p-1.5 rounded bg-white text-black hover:bg-white/80 hover:text-green-600" title="Segna come pagato + ricevuta"><CheckCircle className="w-4 h-4" /></button>}
                      {p.status !== "pagato" && (
                        <button
                          onClick={async () => {
                            try {
                              const result = await createCheckoutSession({ paymentId: p._id, organizationId: orgId!, returnUrl: window.location.href, userEmail: user?.email })
                              if (result.url) safeWindowOpen(result.url)
                            } catch (e: any) { toast.error(e.message || "Errore pagamento online") }
                          }}
                          className="p-1.5 rounded bg-white text-black hover:bg-white/80 hover:text-blue-600"
                          title="Paga online con carta"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      {isPwa && <button onClick={() => openEdit(p)} className="p-1.5 rounded bg-white text-black hover:bg-white/80" title="Modifica"><Edit2 className="w-4 h-4" /></button>}
                      {isPwa && <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600" title="Elimina"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPayments.length === 0 && <div className="p-12 text-center text-white/40"><CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun pagamento trovato</p></div>}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nuovo Pagamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label>Tipo *</Label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="client">Cliente</option><option value="supplier">Fornitore</option><option value="collaborator">Collaboratore</option></select></div>
            <div><Label>Importo (EUR) *</Label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrizione *</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="in_attesa">In Attesa</option><option value="pagato">Pagato</option><option value="in_ritardo">Scaduto</option><option value="in_verifica">In Verifica</option><option value="parziale">Parziale</option></select></div>
            <div><Label>Scadenza</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
            <div><Label>Cliente</Label><select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{clients?.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}</select></div>
            <div><Label>Cantiere</Label><select value={formData.cantiereId} onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{cantieri?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div><Label>Fornitore</Label><select value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{suppliers?.map((s) => <option key={s._id} value={s._id}>{s.companyName}</option>)}</select></div>
            <div><Label>Metodo</Label><select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="bonifico">Bonifico</option><option value="contanti">Contanti</option><option value="carta">Carta</option><option value="paypal">PayPal</option><option value="altro">Altro</option></select></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Registra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog with Proof */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Dettagli Pagamento</DialogTitle></DialogHeader>
          {paymentDetail && (() => {
            const { payment: p, proofDoc } = paymentDetail
            return (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${p.type === "client" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      {p.type === "client" ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
                    </div>
                    <div><h3 className="text-lg font-semibold text-white">{p.description}</h3><p className="text-sm text-white/60">{p.method || "-"}</p></div>
                  </div>
                  {statusBadge(p.status)}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-white/40">Tipo</span><p className="text-white">{p.type === "client" ? "Entrata" : p.type === "supplier" ? "Uscita Fornitore" : "Uscita Collaboratore"}</p></div>
                  <div><span className="text-white/40">Importo</span><p className={`font-bold text-lg ${p.type === "client" ? "text-green-400" : "text-red-400"}`}>EUR{p.amount.toLocaleString("it-IT")}</p></div>
                  <div><span className="text-white/40">Scadenza</span><p className="text-white">{p.dueDate || "-"}</p></div>
                  {p.paidDate && <div><span className="text-white/40">Data Pagamento</span><p className="text-white">{p.paidDate}</p></div>}
                </div>
                {p.clientId && <div className="pt-2 border-t border-white/10"><Link href="/clients" className="text-sm text-kranely-accent hover:underline flex items-center gap-2"><Users className="w-4 h-4" /> {getEntityName("clientId", p.clientId)}</Link></div>}
                {p.cantiereId && <div className="pt-2 border-t border-white/10"><Link href="/cantieri" className="text-sm text-kranely-accent hover:underline flex items-center gap-2"><Building2 className="w-4 h-4" /> {getEntityName("cantiereId", p.cantiereId)}</Link></div>}
                {p.supplierId && <div className="pt-2 border-t border-white/10"><Link href="/suppliers" className="text-sm text-kranely-accent hover:underline flex items-center gap-2"><Truck className="w-4 h-4" /> {getEntityName("supplierId", p.supplierId)}</Link></div>}
                {p.notes && <div><span className="text-white/40 text-sm">Note</span><p className="text-sm text-white mt-1">{p.notes}</p></div>}
                {proofDoc && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-xs text-white/40 block mb-2">Ricevuta di pagamento</span>
                    <Button onClick={() => safeWindowOpen(proofDoc.fileUrl)} className="bg-kranely-accent text-kranely-app-bg w-full">
                      <FileText className="w-4 h-4 mr-2" /> {proofDoc.fileName || "Apri ricevuta"}
                    </Button>
                  </div>
                )}
              </div>
            )
          })()}
          {!paymentDetail && <p className="text-white/60 text-center py-4">Caricamento...</p>}
        </DialogContent>
      </Dialog>

      {/* Mark as Paid + Proof Upload Dialog */}
      <Dialog open={showProofUploadDialog} onOpenChange={setShowProofUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Segna come pagato</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Metodo di pagamento</Label>
              <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="bonifico">Bonifico</option>
                <option value="contanti">Contanti</option>
                <option value="carta">Carta</option>
                <option value="paypal">PayPal</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div>
              <Label>Allega ricevuta (opzionale)</Label>
              <input ref={proofFileRef} type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-kranely-accent file:text-kranely-app-bg hover:file:bg-kranely-accent/90 mt-2" />
              {proofFile && <p className="text-xs text-white/40 mt-1">{proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProofUploadDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleMarkAsPaidWithProof} disabled={uploadingProof} className="bg-green-600 hover:bg-green-700 text-white">
              {uploadingProof ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Caricamento...</> : <><CheckCircle className="w-4 h-4 mr-2" />Conferma pagamento</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Modifica Pagamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Descrizione</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Label>Importo (EUR)</Label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="in_attesa">In Attesa</option><option value="pagato">Pagato</option><option value="in_ritardo">Scaduto</option><option value="in_verifica">In Verifica</option><option value="parziale">Parziale</option></select></div>
            <div><Label>Scadenza</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
            <div><Label>Metodo</Label><select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="bonifico">Bonifico</option><option value="contanti">Contanti</option><option value="carta">Carta</option><option value="paypal">PayPal</option><option value="altro">Altro</option></select></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleUpdate} className="bg-kranely-accent text-kranely-app-bg">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
