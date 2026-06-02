"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Phone, Mail, Building, Eye, Edit2, Trash2, FileText, CreditCard, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function ClientsPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"all" | "b2b" | "b2c">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "lead" | "active" | "archived">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | null>(null)
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", address: "", fiscalCode: "", companyName: "", vatNumber: "", type: "b2c" as "b2b" | "b2c", status: "lead" as "lead" | "active" | "archived", notes: ""
  })

  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId!, search: search || undefined, type: filterType !== "all" ? filterType : undefined, status: filterStatus !== "all" ? filterStatus : undefined, userEmail: user?.email } : "skip")
  const allPayments = useQuery(api.payments.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const spentByClient = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of allPayments || []) {
      if (p.status === "pagato" && p.clientId) {
        map[p.clientId] = (map[p.clientId] || 0) + p.amount
      }
    }
    return map
  }, [allPayments])
  const selectedClient = useQuery(api.clients.get, selectedClientId ? { id: selectedClientId, organizationId: orgId! } : "skip")
  const clientQuotes = useQuery(api.quotes.list, selectedClientId ? { organizationId: orgId!!, clientId: selectedClientId, userEmail: user?.email } : "skip")
  const clientPayments = useQuery(api.payments.list, selectedClientId ? { organizationId: orgId!!, clientId: selectedClientId, userEmail: user?.email } : "skip")
  const clientCantieri = useQuery(api.cantieri.list, selectedClientId ? { organizationId: orgId!!, clientId: selectedClientId, userEmail: user?.email } : "skip")
  const clientDocuments = useQuery(api.documents.list, selectedClientId ? { organizationId: orgId!!, clientId: selectedClientId, userEmail: user?.email } : "skip")
  const clientAppointments = useQuery(api.appointments.list, selectedClientId ? { organizationId: orgId!!, email: selectedClient?.email, userEmail: user?.email } : "skip")

  const createClient = useMutation(api.clients.createClient)
  const updateClient = useMutation(api.clients.update)
  const deleteClient = useMutation(api.clients.remove)

  const openCreate = () => {
    setFormData({ fullName: "", email: "", phone: "", address: "", fiscalCode: "", companyName: "", vatNumber: "", type: "b2c", status: "lead", notes: "" })
    setShowCreateDialog(true)
  }

  const openEdit = (client: any) => {
    setSelectedClientId(client._id)
    setFormData({ fullName: client.fullName, email: client.email, phone: client.phone || "", address: client.address || "", fiscalCode: client.fiscalCode || "", companyName: client.companyName || "", vatNumber: client.vatNumber || "", type: client.clientType, status: client.status, notes: client.notes || "" })
    setShowEditDialog(true)
  }

  const openDetail = (client: any) => { setSelectedClientId(client._id); setShowDetailDialog(true) }

  const handleCreate = async () => {
    if (!formData.fullName || !formData.email || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try {
      await createClient({ organizationId: orgId!, fullName: formData.fullName, email: formData.email, phone: formData.phone, address: formData.address, fiscalCode: formData.fiscalCode, companyName: formData.companyName, vatNumber: formData.vatNumber, type: formData.type, status: formData.status, notes: formData.notes, userEmail: user?.email })
      setShowCreateDialog(false); toast.success("Cliente creato con successo")
    } catch (e) { toast.error("Errore nella creazione") }
  }

  const handleUpdate = async () => {
    if (!selectedClientId) return
    try {
      await updateClient({ id: selectedClientId, organizationId: orgId!, fullName: formData.fullName, email: formData.email, phone: formData.phone, address: formData.address, fiscalCode: formData.fiscalCode, companyName: formData.companyName, vatNumber: formData.vatNumber, type: formData.type as any, status: formData.status, notes: formData.notes, userEmail: user?.email })
      setShowEditDialog(false); toast.success("Cliente aggiornato")
    } catch (e) { toast.error("Errore nell'aggiornamento") }
  }

  const handleDelete = async (id: Id<"clients">) => {
    if (!confirm("Eliminare questo cliente?")) return
    try { await deleteClient({ id, organizationId: orgId!, userEmail: user?.email }); toast.success("Cliente eliminato") } catch (e) { toast.error("Errore nell'eliminazione") }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "success" | "default" | "secondary" }> = { active: { label: "Attivo", variant: "success" }, lead: { label: "Lead", variant: "default" }, archived: { label: "Archiviato", variant: "secondary" } }
    const { label, variant } = map[status] || { label: status, variant: "secondary" }
    return <Badge variant={variant}>{label}</Badge>
  }

  if (!orgId || !clients) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Clienti</h1><p className="text-white/60 mt-1">{clients.length} clienti trovati</p></div>
        <Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo Cliente</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca clienti..." className="pl-10" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti i tipi</option><option value="b2b">B2B</option><option value="b2c">B2C</option></select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti gli stati</option><option value="lead">Lead</option><option value="active">Attivo</option><option value="archived">Archiviato</option></select>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden md:table-cell">Contatti</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Preventivi</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Speso</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clients.map((client) => (
                <tr key={client._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-kranely-accent/10 flex items-center justify-center"><span className="text-kranely-accent text-sm font-semibold">{client.fullName.charAt(0)}</span></div>
                      <div><p className="text-sm font-medium text-white">{client.fullName}</p>{client.companyName && <p className="text-xs text-white/40">{client.companyName}</p>}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-white/60"><Mail className="w-3 h-3" />{client.email}</div>
                      {client.phone && <div className="flex items-center gap-1.5 text-xs text-white/60"><Phone className="w-3 h-3" />{client.phone}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Badge variant={client.clientType === "b2b" ? "default" : "secondary"}>{client.clientType.toUpperCase()}</Badge></td>
                  <td className="px-4 py-3">{statusBadge(client.status)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Link href="/quotes" className="text-sm text-kranely-accent hover:underline">Vedi preventivi</Link></td>
                  <td className="px-4 py-3 text-sm text-white font-medium hidden lg:table-cell">{spentByClient[client._id] ? `EUR${spentByClient[client._id].toLocaleString("it-IT")}` : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(client)} aria-label={`Visualizza ${client.fullName}`} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(client)} aria-label={`Modifica ${client.fullName}`} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(client._id)} aria-label={`Elimina ${client.fullName}`} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clients.length === 0 && <div className="p-12 text-center text-white/40"><Building className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun cliente trovato</p><Button onClick={openCreate} variant="outline" className="mt-4 border-white/20"><Plus className="w-4 h-4 mr-2" /> Aggiungi il primo cliente</Button></div>}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nuovo Cliente</DialogTitle><DialogDescription>Compila i dati del nuovo cliente</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label>Nome Completo *</Label><Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Mario Rossi" /></div>
            <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="mario@email.com" /></div>
            <div><Label>Telefono</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+39 333 1234567" /></div>
            <div><Label>Tipo Cliente</Label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as "b2b" | "b2c" })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="b2c">B2C - Privato</option><option value="b2b">B2B - Azienda</option></select></div>
            {formData.type === "b2b" && (<><div><Label>Ragione Sociale</Label><Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Azienda Srl" /></div><div><Label>Partita IVA</Label><Input value={formData.vatNumber} onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })} placeholder="IT01234567890" /></div></>)}
            <div><Label>Codice Fiscale</Label><Input value={formData.fiscalCode} onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value })} placeholder="RSSMRA80A01F205X" /></div>
            <div><Label>Indirizzo</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Via Roma 15, Milano" /></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Note aggiuntive..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">Crea Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Modifica Cliente</DialogTitle><DialogDescription>Aggiorna i dati del cliente</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label>Nome Completo *</Label><Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>Telefono</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="lead">Lead</option><option value="active">Attivo</option><option value="archived">Archiviato</option></select></div>
            <div><Label>Codice Fiscale</Label><Input value={formData.fiscalCode} onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value })} /></div>
            <div><Label>Indirizzo</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleUpdate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">Salva Modifiche</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Dettagli Cliente</DialogTitle></DialogHeader>
          {selectedClient && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-kranely-accent/10 flex items-center justify-center"><span className="text-kranely-accent text-xl font-bold">{selectedClient.fullName.charAt(0)}</span></div>
                <div><h3 className="text-lg font-semibold text-white">{selectedClient.fullName}</h3>{selectedClient.companyName && <p className="text-sm text-white/60">{selectedClient.companyName}</p>}<div className="flex gap-2 mt-1">{statusBadge(selectedClient.status)}<Badge variant={selectedClient.clientType === "b2b" ? "default" : "secondary"}>{selectedClient.clientType.toUpperCase()}</Badge></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40">Email</span><p className="text-white">{selectedClient.email}</p></div>
                <div><span className="text-white/40">Telefono</span><p className="text-white">{selectedClient.phone || "-"}</p></div>
                <div><span className="text-white/40">Codice Fiscale</span><p className="text-white">{selectedClient.fiscalCode || "-"}</p></div>
                <div><span className="text-white/40">P.IVA</span><p className="text-white">{selectedClient.vatNumber || "-"}</p></div>
                <div><span className="text-white/40">Indirizzo</span><p className="text-white">{selectedClient.address || "-"}</p></div>
              </div>
              {selectedClient.notes && <div><span className="text-white/40 text-sm">Note</span><p className="text-sm text-white mt-1">{selectedClient.notes}</p></div>}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4" /> Preventivi ({clientQuotes?.length || 0})</h4>
                {clientQuotes && clientQuotes.length > 0 ? (<div className="space-y-2">{clientQuotes.slice(0, 5).map((q) => (<div key={q._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{q.title}</span><div className="flex items-center gap-2"><Badge variant={q.status === "accepted" ? "success" : q.status === "sent" ? "default" : "secondary"}>{q.status}</Badge><span className="text-kranely-accent font-medium">EUR{q.estimatedPrice?.toLocaleString("it-IT") || 0}</span></div></div>))}<Link href="/quotes" className="text-xs text-kranely-accent hover:underline">Vedi tutti i preventivi</Link></div>) : <p className="text-xs text-white/40">Nessun preventivo</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Building className="w-4 h-4" /> Cantieri ({clientCantieri?.length || 0})</h4>
                {clientCantieri && clientCantieri.length > 0 ? (<div className="space-y-2">{clientCantieri.slice(0, 5).map((c) => (<div key={c._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{c.name}</span><div className="flex items-center gap-2"><Badge variant={c.status === "in_corso" ? "success" : c.status === "pianificato" ? "default" : "secondary"}>{c.status}</Badge><span className="text-white/60">EUR{c.totalBudget?.toLocaleString("it-IT") || 0}</span></div></div>))}<Link href="/cantieri" className="text-xs text-kranely-accent hover:underline">Vedi tutti i cantieri</Link></div>) : <p className="text-xs text-white/40">Nessun cantiere</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><CreditCard className="w-4 h-4" /> Pagamenti</h4>
                {clientPayments && clientPayments.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-center"><p className="text-lg font-bold text-green-400">EUR{clientPayments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")}</p><p className="text-xs text-white/60">Pagati</p></div>
                    <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20 text-center"><p className="text-lg font-bold text-yellow-400">EUR{clientPayments.filter((p) => p.status === "in_attesa").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")}</p><p className="text-xs text-white/60">In attesa</p></div>
                    <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-center"><p className="text-lg font-bold text-red-400">EUR{clientPayments.filter((p) => p.status === "in_ritardo").reduce((s, p) => s + p.amount, 0).toLocaleString("it-IT")}</p><p className="text-xs text-white/60">Scaduti</p></div>
                  </div>
                ) : <p className="text-xs text-white/40">Nessun pagamento</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4" /> Documenti ({clientDocuments?.length || 0})</h4>
                {clientDocuments && clientDocuments.length > 0 ? (
                  <div className="space-y-2">{clientDocuments.slice(0, 5).map((d) => (<div key={d._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{d.title}</span><Badge variant="secondary">{d.type}</Badge></div>))}</div>
                ) : <p className="text-xs text-white/40">Nessun documento</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4" /> Appuntamenti ({clientAppointments?.length || 0})</h4>
                {clientAppointments && clientAppointments.length > 0 ? (
                  <div className="space-y-2">{clientAppointments.slice(0, 5).map((a) => (<div key={a._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{a.title}</span><span className="text-xs text-white/40">{a.appointmentDate}</span></div>))}</div>
                ) : <p className="text-xs text-white/40">Nessun appuntamento</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
