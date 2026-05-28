"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/input"
import { Plus, Calendar, Clock, MapPin, Mail, Search, CheckCircle2, XCircle, Eye, Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

const statusConfig = {
  scheduled: { label: "Fissato", variant: "default" as const, color: "text-kranely-accent" },
  completed: { label: "Completato", variant: "success" as const, color: "text-green-400" },
  cancelled: { label: "Annullato", variant: "destructive" as const, color: "text-red-400" },
  no_show: { label: "No Show", variant: "secondary" as const, color: "text-white/40" },
}

export default function MyAppointmentsPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"list" | "day" | "week" | "month">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Id<"appointments"> | null>(null)
  const [selectedApptId, setSelectedApptId] = useState<Id<"appointments"> | null>(null)
  const [editFormData, setEditFormData] = useState({ title: "", appointmentDate: "", appointmentTime: "", location: "", description: "" })
  const [formData, setFormData] = useState({ title: "", email: "", appointmentDate: "", appointmentTime: "", location: "", description: "", clientId: "", cantiereId: "" })

  const appointments = useQuery(api.appointments.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const stats = useQuery(api.appointments.stats, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")

  const createAppt = useMutation(api.appointments.create)
  const updateAppt = useMutation(api.appointments.update)
  const deleteAppt = useMutation(api.appointments.remove)

  const openCreate = () => { setFormData({ title: "", email: "", appointmentDate: "", appointmentTime: "", location: "", description: "", clientId: "", cantiereId: "" }); setShowCreateDialog(true) }
  const openEdit = (a: any) => { setEditFormData({ title: a.title, appointmentDate: a.appointmentDate, appointmentTime: a.appointmentTime || "", location: a.location || "", description: a.description || "" }); setEditingAppointment(a._id); setShowEditDialog(true) }
  const openDetail = (a: any) => { setSelectedApptId(a._id); setShowDetailDialog(true) }
  const selectedAppointment = useQuery(api.appointments.get, selectedApptId ? { id: selectedApptId, organizationId: orgId! } : "skip")

  const handleCreate = async () => {
    if (!formData.title || !formData.email || !formData.appointmentDate || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try { await createAppt({ organizationId: orgId!, title: formData.title, email: formData.email, appointmentDate: formData.appointmentDate, appointmentTime: formData.appointmentTime || undefined, location: formData.location || undefined, description: formData.description || undefined, clientId: formData.clientId ? formData.clientId as Id<"clients"> : undefined, cantiereId: formData.cantiereId ? formData.cantiereId as Id<"cantieri"> : undefined }); setShowCreateDialog(false); toast.success("Appuntamento creato") } catch (e) { toast.error("Errore") }
  }

  const updateStatus = async (id: Id<"appointments">, status: "scheduled" | "completed" | "cancelled" | "no_show") => {
    try { await updateAppt({ id, organizationId: orgId!, status }); toast.success("Stato aggiornato") } catch (e) { toast.error("Errore") }
  }

  const handleEditSubmit = async () => {
    if (!editingAppointment) return
    try { await updateAppt({ id: editingAppointment, organizationId: orgId!, title: editFormData.title, appointmentDate: editFormData.appointmentDate, appointmentTime: editFormData.appointmentTime || undefined, location: editFormData.location || undefined, description: editFormData.description || undefined }); setShowEditDialog(false); toast.success("Appuntamento aggiornato") } catch (e) { toast.error("Errore") }
  }

  const handleDelete = async (id: Id<"appointments">) => {
    if (!confirm("Eliminare questo appuntamento?")) return
    try { await deleteAppt({ id, organizationId: orgId! }); toast.success("Appuntamento eliminato") } catch (e) { toast.error("Errore") }
  }

  const getClientName = (id: string) => clients?.find((c) => c._id === id)?.fullName
  const getCantiereName = (id: string) => cantieri?.find((c) => c._id === id)?.name

  const today = new Date().toISOString().split("T")[0]

  const filtered = appointments?.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false
    if (search) { const s = search.toLowerCase(); return a.title.toLowerCase().includes(s) || a.email.toLowerCase().includes(s) || (a.location || "").toLowerCase().includes(s) }
    return true
  }) || []

  const todayAppts = filtered.filter((a) => a.appointmentDate === today && a.status === "scheduled")
  const upcomingAppts = filtered.filter((a) => a.appointmentDate > today && a.status === "scheduled")

  if (!orgId || !appointments) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">I Miei Appuntamenti</h1><p className="text-white/60 mt-1">Gestisci i tuoi appuntamenti</p></div><Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo Appuntamento</Button></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Oggi</span></div><p className="text-xl font-bold text-kranely-accent">{stats?.today || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">In Arrivo</span></div><p className="text-xl font-bold text-blue-400">{stats?.upcoming || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Completati</span></div><p className="text-xl font-bold text-green-400">{stats?.completed || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-1"><XCircle className="w-4 h-4 text-red-400" /><span className="text-sm text-white/60">Annullati</span></div><p className="text-xl font-bold text-red-400">{stats?.cancelled || 0}</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca appuntamenti..." className="pl-10" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti</option><option value="scheduled">Fissati</option><option value="completed">Completati</option><option value="cancelled">Annullati</option></select>
      </div>

      {todayAppts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-kranely-accent" /> Oggi</h2>
          <div className="space-y-3">
            {todayAppts.map((appt) => <AppointmentCard key={appt._id} appt={appt} statusConfig={statusConfig} updateStatus={updateStatus} getClientName={getClientName} getCantiereName={getCantiereName} openEdit={openEdit} openDetail={openDetail} handleDelete={handleDelete} />)}
          </div>
        </div>
      )}

      {upcomingAppts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> Prossimi</h2>
          <div className="space-y-3">
            {upcomingAppts.map((appt) => <AppointmentCard key={appt._id} appt={appt} statusConfig={statusConfig} updateStatus={updateStatus} getClientName={getClientName} getCantiereName={getCantiereName} openEdit={openEdit} openDetail={openDetail} handleDelete={handleDelete} />)}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white mb-3">Tutti gli Appuntamenti</h2>
        {filtered.filter((a) => a.status !== "scheduled" || a.appointmentDate <= today).map((appt) => <AppointmentCard key={appt._id} appt={appt} statusConfig={statusConfig} updateStatus={updateStatus} getClientName={getClientName} getCantiereName={getCantiereName} openEdit={openEdit} openDetail={openDetail} handleDelete={handleDelete} />)}
      </div>

      {filtered.length === 0 && <div className="p-12 text-center text-white/40"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun appuntamento</p></div>}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent><DialogHeader><DialogTitle>Nuovo Appuntamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Titolo *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data *</Label><Input type="date" value={formData.appointmentDate} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })} /></div>
              <div><Label>Ora</Label><Input type="time" value={formData.appointmentTime} onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })} /></div>
            </div>
            <div><Label>Luogo</Label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
            <div><Label>Cliente</Label><select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{clients?.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}</select></div>
            <div><Label>Cantiere</Label><select value={formData.cantiereId} onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{cantieri?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div><Label>Note</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Crea</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent><DialogHeader><DialogTitle>Modifica Appuntamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Titolo</Label><Input value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data</Label><Input type="date" value={editFormData.appointmentDate} onChange={(e) => setEditFormData({ ...editFormData, appointmentDate: e.target.value })} /></div>
              <div><Label>Ora</Label><Input type="time" value={editFormData.appointmentTime} onChange={(e) => setEditFormData({ ...editFormData, appointmentTime: e.target.value })} /></div>
            </div>
            <div><Label>Luogo</Label><Input value={editFormData.location} onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} /></div>
            <div><Label>Note</Label><Input value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleEditSubmit} className="bg-kranely-accent text-kranely-app-bg">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Dettaglio Appuntamento</DialogTitle></DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-white/40">Titolo</span><p className="text-white font-medium">{selectedAppointment.title}</p></div>
                <div><span className="text-xs text-white/40">Stato</span><Badge variant={(statusConfig[selectedAppointment.status as keyof typeof statusConfig] || statusConfig.scheduled).variant}>{(statusConfig[selectedAppointment.status as keyof typeof statusConfig] || statusConfig.scheduled).label}</Badge></div>
                <div><span className="text-xs text-white/40">Data</span><p className="text-white">{selectedAppointment.appointmentDate}</p></div>
                {selectedAppointment.appointmentTime && <div><span className="text-xs text-white/40">Ora</span><p className="text-white">{selectedAppointment.appointmentTime}</p></div>}
                {selectedAppointment.location && <div><span className="text-xs text-white/40">Luogo</span><p className="text-white">{selectedAppointment.location}</p></div>}
                <div><span className="text-xs text-white/40">Email</span><p className="text-white">{selectedAppointment.email}</p></div>
                {selectedAppointment.clientId && <div><span className="text-xs text-white/40">Cliente</span><Link href="/clients" className="text-kranely-accent hover:underline">{getClientName(selectedAppointment.clientId)}</Link></div>}
                {selectedAppointment.cantiereId && <div><span className="text-xs text-white/40">Cantiere</span><Link href="/cantieri" className="text-kranely-accent hover:underline">{getCantiereName(selectedAppointment.cantiereId)}</Link></div>}
              </div>
              {selectedAppointment.description && <div><span className="text-xs text-white/40">Descrizione</span><p className="text-white/80 mt-1">{selectedAppointment.description}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AppointmentCard({ appt, statusConfig, updateStatus, getClientName, getCantiereName, openEdit, openDetail, handleDelete }: { appt: any; statusConfig: any; updateStatus: any; getClientName: any; getCantiereName: any; openEdit: any; openDetail: any; handleDelete: any }) {
  const cfg = statusConfig[appt.status as keyof typeof statusConfig] || statusConfig.scheduled
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1"><h3 className="font-medium text-white">{appt.title}</h3><Badge variant={cfg.variant}>{cfg.label}</Badge></div>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/60 flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-kranely-accent" />{appt.appointmentDate}</span>
            {appt.appointmentTime && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{appt.appointmentTime}</span>}
            {appt.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{appt.location}</span>}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-white/40 flex-wrap">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{appt.email}</span>
            {appt.clientId && <span>Cliente: <Link href="/clients" className="text-kranely-accent hover:underline">{getClientName(appt.clientId)}</Link></span>}
            {appt.cantiereId && <span>Cantiere: <Link href="/cantieri" className="text-kranely-accent hover:underline">{getCantiereName(appt.cantiereId)}</Link></span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(appt)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openEdit(appt)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(appt._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
        {appt.status === "scheduled" && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => updateStatus(appt._id, "completed")} className="bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckCircle2 className="w-4 h-4 mr-1" />Completa</Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus(appt._id, "cancelled")} className="border-red-500/20 text-red-400 hover:bg-red-500/10"><XCircle className="w-4 h-4 mr-1" />Annulla</Button>
          </div>
        )}
      </div>
    </div>
  )
}
