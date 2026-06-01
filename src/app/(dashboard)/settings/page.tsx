"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Bell, Building2, Shield, Palette, Save, Lock, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState } from "react"
import { toast } from "sonner"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { useAuth } from "@/lib/auth/auth-context"

export default function SettingsPage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const org = useQuery(api.organizations.get, orgId ? { id: orgId, userEmail: user?.email } : "skip")
  const notifications = useQuery(api.notifications.stats, orgId && user?.email ? { organizationId: orgId, userEmail: user.email } : "skip")

  const updateOrg = useMutation(api.organizations.update)
  const updatePassword = useMutation(api.auth.updatePassword)

  const [orgName, setOrgName] = useState("")
  const [orgNameLoaded, setOrgNameLoaded] = useState(false)

  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  if (!orgId || !org) return <PageSkeleton />

  if (!orgNameLoaded && org.name) {
    setOrgName(org.name)
    setOrgNameLoaded(true)
  }

  const handleSaveOrgName = async () => {
    if (!orgName.trim()) { toast.error("Il nome non può essere vuoto"); return }
    try {
      await updateOrg({ id: orgId, name: orgName.trim() })
      toast.success("Nome aggiornato")
    } catch (e) { toast.error("Errore nel salvataggio") }
  }

  const handleChangePassword = async () => {
    if (!user?.email) { toast.error("Utente non autenticato"); return }
    if (!oldPassword) { toast.error("Inserisci la password attuale"); return }
    if (newPassword.length < 6) { toast.error("Nuova password: minimo 6 caratteri"); return }
    if (newPassword !== confirmPassword) { toast.error("Le password non coincidono"); return }
    try {
      await updatePassword({ email: user.email, oldPassword, newPassword })
      setShowPasswordDialog(false)
      setOldPassword(""); setNewPassword(""); setConfirmPassword("")
      toast.success("Password cambiata con successo")
    } catch (e: any) { toast.error(e.message || "Errore") }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Impostazioni</h1><p className="text-white/60 mt-1">Gestisci le impostazioni del tuo account</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-kranely-accent" /><h2 className="text-lg font-semibold text-white">Azienda</h2></div>
          <div className="space-y-4">
            <div><Label>Nome Azienda</Label>
              <div className="flex gap-2 mt-1">
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                <Button onClick={handleSaveOrgName} className="bg-kranely-accent text-kranely-app-bg flex-shrink-0"><Save className="w-4 h-4" /></Button>
              </div>
            </div>
            <div><Label>Slug</Label><Input value={org.slug} disabled className="mt-1" /></div>
            <div><Label>Piano</Label><Badge variant="default" className="mt-1">{org.plan}</Badge></div>
            <div><Label>Stato</Label><Badge variant={org.status === "active" ? "success" : "secondary"} className="mt-1">{org.status}</Badge></div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Bell className="w-5 h-5 text-kranely-accent" /><h2 className="text-lg font-semibold text-white">Notifiche</h2></div>
          {notifications ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded bg-white/5">
                <span className="text-sm text-white/60">Non lette</span>
                <Badge variant="destructive">{notifications.unread}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-white/5">
                <span className="text-sm text-white/60">Pagamenti in scadenza</span>
                <Badge variant="warning">{notifications.byType.paymentDue}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-white/5">
                <span className="text-sm text-white/60">Certificati in scadenza</span>
                <Badge variant="warning">{notifications.byType.certificateExpiry}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-white/5">
                <span className="text-sm text-white/60">Task assegnati</span>
                <Badge>{notifications.byType.taskAssigned}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-sm">Caricamento...</p>
          )}
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Palette className="w-5 h-5 text-kranely-accent" /><h2 className="text-lg font-semibold text-white">Aspetto</h2></div>
          <div className="space-y-4">
            <div><Label>Tema</Label>
              <select className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1" defaultValue="dark">
                <option value="dark">Scuro</option>
                <option value="light">Chiaro</option>
              </select>
            </div>
            <div><Label>Colore Accento</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded bg-kranely-accent" />
                <span className="text-sm text-white/60">#FFC703</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-kranely-accent" /><h2 className="text-lg font-semibold text-white">Sicurezza</h2></div>
          <div className="space-y-4">
            <div><Label>Email</Label><Input value={user?.email || org.ownerEmail} disabled className="mt-1" /></div>
            <Button onClick={() => setShowPasswordDialog(true)} variant="outline" className="border-white/20 w-full">
              <Lock className="w-4 h-4 mr-2" />Cambia Password
            </Button>
            <Button variant="outline" className="border-white/20 w-full cursor-not-allowed" disabled>
              <KeyRound className="w-4 h-4 mr-2" />Abilita 2FA (Prossimamente)
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambia Password</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Password Attuale</Label><Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} /></div>
            <div><Label>Nuova Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
            <div><Label>Conferma Nuova Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleChangePassword} className="bg-kranely-accent text-kranely-app-bg">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
