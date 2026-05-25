"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/input"
import { Plus, Search, Tag, TrendingUp, Users, Copy, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function ReferralPage() {
  const orgId = useOrgId()
  const [search, setSearch] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({ code: "", discountPercent: "10", description: "", maxUses: "" })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const codes = useQuery(api.referral.list, orgId ? { organizationId: orgId } : "skip")
  const stats = useQuery(api.referral.stats, orgId ? { organizationId: orgId } : "skip")

  const createCode = useMutation(api.referral.create)
  const updateCode = useMutation(api.referral.update)
  const removeCode = useMutation(api.referral.remove)

  const openCreate = () => { setFormData({ code: "", discountPercent: "10", description: "", maxUses: "" }); setShowCreateDialog(true) }

  const handleCreate = async () => {
    if (!formData.code || !orgId) { toast.error("Inserisci un codice"); return }
    try { await createCode({ organizationId: orgId, code: formData.code, discountPercent: parseInt(formData.discountPercent), description: formData.description || undefined, maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined }); setShowCreateDialog(false); toast.success("Codice creato") } catch (e) { toast.error("Errore") }
  }

  const toggleActive = async (id: Id<"referralCodes">, current: boolean) => {
    try { await updateCode({ id, isActive: !current }); toast.success("Stato aggiornato") } catch (e) { toast.error("Errore") }
  }

  const handleDelete = async (id: Id<"referralCodes">) => {
    if (!confirm("Eliminare questo codice?")) return
    try { await removeCode({ id }); toast.success("Codice eliminato") } catch (e) { toast.error("Errore") }
  }

  const copyCode = (code: string, id: string) => { navigator.clipboard.writeText(code); setCopiedId(id); toast.success("Codice copiato"); setTimeout(() => setCopiedId(null), 2000) }

  const filtered = codes?.filter((c) => { if (!search) return true; const s = search.toLowerCase(); return c.code.toLowerCase().includes(s) || (c.description || "").toLowerCase().includes(s) }) || []

  if (!orgId || !codes) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Referral</h1><p className="text-white/60 mt-1">Codici sconto e programma referral</p></div><Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo Codice</Button></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Tag className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Codici Totali</span></div><p className="text-xl font-bold text-white">{stats?.total || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Attivi</span></div><p className="text-xl font-bold text-green-400">{stats?.active || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">Utilizzi Totali</span></div><p className="text-xl font-bold text-blue-400">{stats?.totalUses || 0}</p></div>
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca codici..." className="pl-10" /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((code) => (
          <div key={code._id} className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-kranely-accent" /><code className="text-lg font-mono font-bold text-white">{code.code}</code></div>
              <Badge variant={code.isActive ? "success" : "secondary"}>{code.isActive ? "Attivo" : "Disattivato"}</Badge>
            </div>
            {code.description && <p className="text-sm text-white/60 mb-3">{code.description}</p>}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-white/40">Sconto</span><span className="text-kranely-accent font-semibold">{code.discountPercent}%</span></div>
              <div className="flex items-center justify-between"><span className="text-white/40">Utilizzi</span><span className="text-white">{code.usesCount || 0}{code.maxUses ? ` / ${code.maxUses}` : ""}</span></div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
              <Button size="sm" variant="outline" onClick={() => copyCode(code.code, code._id)} className="flex-1 border-white/10">{copiedId === code._id ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}{copiedId === code._id ? "Copiato" : "Copia"}</Button>
              <Button size="sm" variant="outline" onClick={() => toggleActive(code._id, code.isActive || false)} className="border-white/10">{code.isActive ? "Disattiva" : "Attiva"}</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(code._id)}>Elimina</Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="p-12 text-center text-white/40"><Tag className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun codice referral</p></div>}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent><DialogHeader><DialogTitle>Nuovo Codice Referral</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Codice *</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="SCONTO2026" /></div>
            <div><Label>Sconto (%)</Label><Input type="number" value={formData.discountPercent} onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })} /></div>
            <div><Label>Descrizione</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Label>Utilizzi Massimi</Label><Input type="number" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })} placeholder="Illimitato" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Crea Codice</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
