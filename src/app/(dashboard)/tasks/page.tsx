"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Plus, Search, Eye, Edit2, CheckCircle2, Circle, Clock, Calendar, Flag, Building2, Trash2, LayoutGrid, List } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { KanbanBoard } from "@/components/KanbanBoard"

const phases = [
  { value: "in_lavorazione", label: "In Lavorazione", color: "text-blue-400" },
  { value: "posa_in_opera", label: "Posa in Opera", color: "text-kranely-accent" },
  { value: "completato", label: "Completato", color: "text-green-400" },
]

const statusConfig = {
  da_fare: { label: "Da Fare", variant: "secondary" as const, icon: Circle },
  in_corso: { label: "In Corso", variant: "default" as const, icon: Clock },
  completato: { label: "Completato", variant: "success" as const, icon: CheckCircle2 },
}

const priorityConfig = {
  alta: { label: "Alta", color: "text-red-400" },
  media: { label: "Media", color: "text-kranely-accent" },
  bassa: { label: "Bassa", color: "text-green-400" },
}

export default function TasksPage() {
  const orgId = useOrgId()
  const [search, setSearch] = useState("")
  const [filterPhase, setFilterPhase] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCantiere, setFilterCantiere] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<Id<"phaseTasks"> | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"phaseTasks"> | null>(null)
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [formData, setFormData] = useState({ cantiereId: "", phase: "in_lavorazione", title: "", description: "", assignedTo: "", priority: "media", dueDate: "" })
  const [editFormData, setEditFormData] = useState({ title: "", description: "", status: "da_fare" as "da_fare" | "in_corso" | "completato", priority: "media" as "alta" | "media" | "bassa", dueDate: "", assignedTo: "" })

  const tasks = useQuery(api.tasks.list, orgId ? { organizationId: orgId } : "skip")
  const stats = useQuery(api.tasks.stats, orgId ? { organizationId: orgId } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId } : "skip")
  const collaborators = useQuery(api.collaborators.list, orgId ? { organizationId: orgId } : "skip")

  const createTask = useMutation(api.tasks.create)
  const updateTask = useMutation(api.tasks.update)
  const removeTask = useMutation(api.tasks.remove)

  const openCreate = () => { setFormData({ cantiereId: "", phase: "in_lavorazione", title: "", description: "", assignedTo: "", priority: "media", dueDate: "" }); setShowCreateDialog(true) }

  const openDetail = (task: any) => { setSelectedTaskId(task._id); setShowDetailDialog(true) }
  const selectedTask = useQuery(api.tasks.get, selectedTaskId ? { id: selectedTaskId } : "skip")

  const openEdit = (task: any) => {
    setEditFormData({ title: task.title, description: task.description || "", status: task.status, priority: task.priority || "media", dueDate: task.dueDate || "", assignedTo: task.assignedTo || "" })
    setEditingTaskId(task._id)
    setShowEditDialog(true)
  }

  const handleEdit = async () => {
    if (!editingTaskId) return
    try {
      await updateTask({ id: editingTaskId, title: editFormData.title, description: editFormData.description || undefined, status: editFormData.status, priority: editFormData.priority, dueDate: editFormData.dueDate || undefined, completedDate: editFormData.status === "completato" ? new Date().toISOString().split("T")[0] : undefined })
      setShowEditDialog(false); toast.success("Task aggiornato")
    } catch (e) { toast.error("Errore") }
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.cantiereId || !orgId) { toast.error("Compila i campi obbligatori"); return }
    try {
      await createTask({ organizationId: orgId, cantiereId: formData.cantiereId as Id<"cantieri">, phase: formData.phase as any, title: formData.title, description: formData.description || undefined, assignedTo: formData.assignedTo || undefined, priority: formData.priority as any, dueDate: formData.dueDate || undefined })
      setShowCreateDialog(false)
      toast.success("Task creato")
    } catch (e) { toast.error("Errore nella creazione") }
  }

  const handleStatusChange = async (taskId: Id<"phaseTasks">, newStatus: "da_fare" | "in_corso" | "completato") => {
    try {
      await updateTask({ id: taskId, status: newStatus, completedDate: newStatus === "completato" ? new Date().toISOString().split("T")[0] : undefined })
      toast.success(`Task spostato in: ${statusConfig[newStatus].label}`)
    } catch (e) { toast.error("Errore nell'aggiornamento") }
  }

  const handleDelete = async (id: Id<"phaseTasks">) => {
    if (!confirm("Eliminare questo task?")) return
    try { await removeTask({ id }); toast.success("Task eliminato") } catch (e) { toast.error("Errore") }
  }

  const getCantiereName = (id: string) => cantieri?.find((c) => c._id === id)?.name || "..."

  const filtered = tasks?.filter((t) => {
    if (filterPhase !== "all" && t.phase !== filterPhase) return false
    if (filterStatus !== "all" && t.status !== filterStatus) return false
    if (filterCantiere !== "all" && t.cantiereId !== filterCantiere) return false
    if (search) { const s = search.toLowerCase(); return t.title.toLowerCase().includes(s) || (t.description || "").toLowerCase().includes(s) || (t.assignedTo || "").toLowerCase().includes(s) }
    return true
  }) || []

  if (!orgId || !tasks || !cantieri) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Task</h1>
          <p className="text-white/60 mt-1">Gestione task per fase e cantiere</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            <Button variant="ghost" size="sm" onClick={() => setViewMode("kanban")} className={cn("rounded-none h-8 px-3 text-xs", viewMode === "kanban" ? "bg-kranely-accent/20 text-kranely-accent" : "bg-white text-black hover:bg-white/80")}>
              <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Kanban
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} className={cn("rounded-none h-8 px-3 text-xs", viewMode === "list" ? "bg-kranely-accent/20 text-kranely-accent" : "bg-white text-black hover:bg-white/80")}>
              <List className="w-3.5 h-3.5 mr-1" /> Lista
            </Button>
          </div>
          <Button onClick={openCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">
            <Plus className="w-4 h-4 mr-2" /> Nuovo Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><span className="text-sm text-white/60">Totali</span><p className="text-xl font-bold text-white">{stats?.total || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><span className="text-sm text-white/60">Da Fare</span><p className="text-xl font-bold text-white/60">{stats?.daFare || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><span className="text-sm text-white/60">In Corso</span><p className="text-xl font-bold text-kranely-accent">{stats?.inCorso || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><span className="text-sm text-white/60">Completati</span><p className="text-xl font-bold text-green-400">{stats?.completato || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><span className="text-sm text-white/60">Alta Priorita</span><p className="text-xl font-bold text-red-400">{stats?.altaPriorita || 0}</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca task..." className="pl-10" />
        </div>
        <select value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
          <option value="all">Tutte le Fasi</option>
          {phases.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
          <option value="all">Tutti gli Stati</option>
          <option value="da_fare">Da Fare</option>
          <option value="in_corso">In Corso</option>
          <option value="completato">Completato</option>
        </select>
        <select value={filterCantiere} onChange={(e) => setFilterCantiere(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
          <option value="all">Tutti i Cantieri</option>
          {cantieri?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoard tasks={filtered as any} onStatusChange={handleStatusChange} />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const statusCfg = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.da_fare
            const priorityCfg = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.media
            const StatusIcon = statusCfg.icon
            return (
              <div key={task._id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <button onClick={() => handleStatusChange(task._id, task.status as any)} className="mt-1 flex-shrink-0" title="Cambia stato" aria-label="Cambia stato">
                    <StatusIcon className={`w-5 h-5 ${task.status === "completato" ? "text-green-400" : task.status === "in_corso" ? "text-kranely-accent" : "text-white/50"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium text-white ${task.status === "completato" ? "line-through text-white/40" : ""}`}>{task.title}</h3>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      <span className={`text-xs font-medium ${priorityCfg.color}`}><Flag className="w-3 h-3 inline mr-1" />{priorityCfg.label}</span>
                    </div>
                    {task.description && <p className="text-sm text-white/60 mt-1">{task.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40 flex-wrap">
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /><Link href="/cantieri" className="text-kranely-accent hover:underline">{getCantiereName(task.cantiereId)}</Link></span>
                      {task.assignedTo && <span>Assegnato a: {task.assignedTo}</span>}
                      {task.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Scadenza: {new Date(task.dueDate).toLocaleDateString("it-IT")}</span>}
                      <span className="text-kranely-accent">{phases.find((p) => p.value === task.phase)?.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openDetail(task)} className="h-8 px-2 bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(task)} className="h-8 px-2 bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(task._id)} className="h-8 px-2"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="p-12 text-center text-white/40">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nessun task trovato</p>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Task</DialogTitle>
            <DialogDescription>Aggiungi un nuovo task a un cantiere</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Titolo *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Es: Preparazione ponteggi" /></div>
            <div><Label>Cantiere *</Label>
              <select value={formData.cantiereId} onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="">Seleziona cantiere</option>
                {cantieri?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><Label>Fase</Label>
              <select value={formData.phase} onChange={(e) => setFormData({ ...formData, phase: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                {phases.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div><Label>Assegnato a</Label>
              <select value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="">Nessuno</option>
                {collaborators?.map((c) => <option key={c._id} value={c.fullName}>{c.fullName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Priorita</Label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </div>
              <div><Label>Scadenza</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
            </div>
            <div><Label>Descrizione</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Descrizione del task..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">Crea Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifica Task</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Titolo</Label><Input value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} /></div>
            <div><Label>Stato</Label>
              <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="da_fare">Da Fare</option>
                <option value="in_corso">In Corso</option>
                <option value="completato">Completato</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Priorita</Label>
                <select value={editFormData.priority} onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as any })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </div>
              <div><Label>Scadenza</Label><Input type="date" value={editFormData.dueDate} onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })} /></div>
            </div>
            <div><Label>Assegnato a</Label>
              <select value={editFormData.assignedTo} onChange={(e) => setEditFormData({ ...editFormData, assignedTo: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="">Nessuno</option>
                {collaborators?.map((c) => <option key={c._id} value={c.fullName}>{c.fullName}</option>)}
              </select>
            </div>
            <div><Label>Descrizione</Label><Textarea value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleEdit} className="bg-kranely-accent text-kranely-app-bg">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Dettaglio Task</DialogTitle></DialogHeader>
          {selectedTask && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="md:col-span-2"><span className="text-xs text-white/40">Titolo</span><p className="text-white font-medium">{selectedTask.title}</p></div>
                <div><span className="text-xs text-white/40">Stato</span>{(() => { const cfg = statusConfig[selectedTask.status as keyof typeof statusConfig]; return <Badge variant={cfg?.variant || "secondary"}>{cfg?.label || selectedTask.status}</Badge> })()}</div>
                <div><span className="text-xs text-white/40">Priorita</span><p className={`text-sm font-medium ${(priorityConfig[selectedTask.priority as keyof typeof priorityConfig] || priorityConfig.media).color}`}>{(priorityConfig[selectedTask.priority as keyof typeof priorityConfig] || priorityConfig.media).label}</p></div>
                <div><span className="text-xs text-white/40">Fase</span><p className="text-white">{phases.find((p) => p.value === selectedTask.phase)?.label || selectedTask.phase}</p></div>
                <div><span className="text-xs text-white/40">Cantiere</span><Link href="/cantieri" className="text-kranely-accent hover:underline">{getCantiereName(selectedTask.cantiereId)}</Link></div>
                {selectedTask.assignedTo && <div><span className="text-xs text-white/40">Assegnato a</span><p className="text-white">{selectedTask.assignedTo}</p></div>}
                {selectedTask.dueDate && <div><span className="text-xs text-white/40">Scadenza</span><p className="text-white">{new Date(selectedTask.dueDate).toLocaleDateString("it-IT")}</p></div>}
              </div>
              {selectedTask.description && <div><span className="text-xs text-white/40">Descrizione</span><p className="text-white/80 mt-1">{selectedTask.description}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
