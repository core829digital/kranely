"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useOrgId } from "@/hooks/useOrgId"
import { useAuth } from "@/lib/auth/auth-context"
import { PageSkeleton } from "@/components/Skeletons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Clock, Calendar, Building2, Users, Plus, X, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function DailyLogsPage() {
  const orgId = useOrgId()
  const { user } = useAuth()

  const [collaboratorId, setCollaboratorId] = useState("")
  const [cantiereId, setCantiereId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [hours, setHours] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const collaborators = useQuery(api.collaborators.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const hoursEntries = useQuery(api.collaborators.listHours, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")

  const addHours = useMutation(api.collaborators.addHours)
  const approveHours = useMutation(api.collaborators.updateHours)
  const removeHours = useMutation(api.collaborators.removeHours)

  if (!orgId) return <PageSkeleton />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!collaboratorId) { toast.error("Seleziona un collaboratore"); return }
    if (!hours || isNaN(Number(hours)) || Number(hours) <= 0) { toast.error("Inserisci ore valide"); return }
    setSaving(true)
    try {
      await addHours({
        organizationId: orgId,
        collaboratorId: collaboratorId as any,
        cantiereId: (cantiereId || undefined) as any,
        date,
        hours: Number(hours),
        description: description || undefined,
        userEmail: user?.email,
      })
      toast.success("Ore registrate")
      setHours("")
      setDescription("")
    } catch (err: any) {
      toast.error(err.message || "Errore")
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id: any, approved: boolean) => {
    try {
      await approveHours({ id, organizationId: orgId, approved })
      toast.success(approved ? "Ore approvate" : "Approvazione rimossa")
    } catch { toast.error("Errore") }
  }

  const handleRemove = async (id: any) => {
    try {
      await removeHours({ id, organizationId: orgId })
      toast.success("Ore rimosse")
    } catch { toast.error("Errore") }
  }

  const getCollaboratorName = (id: string) => collaborators?.find((c) => c._id === id)?.fullName || id
  const getCantiereName = (id: string) => cantieri?.find((c) => c._id === id)?.name || id

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Report Giornalieri</h1>
        <p className="text-white/60 mt-1">Registra ore lavorative e approva i log dei collaboratori</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Collaboratori</span></div>
          <p className="text-xl font-bold text-white">{collaborators?.length || 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">Cantieri Attivi</span></div>
          <p className="text-xl font-bold text-blue-400">{cantieri?.filter((c) => c.status === "in_corso").length || 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Ore Registrate</span></div>
          <p className="text-xl font-bold text-green-400">{hoursEntries?.reduce((s, h) => s + h.hours, 0).toFixed(1) || 0}h</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Da Approvare</span></div>
          <p className="text-xl font-bold text-kranely-accent">{hoursEntries?.filter((h) => !h.approved).length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-kranely-accent" /> Nuova Registrazione</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Collaboratore</label>
                <select value={collaboratorId} onChange={(e) => setCollaboratorId(e.target.value)} className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kranely-accent/50 focus:border-kranely-accent/50 transition-colors appearance-none cursor-pointer">
                    <option value="" disabled>Seleziona...</option>
                    {collaborators?.map((c) => (
                      <option key={c._id} value={c._id}>{c.fullName}</option>
                    ))}
                  </select>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Cantiere (opzionale)</label>
                <select value={cantiereId || "none"} onChange={(e) => setCantiereId(e.target.value === "none" ? "" : e.target.value)} className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kranely-accent/50 focus:border-kranely-accent/50 transition-colors appearance-none cursor-pointer">
                    <option value="none">Nessuno</option>
                    {cantieri?.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Data</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Ore</label>
                  <Input type="number" step="0.5" min="0.5" max="24" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="es. 8" required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Descrizione (opzionale)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tipo di lavoro svolto" />
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvataggio...</> : <><Clock className="w-4 h-4 mr-2" />Registra Ore</>}
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Registrazioni Recenti</h3>
              <span className="text-xs text-white/40">{hoursEntries?.length || 0} voci</span>
            </div>
            {!hoursEntries ? (
              <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-kranely-accent" /></div>
            ) : hoursEntries.length === 0 ? (
              <div className="p-12 text-center"><Clock className="w-12 h-12 mx-auto mb-4 text-white/20" /><p className="text-white/60">Nessuna ora registrata</p></div>
            ) : (
              <div className="divide-y divide-white/10 max-h-[500px] overflow-y-auto">
                {hoursEntries.map((entry) => (
                  <div key={entry._id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{getCollaboratorName(entry.collaboratorId)}</span>
                        <Badge className={entry.approved ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                          {entry.approved ? "Approvato" : "In attesa"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(entry.date).toLocaleDateString("it-IT")}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.hours}h</span>
                        {entry.cantiereId && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{getCantiereName(entry.cantiereId)}</span>}
                      </div>
                      {entry.description && <p className="text-xs text-white/30 mt-1 truncate">{entry.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-4 shrink-0">
                      {!entry.approved && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 bg-white text-black hover:bg-white/80" title="Approva" aria-label="Approva" onClick={() => handleApprove(entry._id, true)}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      {entry.approved && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 bg-white text-black hover:bg-white/80" title="Rimuovi approvazione" aria-label="Rimuovi approvazione" onClick={() => handleApprove(entry._id, false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 bg-white text-black hover:bg-white/80" title="Elimina" aria-label="Elimina" onClick={() => handleRemove(entry._id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
