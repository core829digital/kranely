"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Eye, Edit2, Trash2, Users, Mail, Phone, Clock, Calendar, FileText, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function CollaboratorsPage() {
  const orgId = useOrgId()
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"all" | "employee" | "contractor" | "subcontractor" | "freelancer">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "on_leave">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [editingId, setEditingId] = useState<Id<"collaborators"> | null>(null)
  const [selectedCollabId, setSelectedCollabId] = useState<Id<"collaborators"> | null>(null)

  const selectedCollab = useQuery(api.collaborators.get, selectedCollabId ? { id: selectedCollabId, organizationId: orgId! } : "skip")
  const collabTasks = useQuery(api.tasks.list, selectedCollabId && selectedCollab ? { organizationId: orgId!!, assignedTo: selectedCollab.email } : "skip")
  const collabCertificates = useQuery(api.certificates.list, selectedCollabId && selectedCollab ? { organizationId: orgId!!, collaboratorId: selectedCollabId } : "skip")
  const collabAppointments = useQuery(api.appointments.list, selectedCollabId && selectedCollab ? { organizationId: orgId!!, email: selectedCollab.email } : "skip")
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", type: "employee" as "employee" | "contractor" | "subcontractor" | "freelancer", specialization: "", status: "active" as "active" | "inactive" | "on_leave", hourlyRate: "", dailyRate: "", notes: ""
  })

  const collaborators = useQuery(api.collaborators.list, orgId ? { organizationId: orgId!, search: search || undefined, type: filterType !== "all" ? filterType : undefined, status: filterStatus !== "all" ? filterStatus : undefined } : "skip")
  const stats = useQuery(api.collaborators.stats, orgId ? { organizationId: orgId! } : "skip")

  const createCollaborator = useMutation(api.collaborators.create)
  const updateCollaborator = useMutation(api.collaborators.update)
  const deleteCollaborator = useMutation(api.collaborators.remove)

  const openCreate = () => { setFormData({ fullName: "", email: "", phone: "", type: "employee", specialization: "", status: "active", hourlyRate: "", dailyRate: "", notes: "" }); setShowCreateDialog(true) }
  const openDetail = (c: any) => { setSelectedCollabId(c._id); setShowDetailDialog(true) }
  const openEdit = (c: any) => { setFormData({ fullName: c.fullName, email: c.email, phone: c.phone || "", type: c.type, specialization: c.specialization || "", status: c.status, hourlyRate: c.hourlyRate?.toString() || "", dailyRate: c.dailyRate?.toString() || "", notes: c.notes || "" }); setEditingId(c._id); setShowEditDialog(true) }

  const handleCreate = async () => {
    if (!formData.fullName || !formData.email || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try { await createCollaborator({ organizationId: orgId!, fullName: formData.fullName, email: formData.email, phone: formData.phone, type: formData.type, specialization: formData.specialization || undefined, status: formData.status, hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined, dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined, notes: formData.notes || undefined }); setShowCreateDialog(false); toast.success("Collaboratore aggiunto") } catch (e) { toast.error("Errore") }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try { await updateCollaborator({ id: editingId, organizationId: orgId!, fullName: formData.fullName, email: formData.email, phone: formData.phone, type: formData.type as any, specialization: formData.specialization || undefined, status: formData.status as any, hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined, dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined, notes: formData.notes || undefined }); setShowEditDialog(false); toast.success("Collaboratore aggiornato") } catch (e) { toast.error("Errore") }
  }

  const handleDelete = async (id: Id<"collaborators">) => {
    if (!confirm("Eliminare questo collaboratore?")) return
    try { await deleteCollaborator({ id, organizationId: orgId! }); toast.success("Collaboratore eliminato") } catch (e) { toast.error("Errore") }
  }

  const statusBadge = (status: string) => { const map: Record<string, { label: string; variant: "success" | "default" | "secondary" }> = { active: { label: "Attivo", variant: "success" }, inactive: { label: "Inattivo", variant: "secondary" }, on_leave: { label: "In Permesso", variant: "default" } }; const { label, variant } = map[status] || { label: status, variant: "secondary" }; return <Badge variant={variant}>{label}</Badge> }
  const typeLabel = (type: string) => { const map: Record<string, string> = { employee: "Dipendente", contractor: "Contractor", subcontractor: "Subappaltatore", freelancer: "Freelance" }; return map[type] || type }

  if (!orgId || !collaborators || !stats) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Collaboratori</h1><p className="text-white/60 mt-1">{collaborators.length} collaboratori</p></div><Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo Collaboratore</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Totali</span></div><p className="text-xl font-bold text-white">{stats.total}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Attivi</span></div><p className="text-xl font-bold text-green-400">{stats.active}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-yellow-400" /><span className="text-sm text-white/60">In Permesso</span></div><p className="text-xl font-bold text-yellow-400">{stats.onLeave}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-white/40" /><span className="text-sm text-white/60">Inattivi</span></div><p className="text-xl font-bold text-white/40">{stats.inactive}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca collaboratori..." className="pl-10" /></div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti i tipi</option><option value="employee">Dipendente</option><option value="contractor">Contractor</option><option value="subcontractor">Subappaltatore</option><option value="freelancer">Freelance</option></select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti gli stati</option><option value="active">Attivo</option><option value="inactive">Inattivo</option><option value="on_leave">In Permesso</option></select>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10"><tr><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Nome</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden md:table-cell">Contatti</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Tipo</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Stato</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Tariffa/giorno</th><th className="w-24"></th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {collaborators.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-kranely-accent/10 flex items-center justify-center"><span className="text-kranely-accent text-sm font-semibold">{c.fullName.charAt(0)}</span></div><div><p className="text-sm font-medium text-white">{c.fullName}</p>{c.specialization && <p className="text-xs text-white/40">{c.specialization}</p>}</div></div></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="space-y-0.5"><div className="flex items-center gap-1.5 text-xs text-white/60"><Mail className="w-3 h-3" />{c.email}</div>{c.phone && <div className="flex items-center gap-1.5 text-xs text-white/60"><Phone className="w-3 h-3" />{c.phone}</div>}</div></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Badge variant="secondary">{typeLabel(c.type)}</Badge></td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium hidden lg:table-cell">{c.dailyRate ? `EUR${c.dailyRate}` : c.hourlyRate ? `EUR${c.hourlyRate}/h` : "-"}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1"><button onClick={() => openDetail(c)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button><button onClick={() => openEdit(c)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(c._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {collaborators.length === 0 && <div className="p-12 text-center text-white/40"><Users className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun collaboratore</p></div>}
      </div>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Nuovo Collaboratore</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label>Nome Completo *</Label><Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>Telefono</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><Label>Tipo</Label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="employee">Dipendente</option><option value="contractor">Contractor</option><option value="subcontractor">Subappaltatore</option><option value="freelancer">Freelance</option></select></div>
            <div><Label>Specializzazione</Label><Input value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} /></div>
            <div><Label>Tariffa Oraria (EUR)</Label><Input type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} /></div>
            <div><Label>Tariffa Giornaliera (EUR)</Label><Input type="number" value={formData.dailyRate} onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Crea</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Dettagli Collaboratore</DialogTitle></DialogHeader>
          {selectedCollab && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-kranely-accent/10 flex items-center justify-center"><span className="text-kranely-accent text-xl font-bold">{selectedCollab.fullName.charAt(0)}</span></div>
                <div><h3 className="text-lg font-semibold text-white">{selectedCollab.fullName}</h3><div className="flex gap-2 mt-1">{statusBadge(selectedCollab.status)}<Badge variant="secondary">{typeLabel(selectedCollab.type)}</Badge></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40">Email</span><p className="text-white">{selectedCollab.email}</p></div>
                <div><span className="text-white/40">Telefono</span><p className="text-white">{selectedCollab.phone || "-"}</p></div>
                <div><span className="text-white/40">Specializzazione</span><p className="text-white">{selectedCollab.specialization || "-"}</p></div>
                <div><span className="text-white/40">Tariffa</span><p className="text-kranely-accent font-bold">{selectedCollab.dailyRate ? `EUR${selectedCollab.dailyRate}/giorno` : selectedCollab.hourlyRate ? `EUR${selectedCollab.hourlyRate}/h` : "-"}</p></div>
              </div>
              {selectedCollab.notes && <div><span className="text-white/40 text-sm">Note</span><p className="text-sm text-white mt-1">{selectedCollab.notes}</p></div>}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4" /> Attivita ({collabTasks?.length || 0})</h4>
                {collabTasks && collabTasks.length > 0 ? (
                  <div className="space-y-2">{collabTasks.slice(0, 5).map((t) => (<div key={t._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{t.title}</span><Badge variant={t.status === "completato" ? "success" : t.status === "in_corso" ? "default" : "secondary"}>{t.status}</Badge></div>))}</div>
                ) : <p className="text-xs text-white/40">Nessuna attivita</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Certificati ({collabCertificates?.length || 0})</h4>
                {collabCertificates && collabCertificates.length > 0 ? (
                  <div className="space-y-2">{collabCertificates.slice(0, 5).map((c) => (<div key={c._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{c.name}</span><Badge variant={c.status === "valido" ? "success" : "destructive"}>{c.status}</Badge></div>))}</div>
                ) : <p className="text-xs text-white/40">Nessun certificato</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4" /> Appuntamenti ({collabAppointments?.length || 0})</h4>
                {collabAppointments && collabAppointments.length > 0 ? (
                  <div className="space-y-2">{collabAppointments.slice(0, 5).map((a) => (<div key={a._id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm"><span className="text-white">{a.title}</span><span className="text-xs text-white/40">{a.appointmentDate}</span></div>))}</div>
                ) : <p className="text-xs text-white/40">Nessun appuntamento</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Modifica Collaboratore</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label>Nome</Label><Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>Telefono</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="active">Attivo</option><option value="inactive">Inattivo</option><option value="on_leave">In Permesso</option></select></div>
            <div><Label>Tariffa Oraria</Label><Input type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} /></div>
            <div><Label>Tariffa Giornaliera</Label><Input type="number" value={formData.dailyRate} onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleUpdate} className="bg-kranely-accent text-kranely-app-bg">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
