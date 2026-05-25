"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Upload, Eye, Settings, Type, Image, Palette, Save, Printer, File } from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function PdfEditorPage() {
  const orgId = useOrgId()
  const [templateName, setTemplateName] = useState("Preventivo Standard")
  const [selectedTemplate, setSelectedTemplate] = useState("preventivo")

  const quotes = useQuery(api.quotes.list, orgId ? { organizationId: orgId } : "skip")
  const documents = useQuery(api.documents.list, orgId ? { organizationId: orgId } : "skip")

  const templates = [
    { id: "preventivo", name: "Preventivo", icon: FileText },
    { id: "fattura", name: "Fattura", icon: File },
    { id: "contratto", name: "Contratto", icon: FileText },
    { id: "relazione", name: "Relazione", icon: FileText },
  ]

  const handleSave = () => { toast.success("Template salvato") }
  const handleExport = () => { toast.success("PDF esportato") }

  if (!orgId) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Editor PDF</h1><p className="text-white/60 mt-1">Crea e modifica template PDF</p></div><div className="flex items-center gap-2"><Button variant="outline" className="border-white/10"><Printer className="w-4 h-4 mr-2" /> Stampa</Button><Button onClick={handleExport} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Download className="w-4 h-4 mr-2" /> Esporta PDF</Button></div></div>

      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="editor" className="data-[state=active]:bg-kranely-accent data-[state=active]:text-kranely-app-bg">Editor</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-kranely-accent data-[state=active]:text-kranely-app-bg">Template</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-kranely-accent data-[state=active]:text-kranely-app-bg">Impostazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Type className="w-4 h-4 text-kranely-accent" /> Contenuto</h3>
                <div className="space-y-3">
                  <div><label className="text-xs text-white/40">Nome Template</label><Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="mt-1" /></div>
                  <div><label className="text-xs text-white/40">Intestazione</label><Input defaultValue="Kranely - Preventivo" className="mt-1" /></div>
                  <div><label className="text-xs text-white/40">Note a Pié di Pagina</label><Input defaultValue="Documento valido 30 giorni" className="mt-1" /></div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-kranely-accent" /> Stile</h3>
                <div className="space-y-3">
                  <div><label className="text-xs text-white/40">Colore Primario</label><div className="flex items-center gap-2 mt-1"><input type="color" defaultValue="#FFC703" className="w-8 h-8 rounded cursor-pointer bg-transparent" /><span className="text-sm text-white">#FFC703</span></div></div>
                  <div><label className="text-xs text-white/40">Font</label><select className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1"><option>Inter</option><option>Roboto</option><option>Arial</option></select></div>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Save className="w-4 h-4 mr-2" /> Salva Template</Button>
            </div>

            <div className="lg:col-span-2">
              <div className="p-8 rounded-xl border border-white/10 bg-white/[0.02] min-h-[600px]">
                <div className="bg-white text-black p-8 rounded-lg min-h-[500px]">
                  <div className="flex items-center justify-between mb-8">
                    <div><h1 className="text-2xl font-bold" style={{ color: "#FFC703" }}>{templateName}</h1><p className="text-gray-500 text-sm">Data: {new Date().toLocaleDateString("it-IT")}</p></div>
                    <div className="text-right"><p className="font-semibold">Kranely S.r.l.</p><p className="text-gray-500 text-sm">info@kranely.it</p></div>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <h2 className="font-semibold mb-2">Dettagli Preventivo</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Cliente:</span> <span className="font-medium">Mario Rossi</span></div>
                      <div><span className="text-gray-500">Validita:</span> <span className="font-medium">30 giorni</span></div>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="text-left p-2">Descrizione</th><th className="text-right p-2">Qta</th><th className="text-right p-2">Prezzo</th><th className="text-right p-2">Totale</th></tr></thead>
                    <tbody>
                      <tr className="border-b"><td className="p-2">Installazione infissi PVC</td><td className="text-right p-2">1</td><td className="text-right p-2">EUR 2.500</td><td className="text-right p-2">EUR 2.500</td></tr>
                      <tr className="border-b"><td className="p-2">Posa in opera</td><td className="text-right p-2">1</td><td className="text-right p-2">EUR 800</td><td className="text-right p-2">EUR 800</td></tr>
                    </tbody>
                    <tfoot><tr className="font-bold"><td className="p-2" colSpan={3}>Totale</td><td className="text-right p-2" style={{ color: "#FFC703" }}>EUR 3.300</td></tr></tfoot>
                  </table>
                  <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400"><p>Documento valido 30 giorni dalla data di emissione</p></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <div key={t.id} className={`p-5 rounded-xl border cursor-pointer transition-colors ${selectedTemplate === t.id ? "border-kranely-accent bg-kranely-accent/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}`} onClick={() => setSelectedTemplate(t.id)}>
                <div className="flex items-center gap-3 mb-3"><t.icon className="w-8 h-8 text-kranely-accent" /><h3 className="font-medium text-white">{t.name}</h3></div>
                <p className="text-sm text-white/60">Template per {t.name.toLowerCase()}</p>
                <div className="flex items-center gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 border-white/10 bg-white text-black hover:bg-white/90"><Eye className="w-3 h-3 mr-1" />Anteprima</Button>
                  <Button size="sm" className="bg-kranely-accent text-kranely-app-bg">Usa</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-kranely-accent" /> Impostazioni Generali</h3>
              <div className="space-y-4">
                <div><label className="text-sm text-white/60">Formato Pagina</label><select className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1"><option>A4</option><option>Letter</option><option>Legal</option></select></div>
                <div><label className="text-sm text-white/60">Orientamento</label><select className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1"><option>Verticale</option><option>Orizzontale</option></select></div>
                <div><label className="text-sm text-white/60">Margine (mm)</label><Input type="number" defaultValue="20" className="mt-1" /></div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-kranely-accent" /> Logo e Intestazione</h3>
              <div className="space-y-4">
                <div><label className="text-sm text-white/60">URL Logo</label><Input placeholder="https://..." className="mt-1" /></div>
                <div><label className="text-sm text-white/60">Posizione Logo</label><select className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1"><option>Sinistra</option><option>Destra</option><option>Centro</option></select></div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
