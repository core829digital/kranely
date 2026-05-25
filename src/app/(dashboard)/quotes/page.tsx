"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Plus, Search, Eye, Edit2, Trash2, FileText, Building2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function QuotesPage() {
  const orgId = useOrgId()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "sent" | "accepted" | "rejected" | "in_lavorazione">("all")
  const [filterType, setFilterType] = useState<"all" | "preventivo" | "sopralluogo" | "assistenza">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<Id<"quotes"> | null>(null)
  const [formData, setFormData] = useState({
    clientId: "", title: "", description: "", quoteType: "preventivo" as "preventivo" | "sopralluogo" | "assistenza", status: "draft" as "draft" | "sent" | "accepted" | "rejected" | "in_lavorazione", totalAmount: "", validUntil: "", email: ""
  })

  const quotes = useQuery(api.quotes.list, orgId ? { organizationId: orgId!, search: search || undefined, status: filterStatus !== "all" ? filterStatus : undefined, type: filterType !== "all" ? filterType : undefined } : "skip")
  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId! } : "skip")
  const selectedQuote = useQuery(api.quotes.get, selectedQuoteId ? { id: selectedQuoteId, organizationId: orgId! } : "skip")
  const quoteClient = useQuery(api.clients.get, selectedQuote?.clientId ? { id: selectedQuote.clientId, organizationId: orgId! } : "skip")
  const quoteCantiere = useQuery(api.cantieri.get, selectedQuote?.cantiereId ? { id: selectedQuote.cantiereId, organizationId: orgId! } : "skip")
  const quotePayments = useQuery(api.payments.list, selectedQuote?.cantiereId ? { organizationId: orgId!!, cantiereId: selectedQuote.cantiereId } : "skip")
  const quoteDocuments = useQuery(api.documents.list, selectedQuoteId ? { organizationId: orgId!!, quoteId: selectedQuoteId } : "skip")

  const createQuote = useMutation(api.quotes.create)
  const updateQuote = useMutation(api.quotes.update)
  const deleteQuote = useMutation(api.quotes.remove)

  const openCreate = () => {
    setFormData({ clientId: "", title: "", description: "", quoteType: "preventivo", status: "draft", totalAmount: "", validUntil: "", email: "" })
    setShowCreateDialog(true)
  }

  const openEdit = (quote: any) => {
    setSelectedQuoteId(quote._id)
    setFormData({
      clientId: quote.clientId, title: quote.title, description: quote.description || "", quoteType: quote.quoteType, status: quote.status, totalAmount: quote.estimatedPrice?.toString() || "", validUntil: quote.clientQuoteExpiresAt || "", email: quote.email,
    })
    setShowEditDialog(true)
  }

  const openDetail = (quote: any) => {
    setSelectedQuoteId(quote._id)
    setShowDetailDialog(true)
  }

  const handleCreate = async () => {
    if (!formData.title || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try {
      await createQuote({ organizationId: orgId!, clientId: formData.clientId as Id<"clients">, title: formData.title, description: formData.description, quoteType: formData.quoteType, status: formData.status, estimatedPrice: formData.totalAmount ? parseFloat(formData.totalAmount) : undefined, clientQuoteExpiresAt: formData.validUntil || undefined, email: formData.email })
      setShowCreateDialog(false)
      toast.success("Preventivo creato")
    } catch (e) { toast.error("Errore nella creazione") }
  }

  const handleUpdate = async () => {
    if (!selectedQuoteId) return
    try {
      await updateQuote({ id: selectedQuoteId, organizationId: orgId!, title: formData.title, description: formData.description, quoteType: formData.quoteType, status: formData.status, estimatedPrice: formData.totalAmount ? parseFloat(formData.totalAmount) : undefined, clientQuoteExpiresAt: formData.validUntil || undefined })
      setShowEditDialog(false)
      toast.success("Preventivo aggiornato")
    } catch (e) { toast.error("Errore nell'aggiornamento") }
  }

  const handleDelete = async (id: Id<"quotes">) => {
    if (!confirm("Eliminare questo preventivo?")) return
    try { await deleteQuote({ id, organizationId: orgId! }); toast.success("Preventivo eliminato") } catch (e) { toast.error("Errore nell'eliminazione") }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "success" | "default" | "secondary" | "destructive" | "warning" }> = {
      draft: { label: "Bozza", variant: "secondary" }, sent: { label: "Inviato", variant: "default" }, accepted: { label: "Accettato", variant: "success" }, rejected: { label: "Rifiutato", variant: "destructive" }, in_lavorazione: { label: "In Corso", variant: "warning" },
    }
    const { label, variant } = map[status] || { label: status, variant: "secondary" }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getClientName = (clientId: Id<"clients"> | undefined) => {
    const client = clients?.find((c) => c._id === clientId)
    return client?.fullName || "..."
  }

  if (!orgId || !quotes || !clients) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Preventivi</h1><p className="text-white/60 mt-1">{quotes.length} preventivi trovati</p></div>
        <Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo Preventivo</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca preventivi..." className="pl-10" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
          <option value="all">Tutti gli stati</option><option value="draft">Bozza</option><option value="sent">Inviato</option><option value="accepted">Accettato</option><option value="rejected">Rifiutato</option><option value="in_lavorazione">In Corso</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
          <option value="all">Tutti i tipi</option><option value="preventivo">Preventivo</option><option value="sopralluogo">Sopralluogo</option><option value="assistenza">Assistenza</option>
        </select>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Preventivo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Importo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Valido fino a</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {quotes.map((quote) => (
                <tr key={quote._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-kranely-accent/10 flex items-center justify-center"><FileText className="w-4 h-4 text-kranely-accent" /></div>
                      <div><p className="text-sm font-medium text-white">{quote.title}</p><p className="text-xs text-white/40">{quote.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Link href="/clients" className="text-sm text-kranely-accent hover:underline">{getClientName(quote.clientId)}</Link></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Badge variant="secondary">{quote.quoteType}</Badge></td>
                  <td className="px-4 py-3">{statusBadge(quote.status)}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium hidden lg:table-cell">EUR{quote.estimatedPrice?.toLocaleString("it-IT") || 0}</td>
                  <td className="px-4 py-3 text-sm text-white/60 hidden lg:table-cell">{quote.clientQuoteExpiresAt || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(quote)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(quote)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(quote._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {quotes.length === 0 && (
          <div className="p-12 text-center text-white/40">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nessun preventivo trovato</p>
            <Button onClick={openCreate} variant="outline" className="mt-4 border-white/20"><Plus className="w-4 h-4 mr-2" /> Crea il primo preventivo</Button>
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nuovo Preventivo</DialogTitle><DialogDescription>Compila i dati del preventivo</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Titolo *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ristrutturazione facciata" /></div>
            <div><Label>Cliente *</Label><select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Seleziona cliente</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.fullName}{c.companyName ? ` (${c.companyName})` : ""}</option>)}</select></div>
            <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="cliente@email.com" /></div>
            <div><Label>Tipo</Label><select value={formData.quoteType} onChange={(e) => setFormData({ ...formData, quoteType: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="preventivo">Preventivo</option><option value="sopralluogo">Sopralluogo</option><option value="assistenza">Assistenza</option></select></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="draft">Bozza</option><option value="sent">Inviato</option><option value="accepted">Accettato</option><option value="rejected">Rifiutato</option><option value="in_lavorazione">In Corso</option></select></div>
            <div><Label>Importo (EUR)</Label><Input type="number" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} placeholder="0" /></div>
            <div><Label>Valido fino a</Label><Input type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrizione del preventivo..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">Crea Preventivo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Modifica Preventivo</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Titolo</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>Tipo</Label><select value={formData.quoteType} onChange={(e) => setFormData({ ...formData, quoteType: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="preventivo">Preventivo</option><option value="sopralluogo">Sopralluogo</option><option value="assistenza">Assistenza</option></select></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="draft">Bozza</option><option value="sent">Inviato</option><option value="accepted">Accettato</option><option value="rejected">Rifiutato</option><option value="in_lavorazione">In Corso</option></select></div>
            <div><Label>Importo (EUR)</Label><Input type="number" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} /></div>
            <div><Label>Valido fino a</Label><Input type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} /></div>
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
          <DialogHeader><DialogTitle>Dettagli Preventivo</DialogTitle></DialogHeader>
          {selectedQuote && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-white">{selectedQuote.title}</h3>{statusBadge(selectedQuote.status)}</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40">Cliente</span><p className="text-white">{quoteClient?.fullName || "..."}</p></div>
                <div><span className="text-white/40">Email</span><p className="text-white">{selectedQuote.email}</p></div>
                <div><span className="text-white/40">Tipo</span><p className="text-white">{selectedQuote.quoteType}</p></div>
                <div><span className="text-white/40">Importo</span><p className="text-kranely-accent font-bold text-lg">EUR{selectedQuote.estimatedPrice?.toLocaleString("it-IT") || 0}</p></div>
                <div><span className="text-white/40">Valido fino a</span><p className="text-white">{selectedQuote.validUntil || "-"}</p></div>
              </div>
              {selectedQuote.description && <div><span className="text-white/40 text-sm">Descrizione</span><p className="text-sm text-white mt-1">{selectedQuote.description}</p></div>}
              {selectedQuote.status === "accepted" && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Building2 className="w-4 h-4" /> Cantiere</h4>
                  {quoteCantiere ? (
                    <Link href="/cantieri" className="flex items-center justify-between p-2 rounded bg-white/5 text-sm hover:bg-white/10 transition-colors">
                      <span className="text-white">{quoteCantiere.name}</span>
                      <Badge variant={quoteCantiere.status === "in_corso" ? "success" : quoteCantiere.status === "pianificato" ? "default" : "secondary"}>{quoteCantiere.status}</Badge>
                    </Link>
                  ) : <p className="text-sm text-white/40">Nessun cantiere collegato</p>}
                </div>
              )}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><CreditCard className="w-4 h-4" /> Pagamenti ({quotePayments?.length || 0})</h4>
                {quotePayments && quotePayments.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-center"><p className="text-lg font-bold text-green-400">EUR{quotePayments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")}</p><p className="text-xs text-white/60">Pagati</p></div>
                    <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20 text-center"><p className="text-lg font-bold text-yellow-400">EUR{quotePayments.filter((p) => p.status === "in_attesa").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")}</p><p className="text-xs text-white/60">In attesa</p></div>
                    <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-center"><p className="text-lg font-bold text-red-400">EUR{quotePayments.filter((p) => p.status === "in_ritardo").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")}</p><p className="text-xs text-white/60">Scaduti</p></div>
                  </div>
                ) : <p className="text-sm text-white/40">Nessun pagamento</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4" /> Documenti ({quoteDocuments?.length || 0})</h4>
                {quoteDocuments && quoteDocuments.length > 0 ? (
                  <div className="space-y-2">{quoteDocuments.slice(0, 5).map((d) => (<div key={d._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{d.title}</span><Badge variant="secondary">{d.type}</Badge></div>))}</div>
                ) : <p className="text-sm text-white/40">Nessun documento</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
