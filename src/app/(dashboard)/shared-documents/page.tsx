"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/input"
import { Search, FileText, Folder, Download, Eye, Trash2, Upload, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { safeWindowOpen } from "@/lib/utils"

export default function SharedDocumentsPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [formData, setFormData] = useState({ name: "", type: "contract", url: "", entityType: "", entityId: "", description: "" })

  const documents = useQuery(api.documents.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")

  const createDoc = useMutation(api.documents.create)
  const removeDoc = useMutation(api.documents.remove)

  const openUpload = () => { setFormData({ name: "", type: "contract", url: "", entityType: "", entityId: "", description: "" }); setShowUploadDialog(true) }

  const handleUpload = async () => {
    if (!formData.name || !orgId) { toast.error("Inserisci un nome"); return }
    try { await createDoc({ organizationId: orgId!, title: formData.name, fileName: formData.name, type: formData.type as any, fileUrl: formData.url || "", description: formData.description || undefined, userEmail: user?.email }); setShowUploadDialog(false); toast.success("Documento aggiunto") } catch (e) { toast.error("Errore") }
  }

  const handleDelete = async (id: Id<"documents">) => {
    if (!confirm("Eliminare questo documento?")) return
    try { await removeDoc({ id, organizationId: orgId!, userEmail: user?.email }); toast.success("Documento eliminato") } catch (e) { toast.error("Errore") }
  }

  const filtered = documents?.filter((d) => {
    if (filterType !== "all" && d.type !== filterType) return false
    if (search) { const s = search.toLowerCase(); return (d.fileName || d.title || "").toLowerCase().includes(s) || (d.description || "").toLowerCase().includes(s) }
    return true
  }) || []

  const typeIcon = (type: string) => {
    if (type?.includes("pdf")) return <FileText className="w-5 h-5 text-red-400" />
    if (type?.includes("image") || type?.includes("photo") || type?.includes("foto")) return <Eye className="w-5 h-5 text-green-400" />
    return <FileText className="w-5 h-5 text-blue-400" />
  }

  const getEntityName = (doc: any) => {
    if (doc.entityType === "client" && doc.entityId) return clients?.find((c) => c._id === doc.entityId)?.fullName
    if (doc.entityType === "cantiere" && doc.entityId) return cantieri?.find((c) => c._id === doc.entityId)?.name
    return null
  }

  if (!orgId || !documents) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Documenti Condivisi</h1><p className="text-white/60 mt-1">Gestisci documenti condivisi con clienti e fornitori</p></div><Button onClick={openUpload} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Upload className="w-4 h-4 mr-2" /> Carica Documento</Button></div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca documenti..." className="pl-10" /></div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti i Tipi</option><option value="contract">Contratti</option><option value="quote">Preventivi</option><option value="invoice">Fatture</option><option value="technical">Tecnici</option><option value="certificate">Certificati</option><option value="photo">Foto</option><option value="other">Altri</option></select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => {
          const entityName = getEntityName(doc)
          return (
            <div key={doc._id} className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">{typeIcon(doc.type || "other")}</div>
                <div className="min-w-0">
                  <h3 className="font-medium text-white truncate">{doc.fileName || doc.title || doc.name || "Senza nome"}</h3>
                  <p className="text-xs text-white/40">{doc.type} - {new Date(doc._creationTime).toLocaleDateString("it-IT")}</p>
                </div>
              </div>
              {doc.description && <p className="text-sm text-white/60 mb-3 line-clamp-2">{doc.description}</p>}
              <div className="space-y-2 text-xs text-white/40 mb-3">
                {doc.entityType && <div className="flex items-center gap-1"><LinkIcon className="w-3 h-3" />{doc.entityType}: {entityName || doc.entityId}</div>}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <Button size="sm" variant="outline" className="flex-1 border-white/10 bg-white text-black hover:bg-white/90" onClick={() => safeWindowOpen(doc.fileUrl)}><Eye className="w-3 h-3 mr-1" />Visualizza</Button>
                <Button size="sm" variant="outline" className="border-white/10 bg-white text-black hover:bg-white/90" title="Scarica" aria-label="Scarica" onClick={() => safeWindowOpen(doc.fileUrl)}><Download className="w-3 h-3" /></Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(doc._id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && <div className="p-12 text-center text-white/40"><Folder className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun documento condiviso</p></div>}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent><DialogHeader><DialogTitle>Carica Documento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nome *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Tipo</Label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="contract">Contratto</option><option value="quote">Preventivo</option><option value="invoice">Fattura</option><option value="technical">Tecnico</option><option value="certificate">Certificato</option><option value="photo">Foto</option><option value="other">Altro</option></select></div>
            <div><Label>URL</Label><Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Entita Collegata</Label><select value={formData.entityType} onChange={(e) => setFormData({ ...formData, entityType: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuna</option><option value="client">Cliente</option><option value="cantiere">Cantiere</option><option value="quote">Preventivo</option><option value="supplier">Fornitore</option></select></div>
            <div><Label>Descrizione</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowUploadDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleUpload} className="bg-kranely-accent text-kranely-app-bg">Carica</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
