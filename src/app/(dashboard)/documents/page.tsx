"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, Eye, Edit2, Trash2, FileText, Download, Upload, FolderOpen } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function DocumentsPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<Id<"documents"> | null>(null)
  const [editingDocId, setEditingDocId] = useState<Id<"documents"> | null>(null)
  const [formData, setFormData] = useState({ title: "", type: "other" as string, fileUrl: "", fileName: "", status: "draft" as string, description: "", clientId: "", cantiereId: "", quoteId: "" })
  const [editFormData, setEditFormData] = useState({ title: "", description: "", status: "draft" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const documents = useQuery(api.documents.list, orgId ? { organizationId: orgId!, status: filterStatus !== "all" ? filterStatus : undefined, userEmail: user?.email } : "skip")
  const stats = useQuery(api.documents.stats, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const selectedDoc = useQuery(api.documents.get, selectedDocId ? { id: selectedDocId, organizationId: orgId! } : "skip")

  const createDocument = useMutation(api.documents.create)
  const updateDocument = useMutation(api.documents.update)
  const deleteDocument = useMutation(api.documents.remove)

  const openCreate = () => { setFormData({ title: "", type: "other", fileUrl: "", fileName: "", status: "draft", description: "", clientId: "", cantiereId: "", quoteId: "" }); setShowCreateDialog(true) }

  const openDetail = (doc: any) => { setSelectedDocId(doc._id); setShowDetailDialog(true) }

  const openEdit = (doc: any) => {
    setEditFormData({ title: doc.title, description: doc.description || "", status: doc.status })
    setEditingDocId(doc._id)
    setShowEditDialog(true)
  }

  const handleCreate = async () => {
    if (!formData.title || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try { await createDocument({ organizationId: orgId!, title: formData.title, type: formData.type as any, fileUrl: formData.fileUrl || "/docs/placeholder.pdf", fileName: formData.fileName || formData.title, status: formData.status as any, description: formData.description || undefined, clientId: formData.clientId ? formData.clientId as Id<"clients"> : undefined, cantiereId: formData.cantiereId ? formData.cantiereId as Id<"cantieri"> : undefined, quoteId: formData.quoteId ? formData.quoteId as Id<"quotes"> : undefined }); setShowCreateDialog(false); toast.success("Documento caricato") } catch (e) { toast.error("Errore") }
  }

  const handleEdit = async () => {
    if (!editingDocId) return
    try { await updateDocument({ id: editingDocId, organizationId: orgId!, title: editFormData.title, description: editFormData.description || undefined, status: editFormData.status as any }); setShowEditDialog(false); toast.success("Documento aggiornato") } catch (e) { toast.error("Errore") }
  }

  const handleDelete = async (id: Id<"documents">) => {
    if (!confirm("Eliminare questo documento?")) return
    try { await deleteDocument({ id, organizationId: orgId! }); toast.success("Documento eliminato") } catch (e) { toast.error("Errore") }
  }

  const statusBadge = (status: string) => { const map: Record<string, { label: string; variant: "success" | "default" | "secondary" }> = { draft: { label: "Bozza", variant: "secondary" }, final: { label: "Finale", variant: "success" }, archived: { label: "Archiviato", variant: "default" } }; const { label, variant } = map[status] || { label: status, variant: "secondary" }; return <Badge variant={variant}>{label}</Badge> }
  const typeLabel = (type: string | undefined) => { const map: Record<string, string> = { contract: "Contratto", quote: "Preventivo", invoice: "Fattura", technical: "Tecnico", certificate: "Certificato", photo: "Foto", other: "Altro" }; return type ? (map[type] || type) : "-" }
  const formatFileSize = (bytes?: number) => { if (!bytes) return "-"; if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB` }

  if (!orgId || !documents || !stats) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Documenti</h1><p className="text-white/60 mt-1">{documents.length} documenti</p></div><Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Upload className="w-4 h-4 mr-2" /> Carica Documento</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FolderOpen className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Totali</span></div><p className="text-xl font-bold text-white">{stats.total}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Finali</span></div><p className="text-xl font-bold text-green-400">{stats.final}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-yellow-400" /><span className="text-sm text-white/60">Bozze</span></div><p className="text-xl font-bold text-yellow-400">{stats.draft}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-white/40" /><span className="text-sm text-white/60">Archiviati</span></div><p className="text-xl font-bold text-white/40">{stats.archived}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca documenti..." className="pl-10" /></div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti i tipi</option><option value="contract">Contratti</option><option value="quote">Preventivi</option><option value="invoice">Fatture</option><option value="technical">Tecnici</option><option value="certificate">Certificati</option><option value="photo">Foto</option></select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti gli stati</option><option value="draft">Bozza</option><option value="final">Finale</option><option value="archived">Archiviato</option></select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc._id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-kranely-accent/10 flex items-center justify-center"><FileText className="w-5 h-5 text-kranely-accent" /></div><div><p className="text-sm font-medium text-white">{doc.title}</p><p className="text-xs text-white/40">{formatFileSize(doc.fileSize)}</p></div></div>
              <div className="flex items-center gap-1"><button onClick={() => openDetail(doc)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button><button onClick={() => openEdit(doc)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(doc._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
            </div>
            <div className="flex items-center gap-2 mb-3"><Badge variant="secondary">{typeLabel(doc.type)}</Badge>{statusBadge(doc.status)}</div>
            {doc.description && <p className="text-xs text-white/60 mb-3">{doc.description}</p>}
            <div className="flex items-center gap-2 text-xs text-white/40">
              {doc.clientId && <Link href="/clients" className="text-kranely-accent hover:underline">Cliente</Link>}
              {doc.cantiereId && <Link href="/cantieri" className="text-kranely-accent hover:underline">Cantiere</Link>}
              {doc.quoteId && <Link href="/quotes" className="text-kranely-accent hover:underline">Preventivo</Link>}
            </div>
          </div>
        ))}
      </div>
      {documents.length === 0 && <div className="p-12 text-center text-white/40"><FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun documento</p></div>}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Carica Documento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Titolo *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>Tipo</Label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="contract">Contratto</option><option value="quote">Preventivo</option><option value="invoice">Fattura</option><option value="technical">Tecnico</option><option value="certificate">Certificato</option><option value="photo">Foto</option><option value="other">Altro</option></select></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="draft">Bozza</option><option value="final">Finale</option><option value="archived">Archiviato</option></select></div>
            <div><Label>Cliente</Label><select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{clients?.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}</select></div>
            <div><Label>Cantiere</Label><select value={formData.cantiereId} onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{cantieri?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div className="md:col-span-2"><Label>URL File</Label><Input value={formData.fileUrl} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} placeholder="/docs/file.pdf" /></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Carica</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Modifica Documento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Titolo</Label><Input value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="draft">Bozza</option><option value="final">Finale</option><option value="archived">Archiviato</option></select></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Textarea value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleEdit} className="bg-kranely-accent text-kranely-app-bg">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Dettaglio Documento</DialogTitle></DialogHeader>
          {selectedDoc && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="md:col-span-2"><span className="text-xs text-white/40">Titolo</span><p className="text-white font-medium">{selectedDoc.title}</p></div>
                <div><span className="text-xs text-white/40">Tipo</span><Badge variant="secondary">{typeLabel(selectedDoc.type)}</Badge></div>
                <div><span className="text-xs text-white/40">Stato</span>{statusBadge(selectedDoc.status)}</div>
                <div><span className="text-xs text-white/40">File</span><p className="text-white">{selectedDoc.fileName || "-"}</p></div>
                <div><span className="text-xs text-white/40">Dimensione</span><p className="text-white">{formatFileSize(selectedDoc.fileSize)}</p></div>
                {selectedDoc.clientId && <div><span className="text-xs text-white/40">Cliente</span><Link href="/clients" className="text-kranely-accent hover:underline">{clients?.find((c) => c._id === selectedDoc.clientId)?.fullName}</Link></div>}
                {selectedDoc.cantiereId && <div><span className="text-xs text-white/40">Cantiere</span><Link href="/cantieri" className="text-kranely-accent hover:underline">{cantieri?.find((c) => c._id === selectedDoc.cantiereId)?.name}</Link></div>}
              </div>
              {selectedDoc.description && <div><span className="text-xs text-white/40">Descrizione</span><p className="text-white/80 mt-1">{selectedDoc.description}</p></div>}
              {selectedDoc.fileUrl && <div className="pt-4"><Button onClick={() => window.open(selectedDoc.fileUrl, "_blank")} className="bg-kranely-accent text-kranely-app-bg"><Download className="w-4 h-4 mr-2" /> Apri File</Button></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
