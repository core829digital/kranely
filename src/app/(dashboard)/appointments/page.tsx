"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Plus, Search, Eye, Edit2, Trash2, Calendar, Clock, MapPin, Users, Building2, LayoutGrid, List } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { CalendarView } from "@/components/CalendarView"
import { cn } from "@/lib/utils"

export default function AppointmentsPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"list" | "day" | "week" | "month">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<Id<"appointments"> | null>(null)
  const [formData, setFormData] = useState({ title: "", email: "", date: "", time: "", duration: "60", cantiereId: "", clientId: "", description: "", location: "", appointmentDate: "", appointmentTime: "", type: "sopralluogo" as "sopralluogo" | "riunione" | "colloquio" | "altro", status: "scheduled", notes: "" })
  const statusMap: Record<string, "scheduled" | "confirmed" | "completed" | "cancelled"> = { scheduled: "scheduled", confirmed: "confirmed", completed: "completed", cancelled: "cancelled" }

  const openCreate = () => { setFormData({ title: "", email: "", date: "", time: "", duration: "60", cantiereId: "", clientId: "", description: "", location: "", appointmentDate: "", appointmentTime: "", type: "sopralluogo", status: "scheduled", notes: "" }); setShowCreateDialog(true) }
  const openEdit = (apt: any) => { setFormData({ title: apt.title || "", email: apt.email || "", date: apt.appointmentDate || "", time: apt.appointmentTime || "", duration: "60", cantiereId: apt.cantiereId || "", clientId: apt.clientId || "", description: apt.description || "", location: apt.location || "", appointmentDate: apt.appointmentDate || "", appointmentTime: apt.appointmentTime || "", type: "sopralluogo", status: apt.status || "scheduled", notes: apt.notes || "" }); setEditingId(apt._id); setShowEditDialog(true) }
  const openDetail = (apt: any) => { setSelectedAppointmentId(apt._id); setShowDetailDialog(true) }

  const appointments = useQuery(api.appointments.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const stats = useQuery(api.appointments.stats, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId!, userEmail: user?.email } : "skip")
  const createAppointment = useMutation(api.appointments.create)
  const updateAppointment = useMutation(api.appointments.update)
  const deleteAppointment = useMutation(api.appointments.remove)
  const [editingId, setEditingId] = useState<Id<"appointments"> | null>(null)
  const selectedAppointment = useQuery(api.appointments.get, selectedAppointmentId ? { id: selectedAppointmentId, organizationId: orgId! } : "skip")

  const handleCreate = async () => { if (!formData.title || !formData.appointmentDate || !orgId) { toast.error("Compila i campi obbligatori"); return } try { await createAppointment({ organizationId: orgId!, title: formData.title, email: user?.email ?? "", appointmentDate: formData.appointmentDate, appointmentTime: formData.appointmentTime || undefined, location: formData.location || undefined, description: formData.description || undefined, status: statusMap[formData.status], clientId: formData.clientId ? formData.clientId as Id<"clients"> : undefined, cantiereId: formData.cantiereId ? formData.cantiereId as Id<"cantieri"> : undefined, userEmail: user?.email }); setShowCreateDialog(false); toast.success("Appuntamento fissato") } catch (e) { toast.error("Errore") } }
  const handleUpdate = async () => { if (!editingId) return; try { await updateAppointment({ id: editingId, organizationId: orgId!, title: formData.title, appointmentDate: formData.appointmentDate, appointmentTime: formData.appointmentTime || undefined, location: formData.location || undefined, description: formData.description || undefined, status: statusMap[formData.status], userEmail: user?.email }); setShowEditDialog(false); toast.success("Appuntamento aggiornato") } catch (e) { toast.error("Errore") } }
  const handleDelete = async (id: Id<"appointments">) => {
    if (!confirm("Eliminare questo appuntamento?")) return
    try { await deleteAppointment({ id, organizationId: orgId!, userEmail: user?.email }); toast.success("Appuntamento eliminato") } catch (e) { toast.error("Errore") }
  }

  const statusBadge = (status: string) => { const map: Record<string, { label: string; variant: "success" | "default" | "secondary" | "destructive" | "warning" }> = { scheduled: { label: "Fissato", variant: "default" }, confirmed: { label: "Confermato", variant: "warning" }, completed: { label: "Completato", variant: "success" }, cancelled: { label: "Annullato", variant: "destructive" }, no_show: { label: "No Show", variant: "secondary" } }; const { label, variant } = map[status] || { label: status, variant: "secondary" }; return <Badge variant={variant}>{label}</Badge> }
  const getClientName = (id: string) => clients?.find((c) => c._id === id)?.fullName
  const getCantiereName = (id: string) => cantieri?.find((c) => c._id === id)?.name

  const filteredAppointments = appointments?.filter((a) => { if (statusFilter !== "all" && a.status !== statusFilter) return false; if (search) { const s = search.toLowerCase(); return a.title.toLowerCase().includes(s) || a.email.toLowerCase().includes(s) } return true }) || []
  const today = new Date().toISOString().split("T")[0]
  const todayAppointments = filteredAppointments.filter((a) => a.appointmentDate === today)
  const upcomingAppointments = filteredAppointments.filter((a) => a.appointmentDate > today && a.status === "scheduled")

  if (!orgId || !appointments || !stats) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-white">Appuntamenti</h1><p className="text-white/60 mt-1">{appointments.length} appuntamenti</p></div>
        <div className="flex items-center gap-2">
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            <Button variant="ghost" size="sm" onClick={() => setViewMode("calendar")} className={cn("rounded-none h-8 px-3 text-xs", viewMode === "calendar" ? "bg-kranely-accent/20 text-kranely-accent" : "bg-white text-black hover:bg-white/80")}>
              <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Calendario
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} className={cn("rounded-none h-8 px-3 text-xs", viewMode === "list" ? "bg-kranely-accent/20 text-kranely-accent" : "bg-white text-black hover:bg-white/80")}>
              <List className="w-3.5 h-3.5 mr-1" /> Lista
            </Button>
          </div>
          <Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Oggi</span></div><p className="text-xl font-bold text-white">{stats.today}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">Prossimi</span></div><p className="text-xl font-bold text-blue-400">{stats.upcoming}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Completati</span></div><p className="text-xl font-bold text-green-400">{stats.completed}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-red-400" /><span className="text-sm text-white/60">Annullati</span></div><p className="text-xl font-bold text-red-400">{stats.cancelled}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca appuntamenti..." className="pl-10" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="all">Tutti gli stati</option><option value="scheduled">Fissato</option><option value="confirmed">Confermato</option><option value="completed">Completato</option><option value="cancelled">Annullato</option><option value="no_show">No Show</option></select>
      </div>
      {todayAppointments.length > 0 && (
        <div><h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-kranely-accent" /> Oggi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAppointments.map((a) => (
              <div key={a._id} className="p-4 rounded-xl border border-kranely-accent/20 bg-kranely-accent/5">
                <div className="flex items-start justify-between mb-2"><h3 className="text-sm font-medium text-white">{a.title}</h3>{statusBadge(a.status)}</div>
                <div className="space-y-1 text-xs text-white/60">
                  {a.appointmentTime && <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.appointmentTime}</div>}
                  {a.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</div>}
                  {a.clientId && <div className="flex items-center gap-1"><Users className="w-3 h-3" /><Link href="/clients" className="text-kranely-accent hover:underline">{getClientName(a.clientId)}</Link></div>}
                  {a.cantiereId && <div className="flex items-center gap-1"><Building2 className="w-3 h-3" /><Link href="/cantieri" className="text-kranely-accent hover:underline">{getCantiereName(a.cantiereId)}</Link></div>}
                </div>
                <div className="flex items-center gap-1 mt-3"><button onClick={() => openDetail(a)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button><button onClick={() => openEdit(a)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(a._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {viewMode === "calendar" ? (
        <CalendarView appointments={filteredAppointments as any} onAppointmentClick={(apt) => openEdit(apt as any)} />
      ) : (
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Prossimi Appuntamenti</h2>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10"><tr><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Appuntamento</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden md:table-cell">Data/Ora</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Luogo</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Associato a</th><th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Stato</th><th className="w-24"></th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {upcomingAppointments.map((a) => (
                  <tr key={a._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-white">{a.title}</p><p className="text-xs text-white/40">{a.email}</p></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="space-y-0.5"><div className="flex items-center gap-1.5 text-xs text-white/60"><Calendar className="w-3 h-3" />{a.appointmentDate}</div>{a.appointmentTime && <div className="flex items-center gap-1.5 text-xs text-white/60"><Clock className="w-3 h-3" />{a.appointmentTime}</div>}</div></td>
                    <td className="px-4 py-3 text-sm text-white/60 hidden lg:table-cell">{a.location || "-"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{a.clientId && <Link href="/clients" className="text-sm text-kranely-accent hover:underline">{getClientName(a.clientId)}</Link>}{a.cantiereId && <Link href="/cantieri" className="text-sm text-kranely-accent hover:underline">{getCantiereName(a.cantiereId)}</Link>}</td>
                    <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1"><button onClick={() => openDetail(a)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button><button onClick={() => openEdit(a)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(a._id)} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {upcomingAppointments.length === 0 && todayAppointments.length === 0 && <div className="p-12 text-center text-white/40"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun appuntamento</p></div>}
        </div>
      </div>
      )}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Nuovo Appuntamento</DialogTitle><DialogDescription>Fissa un nuovo appuntamento con un cliente</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Titolo *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>Data *</Label><Input type="date" value={formData.appointmentDate} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })} /></div>
            <div><Label>Ora</Label><Input type="time" value={formData.appointmentTime} onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })} /></div>
            <div><Label>Luogo</Label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
            <div><Label>Cliente</Label><select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{clients?.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}</select></div>
            <div><Label>Cantiere</Label><select value={formData.cantiereId} onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">Nessuno</option>{cantieri?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Fissa</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Modifica Appuntamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Titolo</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>Data</Label><Input type="date" value={formData.appointmentDate} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })} /></div>
            <div><Label>Ora</Label><Input type="time" value={formData.appointmentTime} onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="scheduled">Fissato</option><option value="confirmed">Confermato</option><option value="completed">Completato</option><option value="cancelled">Annullato</option><option value="no_show">No Show</option></select></div>
            <div><Label>Luogo</Label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrizione</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleUpdate} className="bg-kranely-accent text-kranely-app-bg">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Dettaglio Appuntamento</DialogTitle></DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-white/40">Titolo</span><p className="text-white font-medium">{selectedAppointment.title}</p></div>
                <div><span className="text-xs text-white/40">Stato</span>{statusBadge(selectedAppointment.status)}</div>
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
