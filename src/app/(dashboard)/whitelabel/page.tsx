"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/input"
import { Palette, Type, Link, Mail, Phone, Globe, Image, Save } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function WhitelabelPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const settings = useQuery(api.whitelabel.get, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")

  const createSettings = useMutation(api.whitelabel.create)
  const updateSettings = useMutation(api.whitelabel.update)

  const [formData, setFormData] = useState({
    appName: "", tagline: "", logoUrl: "", faviconUrl: "",
    primaryColor: "#FFC703", secondaryColor: "#1A1A2E", accentColor: "#FFC703",
    fontFamily: "Inter", supportEmail: "", supportPhone: "", websiteUrl: "", customCss: ""
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        appName: settings.appName || "", tagline: settings.tagline || "", logoUrl: settings.logoUrl || "", faviconUrl: settings.faviconUrl || "",
        primaryColor: settings.primaryColor || "#FFC703", secondaryColor: settings.secondaryColor || "#1A1A2E", accentColor: settings.accentColor || "#FFC703",
        fontFamily: settings.fontFamily || "Inter", supportEmail: settings.supportEmail || "", supportPhone: settings.supportPhone || "", websiteUrl: settings.websiteUrl || "", customCss: settings.customCss || ""
      })
    }
  }, [settings])

  const handleSave = async () => {
    if (!orgId) return
    try {
      if (settings?._id) {
        await updateSettings({ id: settings._id, ...formData })
      } else {
        await createSettings({ organizationId: orgId, ...formData })
      }
      toast.success("Impostazioni salvate")
    } catch (e) { toast.error("Errore") }
  }

  if (!orgId) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">White Label</h1><p className="text-white/60 mt-1">Personalizza branding e aspetto dell'app</p></div><Button onClick={handleSave} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Save className="w-4 h-4 mr-2" /> Salva</Button></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Type className="w-5 h-5 text-kranely-accent" /><h2 className="text-lg font-semibold text-white">Identita</h2></div>
          <div className="space-y-4">
            <div><Label>Nome App</Label><Input value={formData.appName} onChange={(e) => setFormData({ ...formData, appName: e.target.value })} placeholder="Kranely" /></div>
            <div><Label>Tagline</Label><Input value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })} placeholder="La tua piattaforma" /></div>
            <div><Label>Font</Label><select value={formData.fontFamily} onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="Inter">Inter</option><option value="Roboto">Roboto</option><option value="Poppins">Poppins</option><option value="Montserrat">Montserrat</option></select></div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Palette className="w-5 h-5 text-kranely-accent" /><h2 className="text-lg font-semibold text-white">Colori</h2></div>
          <div className="space-y-4">
            <div><Label>Colore Primario</Label><div className="flex items-center gap-2 mt-1"><input type="color" value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent" /><Input value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} className="flex-1" /></div></div>
            <div><Label>Colore Secondario</Label><div className="flex items-center gap-2 mt-1"><input type="color" value={formData.secondaryColor} onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent" /><Input value={formData.secondaryColor} onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })} className="flex-1" /></div></div>
            <div><Label>Colore Accento</Label><div className="flex items-center gap-2 mt-1"><input type="color" value={formData.accentColor} onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent" /><Input value={formData.accentColor} onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })} className="flex-1" /></div></div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Image className="w-5 h-5 text-kranely-accent" /><h2 className="text-lg font-semibold text-white">Logo e Favicon</h2></div>
          <div className="space-y-4">
            <div><Label>URL Logo</Label><Input value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="https://..." /></div>
            <div><Label>URL Favicon</Label><Input value={formData.faviconUrl} onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })} placeholder="https://..." /></div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Mail className="w-5 h-5 text-kranely-accent" /><h2 className="text-lg font-semibold text-white">Contatti Supporto</h2></div>
          <div className="space-y-4">
            <div><Label>Email Supporto</Label><Input type="email" value={formData.supportEmail} onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })} placeholder="support@..." /></div>
            <div><Label>Telefono Supporto</Label><Input value={formData.supportPhone} onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })} placeholder="+39..." /></div>
            <div><Label>Website</Label><Input value={formData.websiteUrl} onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })} placeholder="https://..." /></div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] lg:col-span-2">
          <div className="flex items-center gap-2 mb-4"><Link className="w-5 h-5 text-kranely-accent" /><h2 className="text-lg font-semibold text-white">CSS Personalizzato</h2></div>
          <textarea value={formData.customCss} onChange={(e) => setFormData({ ...formData, customCss: e.target.value })} placeholder="/* Il tuo CSS personalizzato */" rows={6} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono placeholder:text-white/20" />
        </div>
      </div>

      <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
        <h3 className="text-lg font-semibold text-white mb-4">Anteprima</h3>
        <div className="p-6 rounded-lg border border-white/10" style={{ backgroundColor: formData.secondaryColor }}>
          <h1 style={{ color: formData.primaryColor }} className="text-2xl font-bold">{formData.appName || "Kranely"}</h1>
          <p className="text-white/60 mt-1">{formData.tagline || "La tua piattaforma di gestione"}</p>
          <div className="flex items-center gap-3 mt-4">
            <button style={{ backgroundColor: formData.accentColor }} className="px-4 py-2 rounded-lg text-sm font-medium text-black hover:brightness-110 active:brightness-90 transition-all">Pulsante Primario</button>
            <button className="px-4 py-2 rounded-lg border text-sm text-white hover:bg-white/10 active:bg-white/20 transition-all" style={{ borderColor: formData.primaryColor }}>Pulsante Secondario</button>
          </div>
        </div>
      </div>
    </div>
  )
}
