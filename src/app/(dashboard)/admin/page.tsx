"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/input"
import { Plus, Search, Shield, User, Building2, Mail, Phone, Trash2, Ban, CheckCircle2, AlertTriangle, Edit2, Eye } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

const roleLabels: Record<string, string> = { superadmin: "Super Admin", admin: "Admin", supplier: "Fornitore", collaborator: "Collaboratore", client: "Cliente", driver: "Autista" }

export default function AdminPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(true)
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null)
  const [formData, setFormData] = useState({ email: "", fullName: "", role: "collaborator", companyRole: "", workSector: "", subrole: "" })
  const [editFormData, setEditFormData] = useState({ fullName: "", role: "collaborator" as string, subrole: "" as string, companyRole: "", workSector: "", blocked: false, phone: "" })

  const org = useQuery(api.organizations.get, orgId ? { id: orgId } : "skip")
  const users = useQuery(api.organizations.listUsers, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const selectedUser = useQuery(api.organizations.listUsers, orgId && selectedUserId ? { organizationId: orgId, userEmail: user?.email } : "skip")

  const createUser = useMutation(api.clients.createOrUpdateUser)
  const updateUser = useMutation(api.organizations.updateUser)
  const removeUser = useMutation(api.organizations.removeUser)

  const openCreate = () => { setFormData({ email: "", fullName: "", role: "collaborator", companyRole: "", workSector: "", subrole: "" }); setShowCreateDialog(true) }

  const openEdit = (u: any) => {
    setEditFormData({ fullName: u.fullName || "", role: u.role, subrole: u.subrole || "", companyRole: u.companyRole || "", workSector: u.workSector || "", blocked: u.blocked || false, phone: u.phone || "" })
    setEditingUserId(u._id)
    setShowEditDialog(true)
  }

  const openDetail = (u: any) => { setSelectedUserId(u._id); setShowDetailDialog(true) }

  const handleCreate = async () => {
    if (!formData.email || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try { await createUser({ email: formData.email, fullName: formData.fullName || undefined, role: formData.role as any, organizationId: orgId }); setShowCreateDialog(false); toast.success("Utente creato") } catch (e) { toast.error("Errore") }
  }

  const SUBROLE_LABELS: Record<string, string> = { serramenti: "Serramenti", edilizia: "Edilizia", generale: "Generale" }

  const handleEdit = async () => {
    if (!editingUserId) return
    try { await updateUser({ id: editingUserId, fullName: editFormData.fullName || undefined, role: editFormData.role as any, subrole: (editFormData.subrole || undefined) as any, companyRole: editFormData.companyRole || undefined, workSector: editFormData.workSector || undefined, phone: editFormData.phone || undefined, blocked: editFormData.blocked }); setShowEditDialog(false); toast.success("Utente aggiornato") } catch (e) { toast.error("Errore") }
  }

  const handleDelete = async (id: Id<"users">) => {
    if (!confirm("Eliminare questo utente?")) return
    try { await removeUser({ id }); toast.success("Utente eliminato") } catch (e) { toast.error("Errore") }
  }

  const filtered = users?.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false
    if (search) { const s = search.toLowerCase(); return u.email.toLowerCase().includes(s) || (u.fullName || "").toLowerCase().includes(s) }
    return true
  }) || []

  if (!orgId || !org) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Amministrazione</h1><p className="text-white/60 mt-1">Gestisci utenti e impostazioni organizzazione</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Piano</span></div><p className="text-lg font-bold text-kranely-accent capitalize">{org.plan}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Stato</span></div><Badge variant="success" className="mt-1 capitalize">{org.status}</Badge></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">Utenti</span></div><p className="text-xl font-bold text-blue-400">{users?.length || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-sm text-white/60">Bloccati</span></div><p className="text-xl font-bold text-red-400">{users?.filter((u) => u.blocked).length || 0}</p></div>
      </div>

      <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-white mb-4">Informazioni Organizzazione</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Nome</Label><p className="text-white mt-1">{org.name}</p></div>
          <div><Label>Slug</Label><p className="text-white mt-1">{org.slug}</p></div>
          <div><Label>Email Owner</Label><p className="text-white mt-1">{org.ownerEmail}</p></div>
          <div><Label>Creato il</Label><p className="text-white mt-1">{new Date(org._creationTime).toLocaleDateString("it-IT")}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca utenti..." className="pl-10" /></div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti i Ruoli</option><option value="superadmin">Super Admin</option><option value="admin">Admin</option><option value="supplier">Fornitore</option><option value="collaborator">Collaboratore</option><option value="client">Cliente</option></select>
        <Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" />Nuovo Utente</Button>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-3 text-xs font-semibold text-white/60 uppercase">Utente</th>
              <th className="text-left p-3 text-xs font-semibold text-white/60 uppercase">Ruolo</th>
              <th className="text-left p-3 text-xs font-semibold text-white/60 uppercase">Sotto-Ruolo</th>
              <th className="text-left p-3 text-xs font-semibold text-white/60 uppercase">Stato</th>
              <th className="text-left p-3 text-xs font-semibold text-white/60 uppercase">Azienda</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user._id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-kranely-accent/10 flex items-center justify-center"><span className="text-kranely-accent text-xs font-semibold">{user.email.charAt(0).toUpperCase()}</span></div>
                    <div><p className="text-sm text-white">{user.fullName || user.email}</p><p className="text-xs text-white/40">{user.email}</p></div>
                  </div>
                </td>
                <td className="p-3"><Badge variant="secondary">{roleLabels[user.role] || user.role}</Badge></td>
                <td className="p-3"><span className="text-sm text-white/60">{user.subrole ? (SUBROLE_LABELS[user.subrole] || user.subrole) : "-"}</span></td>
                <td className="p-3">{user.blocked ? <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" />Bloccato</Badge> : <Badge variant="success">Attivo</Badge>}</td>
                <td className="p-3 text-sm text-white/60">{user.companyRole || "-"}</td>
                <td className="p-3"><div className="flex items-center gap-1"><button onClick={() => openDetail(user)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button><button onClick={() => openEdit(user)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(user._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <div className="p-12 text-center text-white/40"><User className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun utente trovato</p></div>}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent><DialogHeader><DialogTitle>Nuovo Utente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>Nome Completo</Label><Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} /></div>
            <div><Label>Ruolo</Label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="superadmin">Super Admin</option><option value="admin">Admin</option><option value="supplier">Fornitore</option><option value="collaborator">Collaboratore</option><option value="client">Cliente</option><option value="driver">Autista</option></select></div>
            {formData.role === "supplier" && <div><Label>Sotto-Ruolo</Label><select value={formData.subrole} onChange={(e) => setFormData({ ...formData, subrole: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option><option value="serramenti">Serramenti</option><option value="edilizia">Edilizia</option><option value="generale">Generale</option></select></div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Crea</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent><DialogHeader><DialogTitle>Modifica Utente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nome Completo</Label><Input value={editFormData.fullName} onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })} /></div>
            <div><Label>Ruolo</Label><select value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="superadmin">Super Admin</option><option value="admin">Admin</option><option value="supplier">Fornitore</option><option value="collaborator">Collaboratore</option><option value="client">Cliente</option><option value="driver">Autista</option></select></div>
            {editFormData.role === "supplier" && <div><Label>Sotto-Ruolo</Label><select value={editFormData.subrole} onChange={(e) => setEditFormData({ ...editFormData, subrole: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option><option value="serramenti">Serramenti</option><option value="edilizia">Edilizia</option><option value="generale">Generale</option></select></div>}
            <div><Label>Telefono</Label><Input value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} /></div>
            <div><Label>Ruolo Aziendale</Label><Input value={editFormData.companyRole} onChange={(e) => setEditFormData({ ...editFormData, companyRole: e.target.value })} /></div>
            <div><Label>Settore</Label><Input value={editFormData.workSector} onChange={(e) => setEditFormData({ ...editFormData, workSector: e.target.value })} /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editFormData.blocked} onChange={(e) => setEditFormData({ ...editFormData, blocked: e.target.checked })} className="w-4 h-4" /><Label>Bloccato</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleEdit} className="bg-kranely-accent text-kranely-app-bg">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Dettaglio Utente</DialogTitle></DialogHeader>
          {selectedUser && (() => {
            const u = users?.find((u) => u._id === selectedUserId)
            if (!u) return null
            return (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-xs text-white/40">Email</span><p className="text-white">{u.email}</p></div>
                  <div><span className="text-xs text-white/40">Nome</span><p className="text-white">{u.fullName || "-"}</p></div>
                  <div><span className="text-xs text-white/40">Ruolo</span><Badge variant="secondary">{roleLabels[u.role] || u.role}</Badge></div>
                  <div><span className="text-xs text-white/40">Sotto-Ruolo</span><p className="text-white">{u.subrole ? (SUBROLE_LABELS[u.subrole] || u.subrole) : "-"}</p></div>
                  <div><span className="text-xs text-white/40">Telefono</span><p className="text-white">{u.phone || "-"}</p></div>
                  <div><span className="text-xs text-white/40">Stato</span>{u.blocked ? <Badge variant="destructive">Bloccato</Badge> : <Badge variant="success">Attivo</Badge>}</div>
                  {u.companyRole && <div><span className="text-xs text-white/40">Ruolo Aziendale</span><p className="text-white">{u.companyRole}</p></div>}
                  {u.workSector && <div><span className="text-xs text-white/40">Settore</span><p className="text-white">{u.workSector}</p></div>}
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
