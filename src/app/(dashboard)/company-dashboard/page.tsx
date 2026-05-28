"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/input"
import { Plus, Search, Users, Building2, Mail, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function CompanyDashboardPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({ companyEmail: "", teamName: "", companyName: "", members: "" })

  const teams = useQuery(api.companyTeams.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const org = useQuery(api.organizations.get, orgId ? { id: orgId } : "skip")
  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const quotes = useQuery(api.quotes.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const collaborators = useQuery(api.collaborators.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")

  const createTeam = useMutation(api.companyTeams.create)
  const removeTeam = useMutation(api.companyTeams.remove)

  const openCreate = () => { setFormData({ companyEmail: "", teamName: "", companyName: "", members: "" }); setShowCreateDialog(true) }

  const handleCreate = async () => {
    if (!formData.teamName || !formData.companyEmail || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try {
      const membersArr = formData.members ? formData.members.split(",").map((m) => m.trim()).filter(Boolean) : []
      await createTeam({ organizationId: orgId, companyEmail: formData.companyEmail, teamName: formData.teamName, companyName: formData.companyName || undefined, members: membersArr })
      setShowCreateDialog(false); toast.success("Team creato")
    } catch (e) { toast.error("Errore") }
  }

  const handleDelete = async (id: Id<"companyTeams">) => {
    if (!confirm("Eliminare questo team?")) return
    try { await removeTeam({ id }); toast.success("Team eliminato") } catch (e) { toast.error("Errore") }
  }

  const filtered = teams?.filter((t) => { if (!search) return true; const s = search.toLowerCase(); return t.teamName.toLowerCase().includes(s) || (t.companyName || "").toLowerCase().includes(s) || t.companyEmail.toLowerCase().includes(s) }) || []

  if (!orgId || !teams || !org) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Dashboard Azienda</h1><p className="text-white/60 mt-1">Panoramica organizzazione e team</p></div><Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><UserPlus className="w-4 h-4 mr-2" /> Nuovo Team</Button></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Azienda</span></div><p className="text-lg font-bold text-white truncate">{org.name}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">Clienti</span></div><p className="text-xl font-bold text-blue-400">{clients?.length || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Cantieri</span></div><p className="text-xl font-bold text-green-400">{cantieri?.length || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Collaboratori</span></div><p className="text-xl font-bold text-kranely-accent">{collaborators?.length || 0}</p></div>
      </div>

      <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-white mb-4">Statistiche Preventivi</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-white/5"><span className="text-xs text-white/40">Totali</span><p className="text-lg font-bold text-white">{quotes?.length || 0}</p></div>
          <div className="p-3 rounded-lg bg-white/5"><span className="text-xs text-white/40">Inviati</span><p className="text-lg font-bold text-kranely-accent">{quotes?.filter((q) => q.status === "sent").length || 0}</p></div>
          <div className="p-3 rounded-lg bg-white/5"><span className="text-xs text-white/40">Accettati</span><p className="text-lg font-bold text-green-400">{quotes?.filter((q) => q.status === "accepted").length || 0}</p></div>
          <div className="p-3 rounded-lg bg-white/5"><span className="text-xs text-white/40">In Lavorazione</span><p className="text-lg font-bold text-blue-400">{quotes?.filter((q) => q.status === "in_lavorazione").length || 0}</p></div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca team..." className="pl-10" /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((team) => (
          <div key={team._id} className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{team.teamName}</h3>
                {team.companyName && <p className="text-sm text-white/60">{team.companyName}</p>}
              </div>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(team._id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center gap-1 text-sm text-white/40 mb-3"><Mail className="w-3 h-3" />{team.companyEmail}</div>
            {team.members && team.members.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <span className="text-xs text-white/40">Membri ({team.members.length})</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {team.members.slice(0, 5).map((m, i) => <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>)}
                  {team.members.length > 5 && <Badge variant="secondary" className="text-xs">+{team.members.length - 5}</Badge>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="p-12 text-center text-white/40"><Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun team aziendale</p></div>}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent><DialogHeader><DialogTitle>Nuovo Team</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nome Team *</Label><Input value={formData.teamName} onChange={(e) => setFormData({ ...formData, teamName: e.target.value })} /></div>
            <div><Label>Email Azienda *</Label><Input type="email" value={formData.companyEmail} onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })} /></div>
            <div><Label>Nome Azienda</Label><Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} /></div>
            <div><Label>Membri (separati da virgola)</Label><Input value={formData.members} onChange={(e) => setFormData({ ...formData, members: e.target.value })} placeholder="Mario Rossi, Luca Bianchi" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Crea Team</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
