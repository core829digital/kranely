"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Eye, Type, Palette, Save, Printer, File, Loader2, RefreshCw, Settings, Image } from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const TEMPLATE_STYLES: Record<string, { primary: string; font: string }> = {
  preventivo: { primary: "#FFC703", font: "Inter" },
  fattura: { primary: "#1E90FF", font: "Inter" },
  contratto: { primary: "#10B981", font: "Inter" },
  relazione: { primary: "#8B5CF6", font: "Inter" },
}

export default function PdfEditorPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState("Kranely - Preventivo")
  const [selectedTemplate, setSelectedTemplate] = useState("preventivo")
  const [primaryColor, setPrimaryColor] = useState("#FFC703")
  const [footer, setFooter] = useState("Documento valido 30 giorni dalla data di emissione")
  const [clientName, setClientName] = useState("")
  const [exporting, setExporting] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const quotes = useQuery(api.quotes.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const documents = useQuery(api.documents.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")

  const templates = [
    { id: "preventivo", name: "Preventivo", icon: FileText },
    { id: "fattura", name: "Fattura", icon: File },
    { id: "contratto", name: "Contratto", icon: FileText },
    { id: "relazione", name: "Relazione", icon: FileText },
  ]

  const selectedQuote = selectedQuoteId ? quotes?.find((q) => q._id === selectedQuoteId) : null

  const handleSave = () => {
    const config = { templateName, primaryColor, footer, selectedTemplate }
    localStorage.setItem("kranely_pdf_template", JSON.stringify(config))
    toast.success("Template salvato")
  }

  const handleLoad = () => {
    const saved = localStorage.getItem("kranely_pdf_template")
    if (saved) {
      try {
        const config = JSON.parse(saved)
        setTemplateName(config.templateName || "Kranely - Preventivo")
        setPrimaryColor(config.primaryColor || "#FFC703")
        setFooter(config.footer || "Documento valido 30 giorni dalla data di emissione")
        setSelectedTemplate(config.selectedTemplate || "preventivo")
        toast.success("Template caricato")
      } catch { toast.error("Errore caricamento template") }
    } else {
      toast.error("Nessun template salvato")
    }
  }

  const handleExportPdf = useCallback(async () => {
    if (!previewRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      let heightLeft = pdfHeight
      let position = 0
      const pageHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight
      }

      const fileName = `${templateName || "documento"}_${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)
      toast.success("PDF esportato con successo")
    } catch (err) {
      toast.error("Errore esportazione PDF")
      console.error(err)
    } finally {
      setExporting(false)
    }
  }, [templateName])

  const handlePrint = () => {
    const content = document.getElementById("pdf-preview-content")
    if (!content) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>${templateName}</title>
      <style>
        body { font-family: Inter, sans-serif; padding: 40px; color: #000; }
        .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .header h1 { color: ${primaryColor}; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; text-align: left; padding: 8px; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        tfoot td { font-weight: bold; color: ${primaryColor}; }
        .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        @media print { body { margin: 0; padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print();window.close();</script>
      </body></html>
    `)
    win.document.close()
  }

  if (!orgId) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-2xl font-bold text-white">Editor PDF</h1><p className="text-white/60 mt-1">Crea ed esporta preventivi, fatture e contratti in PDF</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-white/10" onClick={handleLoad}>
            <RefreshCw className="w-4 h-4 mr-2" /> Carica Template
          </Button>
          <Button variant="outline" className="border-white/10" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Stampa
          </Button>
          <Button onClick={handleExportPdf} disabled={exporting} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? "Esportazione..." : "Esporta PDF"}
          </Button>
        </div>
      </div>

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
                  <div>
                    <label className="text-xs text-white/40">Nome Template</label>
                    <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Collega Preventivo</label>
                    <select
                      className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1"
                      value={selectedQuoteId || ""}
                      onChange={(e) => {
                        setSelectedQuoteId(e.target.value || null)
                        const q = quotes?.find((q) => q._id === e.target.value)
                        if (q) {
                          setClientName(q.fullName || "")
                          setTemplateName(`${q.title || "Preventivo"} - ${q.fullName || ""}`)
                        }
                      }}
                    >
                      <option value="">Seleziona preventivo...</option>
                      {quotes?.map((q) => (
                        <option key={q._id} value={q._id}>
                          {q.title || `Preventivo #${q._id.slice(-6)}`} — {q.fullName || "N/A"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Intestazione</label>
                    <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Nome Cliente</label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Note a Piè di Pagina</label>
                    <Input value={footer} onChange={(e) => setFooter(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-kranely-accent" /> Stile</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/40">Colore Primario</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
                      <span className="text-sm text-white">{primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Font</label>
                    <select className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1">
                      <option>Inter</option><option>Roboto</option><option>Arial</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1 bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">
                  <Save className="w-4 h-4 mr-2" /> Salva Template
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] min-h-[600px] overflow-auto">
                <div id="pdf-preview-content" ref={previewRef} className="bg-white text-black p-8 rounded-lg min-h-[500px] shadow-lg" style={{ fontFamily: "Inter, sans-serif" }}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{templateName}</h1>
                      <p className="text-gray-500 text-sm">Data: {new Date().toLocaleDateString("it-IT")}</p>
                      <p className="text-gray-500 text-sm">N. {selectedQuote?._id?.slice(-8).toUpperCase() || "---"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{user?.fullName || "Kranely S.r.l."}</p>
                      <p className="text-gray-500 text-sm">{user?.email || "info@kranely.it"}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <h2 className="font-semibold mb-2">Dettagli {selectedTemplate === "fattura" ? "Fattura" : "Preventivo"}</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Cliente:</span> <span className="font-medium">{clientName || selectedQuote?.fullName || "—"}</span></div>
                      {selectedQuote?.email && <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedQuote.email}</span></div>}
                      <div><span className="text-gray-500">Validità:</span> <span className="font-medium">30 giorni</span></div>
                      {selectedQuote?.estimatedPrice && <div><span className="text-gray-500">Importo:</span> <span className="font-medium">EUR {selectedQuote.estimatedPrice.toLocaleString("it-IT")}</span></div>}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2">Descrizione</th>
                        <th className="text-right p-2">Q.tà</th>
                        <th className="text-right p-2">Prezzo</th>
                        <th className="text-right p-2">Totale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuote ? (
                        <tr className="border-b">
                          <td className="p-2">{selectedQuote.title || selectedQuote.description || "Preventivo"}</td>
                          <td className="text-right p-2">1</td>
                          <td className="text-right p-2">EUR {(selectedQuote.estimatedPrice || 0).toLocaleString("it-IT")}</td>
                          <td className="text-right p-2">EUR {(selectedQuote.estimatedPrice || 0).toLocaleString("it-IT")}</td>
                        </tr>
                      ) : (
                        <>
                          <tr className="border-b"><td className="p-2">Installazione infissi PVC</td><td className="text-right p-2">1</td><td className="text-right p-2">EUR 2.500</td><td className="text-right p-2">EUR 2.500</td></tr>
                          <tr className="border-b"><td className="p-2">Posa in opera</td><td className="text-right p-2">1</td><td className="text-right p-2">EUR 800</td><td className="text-right p-2">EUR 800</td></tr>
                        </>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td className="p-2" colSpan={3}>Totale</td>
                        <td className="text-right p-2" style={{ color: primaryColor }}>
                          EUR {(selectedQuote?.estimatedPrice || 3300).toLocaleString("it-IT")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  {selectedQuote?.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                      <span className="text-gray-500 font-medium">Note:</span>
                      <p className="text-gray-700 mt-1">{selectedQuote.notes}</p>
                    </div>
                  )}
                  <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400">
                    <p>{footer}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`p-5 rounded-xl border cursor-pointer transition-colors ${selectedTemplate === t.id ? "border-kranely-accent bg-kranely-accent/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}`}
                onClick={() => {
                  setSelectedTemplate(t.id)
                  setPrimaryColor(TEMPLATE_STYLES[t.id]?.primary || "#FFC703")
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <t.icon className="w-8 h-8 text-kranely-accent" />
                  <h3 className="font-medium text-white">{t.name}</h3>
                </div>
                <p className="text-sm text-white/60">Template per {t.name.toLowerCase()}</p>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant={selectedTemplate === t.id ? "default" : "outline"}
                    className={selectedTemplate === t.id ? "bg-kranely-accent text-kranely-app-bg flex-1" : "flex-1 border-white/10"}
                    onClick={() => {
                      setSelectedTemplate(t.id)
                      setPrimaryColor(TEMPLATE_STYLES[t.id]?.primary || "#FFC703")
                    }}
                  >Usa</Button>
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
                <div>
                  <label className="text-sm text-white/60">Formato Pagina</label>
                  <select className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1"><option>A4</option><option>Letter</option><option>Legal</option></select>
                </div>
                <div>
                  <label className="text-sm text-white/60">Orientamento</label>
                  <select className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1"><option>Verticale</option><option>Orizzontale</option></select>
                </div>
                <div>
                  <label className="text-sm text-white/60">Margine (mm)</label>
                  <Input type="number" defaultValue="20" className="mt-1" />
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-kranely-accent" /> Logo e Intestazione</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60">URL Logo</label>
                  <Input placeholder="https://..." className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-white/60">Posizione Logo</label>
                  <select className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white mt-1"><option>Sinistra</option><option>Destra</option><option>Centro</option></select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
