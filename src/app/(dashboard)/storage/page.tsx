"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/input"
import { Search, HardDrive, FileText, Image, Folder, Upload, Trash2, Download, Eye, File } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function StoragePage() {
  const orgId = useOrgId()
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const DOC_TYPES = ["contract", "quote", "invoice", "technical", "certificate", "photo", "other"] as const
  type DocType = typeof DOC_TYPES[number]
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [formData, setFormData] = useState({ name: "", category: "documenti", url: "", description: "" })

  const documents = useQuery(api.documents.list, orgId ? { organizationId: orgId! } : "skip")

  const createDoc = useMutation(api.documents.create)
  const removeDoc = useMutation(api.documents.remove)

  const openUpload = () => { setFormData({ name: "", category: "documenti", url: "", description: "" }); setShowUploadDialog(true) }

  const handleUpload = async () => {
    if (!formData.name || !orgId) { toast.error("Inserisci un nome"); return }
    try { await createDoc({ organizationId: orgId!, title: formData.name, fileName: formData.name, type: DOC_TYPES.includes(formData.category as DocType) ? (formData.category as DocType) : "other", fileUrl: formData.url || "", description: formData.description || undefined }); setShowUploadDialog(false); toast.success("File caricato") } catch (e) { toast.error("Errore") }
  }

  const handleDelete = async (id: Id<"documents">) => {
    if (!confirm("Eliminare questo file?")) return
    try { await removeDoc({ id, organizationId: orgId! }); toast.success("File eliminato") } catch (e) { toast.error("Errore") }
  }

  const filtered = documents?.filter((d) => {
    if (filterCategory !== "all" && d.type !== filterCategory) return false
    if (search) { const s = search.toLowerCase(); return (d.fileName || d.title || "").toLowerCase().includes(s) || (d.description || "").toLowerCase().includes(s) }
    return true
  }) || []

  const totalSize = filtered.length * 2.5
  const categories = [
    { value: "all", label: "Tutti", count: documents?.length || 0 },
    { value: "documento", label: "Documenti", count: documents?.filter((d) => d.type === "documento").length || 0 },
    { value: "foto", label: "Foto", count: documents?.filter((d) => d.type === "foto").length || 0 },
    { value: "preventivo", label: "Preventivi", count: documents?.filter((d) => d.type === "preventivo").length || 0 },
    { value: "fattura", label: "Fatture", count: documents?.filter((d) => d.type === "fattura").length || 0 },
  ]

  const fileIcon = (type: string) => {
    if (type.includes("foto") || type.includes("image")) return <Image className="w-8 h-8 text-green-400" />
    if (type.includes("pdf")) return <FileText className="w-8 h-8 text-red-400" />
    return <File className="w-8 h-8 text-blue-400" />
  }

  if (!orgId || !documents) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Archivio</h1><p className="text-white/60 mt-1">Gestisci file e documenti archiviati</p></div><Button onClick={openUpload} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Upload className="w-4 h-4 mr-2" /> Carica File</Button></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><HardDrive className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">File Totali</span></div><p className="text-xl font-bold text-white">{documents.length}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">Dimensione Stimata</span></div><p className="text-xl font-bold text-blue-400">{totalSize.toFixed(1)} MB</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Image className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Foto</span></div><p className="text-xl font-bold text-green-400">{documents.filter((d) => d.type === "foto").length}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Folder className="w-4 h-4 text-purple-400" /><span className="text-sm text-white/60">Categorie</span></div><p className="text-xl font-bold text-purple-400">{categories.filter((c) => c.count > 0).length}</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca file..." className="pl-10" /></div>
        {categories.map((cat) => (
          <Button key={cat.value} size="sm" variant={filterCategory === cat.value ? "default" : "outline"} onClick={() => setFilterCategory(cat.value)} className={filterCategory === cat.value ? "bg-kranely-accent text-kranely-app-bg" : "border-white/10 text-white"}>{cat.label} ({cat.count})</Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <div key={doc._id} className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-center mb-4 p-4 rounded-lg bg-white/5">{fileIcon(doc.type || "other")}</div>
            <h3 className="font-medium text-white truncate mb-1">{doc.name}</h3>
            <p className="text-xs text-white/40 mb-3">{doc.type} - {new Date(doc._creationTime).toLocaleDateString("it-IT")}</p>
            {doc.description && <p className="text-sm text-white/60 mb-3 line-clamp-1">{doc.description}</p>}
            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
              <Button size="sm" variant="outline" className="flex-1 border-white/10 bg-white text-black hover:bg-white/90"><Eye className="w-3 h-3 mr-1" />Apri</Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-white text-black hover:bg-white/90" title="Scarica" aria-label="Scarica"><Download className="w-3 h-3" /></Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(doc._id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="p-12 text-center text-white/40"><HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun file archiviato</p></div>}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent><DialogHeader><DialogTitle>Carica File</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nome File *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Categoria</Label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="documento">Documento</option><option value="foto">Foto</option><option value="preventivo">Preventivo</option><option value="fattura">Fattura</option></select></div>
            <div><Label>URL</Label><Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Descrizione</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowUploadDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleUpload} className="bg-kranely-accent text-kranely-app-bg">Carica</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
