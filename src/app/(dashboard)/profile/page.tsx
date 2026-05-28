"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageSkeleton } from "@/components/Skeletons"
import { toast } from "sonner"
import { User, Save } from "lucide-react"

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin", admin: "Amministratore", client: "Cliente",
  supplier: "Fornitore", collaborator: "Collaboratore", driver: "Autista",
}

const subroleLabels: Record<string, string> = {
  serramenti: "Serramenti", edilizia: "Edilizia", generale: "Generale",
}

export default function ProfilePage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const org = useQuery(api.organizations.get, orgId ? { id: orgId } : "skip")
  const users = useQuery(api.organizations.listUsers, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const updateUser = useMutation(api.organizations.updateUser)

  const myUser = users?.find((u) => u.email === user?.email)

  useEffect(() => {
    if (myUser) {
      if (!fullName) setFullName(myUser.fullName || "")
      if (!phone) setPhone(myUser.phone || "")
    }
  }, [myUser]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || !orgId || !users) return <PageSkeleton />

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error("Il nome non può essere vuoto"); return }
    if (!myUser) { toast.error("Utente non trovato"); return }
    setSaving(true)
    try {
      await updateUser({ id: myUser._id, organizationId: orgId!, userEmail: user?.email, fullName: fullName.trim(), phone: phone.trim() || undefined })
      toast.success("Profilo aggiornato")
    } catch (err: any) {
      toast.error(err.message || "Errore nel salvataggio")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Il Mio Profilo</h1><p className="text-white/60 mt-1">Gestisci le tue informazioni personali</p></div>

      <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <User className="w-8 h-8 text-white/60" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{myUser?.fullName || "Utente"}</h2>
            <p className="text-sm text-white/60">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-kranely-accent/10 text-kranely-accent">
              {roleLabels[user.role] || user.role}
            </span>
            {user.subrole && (
              <span className="inline-block ml-2 px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/80">
                {subroleLabels[user.subrole] || user.subrole}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Nome completo</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Il tuo nome" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Telefono</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+39 000 000 0000" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Email</label>
            <Input value={user.email} disabled className="opacity-60" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Organizzazione</label>
            <Input value={org?.name || ""} disabled className="opacity-60" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 gap-2">
            <Save className="w-4 h-4" /> {saving ? "Salvataggio..." : "Salva modifiche"}
          </Button>
        </div>
      </div>
    </div>
  )
}
