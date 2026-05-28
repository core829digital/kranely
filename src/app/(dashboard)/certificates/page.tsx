"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"
import { Plus, Search, Eye, Edit2, Trash2, FileText, AlertCircle, CheckCircle2, Clock, Users, Building2 } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function CertificatesPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<"all" | "sicurezza" | "qualifica" | "conformita" | "ambientale" | "altro">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "valido" | "in_scadenza" | "scaduto" | "in_rinnovo">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [editingId, setEditingId] = useState<Id<"certificates"> | null>(null)
  const [selectedCertId, setSelectedCertId] = useState<Id<"certificates"> | null>(null)
  const [formData, setFormData] = useState({ name: "", category: "qualifica" as "sicurezza" | "qualifica" | "conformita" | "ambientale" | "altro", status: "valido" as "valido" | "in_scadenza" | "scaduto" | "in_rinnovo", issueDate: "", expiryDate: "", issuedBy: "", description: "", collaboratorId: "", cantiereId: "", documentUrl: "" })

  const certificates = useQuery(api.certificates.list, orgId ? { organizationId: orgId!, category: filterCategory !== "all" ? filterCategory : undefined, status: filterStatus !== "all" ? filterStatus : undefined, userEmail: user?.email } : "skip")
  const stats = useQuery(api.certificates.stats, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const collaborators = useQuery(api.collaborators.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")

  const createCertificate = useMutation(api.certificates.create)
  const updateCertificate = useMutation(api.certificates.update)
  const deleteCertificate = useMutation(api.certificates.remove)

  const selectedCert = useQuery(api.certificates.get, selectedCertId ? { id: selectedCertId, organizationId: orgId! } : "skip")

  const openCreate = () => { setFormData({ name: "", category: "qualifica", status: "valido", issueDate: "", expiryDate: "", issuedBy: "", description: "", collaboratorId: "", cantiereId: "", documentUrl: "" }); setShowCreateDialog(true) }
  const openDetail = (c: any) => { setSelectedCertId(c._id); setShowDetailDialog(true) }
  const openEdit = (c: any) => { setFormData({ name: c.name, category: c.category, status: c.status, issueDate: c.issueDate, expiryDate: c.expiryDate, issuedBy: c.issuedBy || "", description: c.description || "", collaboratorId: c.collaboratorId || "", cantiereId: c.cantiereId || "", documentUrl: c.documentUrl || "" }); setEditingId(c._id); setShowEditDialog(true) }

  const handleCreate = async () => { if (!formData.name || !orgId) { toast.error("Compila i campi obbligatori"); return } try { await createCertificate({ organizationId: orgId!, name: formData.name, category: formData.category, status: formData.status, issueDate: formData.issueDate || undefined, expiryDate: formData.expiryDate || undefined, issuedBy: formData.issuedBy || undefined, description: formData.description || undefined, collaboratorId: formData.collaboratorId ? formData.collaboratorId as Id<"collaborators"> : undefined, cantiereId: formData.cantiereId ? formData.cantiereId as Id<"cantieri"> : undefined }); setShowCreateDialog(false); toast.success("Certificazione aggiunta") } catch (e) { toast.error("Errore") } }
  const handleUpdate = async () => { if (!editingId) return; try { await updateCertificate({ id: editingId, organizationId: orgId!, name: formData.name, category: formData.category as any, status: formData.status as any, issueDate: formData.issueDate, expiryDate: formData.expiryDate, issuedBy: formData.issuedBy || undefined, description: formData.description || undefined }); setShowEditDialog(false); toast.success("Certificazione aggiornata") } catch (e) { toast.error("Errore") } }
  const handleDelete = async (id: Id<"certificates">) => {
    if (!confirm("Eliminare questa certificazione?")) return
    try { await deleteCertificate({ id, organizationId: orgId! }); toast.success("Certificazione eliminata") } catch (e) { toast.error("Errore") }
  }

  const statusBadge = (status: string) => { const map: Record<string, { label: string; variant: "success" | "default" | "secondary" | "destructive" | "warning" }> = { valido: { label: "Valido", variant: "success" }, in_scadenza: { label: "In Scadenza", variant: "warning" }, scaduto: { label: "Scaduto", variant: "destructive" }, in_rinnovo: { label: "In Rinnovo", variant: "default" } }; const { label, variant } = map[status] || { label: status, variant: "secondary" }; return <Badge variant={variant}>{label}</Badge> }
  const categoryLabel = (cat: string) => { const map: Record<string, string> = { sicurezza: "Sicurezza", qualifica: "Qualifica", conformita: "Conformita", ambientale: "Ambientale", altro: "Altro" }; return map[cat] || cat }
  const getCollaboratorName = (id: string) => collaborators?.find((c) => c._id === id)?.fullName
  const getCantiereName = (id: string) => cantieri?.find((c) => c._id === id)?.name

  if (!orgId || !certificates || !stats) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Certificazioni</h1><p className="text-white/60 mt-1">{certificates.length} certificazioni</p></div><Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuova Certificazione</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Validi</span></div><p className="text-xl font-bold text-green-400">{stats.validi}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-yellow-400" /><span className="text-sm text-white/60">In Scadenza</span></div><p className="text-xl font-bold text-yellow-400">{stats.inScadenza}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-red-400" /><span className="text-sm text-white/60">Scaduti</span></div><p className="text-xl font-bold text-red-400">{stats.scaduti}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Totali</span></div><p className="text-xl font-bold text-white">{stats.total}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca certificazioni..." className="pl-10" /></div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutte le categorie</option><option value="sicurezza">Sicurezza</option><option value="qualifica">Qualifica</option><option value="conformita">Conformita</option><option value="ambientale">Ambientale</option></select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti gli stati</option><option value="valido">Valido</option><option value="in_scadenza">In Scadenza</option><option value="scaduto">Scaduto</option></select>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10"><tr><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Certificazione</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden md:table-cell">Categoria</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Stato</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Scadenza</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Associato a</th><th className="w-24"></th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {certificates.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center ${c.status === "valido" ? "bg-green-500/10" : c.status === "scaduto" ? "bg-red-500/10" : "bg-yellow-500/10"}`}><FileText className={`w-4 h-4 ${c.status === "valido" ? "text-green-400" : c.status === "scaduto" ? "text-red-400" : "text-yellow-400"}`} /></div><div><p className="text-sm font-medium text-white">{c.name}</p>{c.issuedBy && <p className="text-xs text-white/40">{c.issuedBy}</p>}</div></div></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Badge variant="secondary">{categoryLabel(c.category)}</Badge></td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-sm text-white/60 hidden lg:table-cell">{c.expiryDate}</td>
                  <td className="px-4 py-3 text-sm text-white/60 hidden lg:table-cell">{c.collaboratorId && <span className="text-kranely-accent">{getCollaboratorName(c.collaboratorId)}</span>}{c.cantiereId && <span className="text-kranely-accent">{getCantiereName(c.cantiereId)}</span>}{!c.collaboratorId && !c.cantiereId && <span>Aziendale</span>}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1"><button onClick={() => openDetail(c)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button><button onClick={() => openEdit(c)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(c._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {certificates.length === 0 && <div className="p-12 text-center text-white/40"><FileText className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessuna certificazione</p></div>}
      </div>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Nuova Certificazione</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Nome *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Categoria</Label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="sicurezza">Sicurezza</option><option value="qualifica">Qualifica</option><option value="conformita">Conformita</option><option value="ambientale">Ambientale</option><option value="altro">Altro</option></select></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="valido">Valido</option><option value="in_scadenza">In Scadenza</option><option value="scaduto">Scaduto</option><option value="in_rinnovo">In Rinnovo</option></select></div>
            <div><Label>Data Emissione *</Label><Input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} /></div>
            <div><Label>Data Scadenza *</Label><Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} /></div>
            <div><Label>Emesso da</Label><Input value={formData.issuedBy} onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })} /></div>
            <div><Label>Collaboratore</Label><select value={formData.collaboratorId} onChange={(e) => setFormData({ ...formData, collaboratorId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{collaborators?.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}</select></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Crea</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Dettagli Certificazione</DialogTitle></DialogHeader>
          {selectedCert && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedCert.status === "valido" ? "bg-green-500/10" : selectedCert.status === "scaduto" ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
                    <FileText className={`w-6 h-6 ${selectedCert.status === "valido" ? "text-green-400" : selectedCert.status === "scaduto" ? "text-red-400" : "text-yellow-400"}`} />
                  </div>
                  <div><h3 className="text-lg font-semibold text-white">{selectedCert.name}</h3><p className="text-sm text-white/60">{selectedCert.issuedBy || "-"}</p></div>
                </div>
                {statusBadge(selectedCert.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40">Categoria</span><p className="text-white">{categoryLabel(selectedCert.category)}</p></div>
                <div><span className="text-white/40">Data Emissione</span><p className="text-white">{selectedCert.issueDate || "-"}</p></div>
                <div><span className="text-white/40">Data Scadenza</span><p className="text-white">{selectedCert.expiryDate || "-"}</p></div>
              </div>
              {selectedCert.description && <div><span className="text-white/40 text-sm">Descrizione</span><p className="text-sm text-white mt-1">{selectedCert.description}</p></div>}
              {selectedCert.collaboratorId && (
                <div className="pt-2 border-t border-white/10"><Link href="/collaborators" className="text-sm text-kranely-accent hover:underline flex items-center gap-2"><Users className="w-4 h-4" /> {getCollaboratorName(selectedCert.collaboratorId)}</Link></div>
              )}
              {selectedCert.cantiereId && (
                <div className="pt-2 border-t border-white/10"><Link href="/cantieri" className="text-sm text-kranely-accent hover:underline flex items-center gap-2"><Building2 className="w-4 h-4" /> {getCantiereName(selectedCert.cantiereId)}</Link></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Modifica Certificazione</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Nome</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="valido">Valido</option><option value="in_scadenza">In Scadenza</option><option value="scaduto">Scaduto</option><option value="in_rinnovo">In Rinnovo</option></select></div>
            <div><Label>Data Scadenza</Label><Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleUpdate} className="bg-kranely-accent text-kranely-app-bg">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
