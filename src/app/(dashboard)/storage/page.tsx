"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@radix-ui/react-label"
import { Search, HardDrive, FileText, Image, Folder, Upload, Trash2, Download, Eye, File, Loader2, Building2, Users, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { safeWindowOpen } from "@/lib/utils"

export default function StoragePage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const DOC_TYPES = ["contract", "quote", "invoice", "technical", "certificate", "photo", "other"] as const
  type DocType = typeof DOC_TYPES[number]
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [formData, setFormData] = useState({ name: "", category: "contract", description: "", clientId: "", cantiereId: "", quoteId: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const documents = useQuery(api.documents.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const quotes = useQuery(api.quotes.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const removeDoc = useMutation(api.documents.remove)
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)
  const saveFile = useMutation(api.upload.saveFile)

  const openUpload = () => {
    setFormData({ name: "", category: "contract", description: "", clientId: "", cantiereId: "", quoteId: "" })
    setSelectedFile(null)
    setShowUploadDialog(true)
  }

  const handleUpload = async () => {
    if (!formData.name || !orgId) { toast.error("Inserisci un nome"); return }
    if (!selectedFile) { toast.error("Seleziona un file"); return }
    setUploading(true)
    try {
      const uploadUrl = await generateUploadUrl({ organizationId: orgId, userEmail: user?.email || "" })
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      })
      if (!result.ok) throw new Error("Upload fallito")
      const { storageId } = await result.json()
      const docType = DOC_TYPES.includes(formData.category as DocType) ? (formData.category as DocType) : "other"
      await saveFile({
        organizationId: orgId,
        storageId,
        fileName: formData.name,
        type: docType,
        fileSize: selectedFile.size,
        description: formData.description || undefined,
        clientId: formData.clientId ? formData.clientId as Id<"clients"> : undefined,
        cantiereId: formData.cantiereId ? formData.cantiereId as Id<"cantieri"> : undefined,
        quoteId: formData.quoteId ? formData.quoteId as Id<"quotes"> : undefined,
        userEmail: user?.email,
      })
      setShowUploadDialog(false)
      toast.success("File caricato")
    } catch (err: any) {
      toast.error(err.message || "Errore upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: Id<"documents">) => {
    if (!confirm("Eliminare questo file?")) return
    try { await removeDoc({ id, organizationId: orgId!, userEmail: user?.email }); toast.success("File eliminato") } catch (e) { toast.error("Errore") }
  }

  const filtered = documents?.filter((d) => {
    if (filterCategory !== "all" && d.type !== filterCategory) return false
    if (search) { const s = search.toLowerCase(); return (d.fileName || d.title || "").toLowerCase().includes(s) || (d.description || "").toLowerCase().includes(s) }
    return true
  }) || []

  const totalBytes = documents?.reduce((sum, d) => sum + (d.fileSize || 0), 0) || 0
  const totalSize = totalBytes > 0 ? (totalBytes / (1024 * 1024)) : 0
  const categories = [
    { value: "all", label: "Tutti", count: documents?.length || 0 },
    { value: "contract", label: "Contratti", count: documents?.filter((d) => d.type === "contract").length || 0 },
    { value: "quote", label: "Preventivi", count: documents?.filter((d) => d.type === "quote" || d.type === "preventivo").length || 0 },
    { value: "invoice", label: "Fatture", count: documents?.filter((d) => d.type === "invoice" || d.type === "fattura").length || 0 },
    { value: "technical", label: "Tecnici", count: documents?.filter((d) => d.type === "technical").length || 0 },
    { value: "certificate", label: "Certificati", count: documents?.filter((d) => d.type === "certificate").length || 0 },
    { value: "photo", label: "Foto", count: documents?.filter((d) => d.type === "photo" || d.type === "foto").length || 0 },
    { value: "other", label: "Altri", count: documents?.filter((d) => d.type === "other" || d.type === "altro" || d.type === "documento").length || 0 },
  ]

  const fileIcon = (type: string) => {
    if (type.includes("photo") || type.includes("foto") || type.includes("image")) return <Image className="w-8 h-8 text-green-400" />
    if (type.includes("pdf")) return <FileText className="w-8 h-8 text-red-400" />
    return <File className="w-8 h-8 text-blue-400" />
  }

  if (!orgId || !documents) return <PageSkeleton />

  const isPwa = user?.role === "admin" || user?.role === "superadmin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Archivio</h1><p className="text-white/60 mt-1">Gestisci file e documenti archiviati</p></div>{isPwa && <Button onClick={openUpload} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Upload className="w-4 h-4 mr-2" /> Carica File</Button>}</div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><HardDrive className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">File Totali</span></div><p className="text-xl font-bold text-white">{documents.length}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">Dimensione Totale</span></div><p className="text-xl font-bold text-blue-400">{totalSize.toFixed(1)} MB</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Image className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Foto</span></div><p className="text-xl font-bold text-green-400">{documents.filter((d) => d.type === "photo" || d.type === "foto").length}</p></div>
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
            <h3 className="font-medium text-white truncate mb-1">{doc.fileName || doc.title || "Senza nome"}</h3>
            <p className="text-xs text-white/40 mb-3">{doc.type} - {new Date(doc._creationTime).toLocaleDateString("it-IT")}{doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)} KB` : ""}</p>
            {doc.description && <p className="text-sm text-white/60 mb-3 line-clamp-1">{doc.description}</p>}
            <div className="flex flex-wrap gap-1 mb-3">
              {doc.clientId && <Badge variant="secondary" className="text-xs"><Users className="w-3 h-3 mr-1" />Cliente</Badge>}
              {doc.cantiereId && <Badge variant="secondary" className="text-xs"><Building2 className="w-3 h-3 mr-1" />Cantiere</Badge>}
              {doc.quoteId && <Badge variant="secondary" className="text-xs"><FileSpreadsheet className="w-3 h-3 mr-1" />Preventivo</Badge>}
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
              <Button size="sm" variant="outline" className="flex-1 border-white/10 bg-white text-black hover:bg-white/90" onClick={() => safeWindowOpen(doc.fileUrl)}><Eye className="w-3 h-3 mr-1" />Apri</Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-white text-black hover:bg-white/90" title="Scarica" aria-label="Scarica" onClick={() => safeWindowOpen(doc.fileUrl)}><Download className="w-3 h-3" /></Button>
{isPwa && <Button size="sm" variant="destructive" onClick={() => handleDelete(doc._id)}><Trash2 className="w-3 h-3" /></Button>}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="p-12 text-center text-white/40"><HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun file archiviato</p></div>}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Carica File</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label className="text-sm font-medium text-white/80">Nome File *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="nome-file.pdf" /></div>
            <div><Label className="text-sm font-medium text-white/80">Categoria</Label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="contract">Contratto</option><option value="quote">Preventivo</option><option value="invoice">Fattura</option><option value="technical">Tecnico</option><option value="certificate">Certificato</option><option value="photo">Foto</option><option value="other">Altro</option></select></div>
            <div><Label className="text-sm font-medium text-white/80">Collegato a</Label>
              <select value={formData.quoteId} onChange={(e) => setFormData({ ...formData, quoteId: e.target.value, clientId: "", cantiereId: "" })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="">Nessuno</option>
                <optgroup label="━━ Preventivi ━━">
                  {quotes?.filter((q) => q.title).map((q) => <option key={q._id} value={q._id}>📄 {q.title}</option>)}
                </optgroup>
              </select>
            </div>
            <div><Label className="text-sm font-medium text-white/80">Cliente</Label>
              <select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value, quoteId: "" })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="">Nessuno</option>
                {clients?.map((c) => <option key={c._id} value={c._id}>👤 {c.fullName}</option>)}
              </select>
            </div>
            <div><Label className="text-sm font-medium text-white/80">Cantiere</Label>
              <select value={formData.cantiereId} onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="">Nessuno</option>
                {cantieri?.map((c) => <option key={c._id} value={c._id}>🏗️ {c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><Label className="text-sm font-medium text-white/80">File *</Label>
              <input ref={fileInputRef} type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-kranely-accent file:text-kranely-app-bg hover:file:bg-kranely-accent/90" />
              {selectedFile && <p className="text-xs text-white/40 mt-1">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</p>}
            </div>
            <div className="md:col-span-2"><Label className="text-sm font-medium text-white/80">Descrizione</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleUpload} disabled={uploading} className="bg-kranely-accent text-kranely-app-bg">
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Caricamento...</> : "Carica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
