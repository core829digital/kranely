"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Label, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import {
  Plus, Search, Eye, Edit2, Trash2, Truck, Mail, Phone, Star,
  Package, FileText, MessageSquare, CalendarDays, ClipboardList,
  Factory, ArrowRight, CheckCircle, XCircle, Clock,
  User, ChevronRight, Send, TruckIcon,
  CreditCard, Euro, Building2, Users, RefreshCcw
} from "lucide-react"

const TABS = [
  { id: "anagrafica", label: "Anagrafica", icon: Building2 },
  { id: "richieste", label: "Richieste", icon: ClipboardList },
  { id: "ordini", label: "Ordini", icon: Package },
  { id: "produzione", label: "Produzione", icon: Factory },
  { id: "consegna", label: "Consegna", icon: Truck },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "calendario", label: "Calendario", icon: CalendarDays },
]

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "default" | "secondary" | "destructive" | "warning" }> = {
  active: { label: "Attivo", variant: "success" },
  pending: { label: "In Attesa", variant: "default" },
  inactive: { label: "Inattivo", variant: "secondary" },
  draft: { label: "Bozza", variant: "secondary" },
  sent: { label: "Inviato", variant: "default" },
  quoted: { label: "Preventivato", variant: "default" },
  accepted: { label: "Accettato", variant: "success" },
  rejected: { label: "Rifiutato", variant: "destructive" },
  confirmed: { label: "Confermato", variant: "success" },
  in_production: { label: "In Produzione", variant: "default" },
  ready: { label: "Pronto", variant: "warning" },
  shipped: { label: "Spedito", variant: "default" },
  delivered: { label: "Consegnato", variant: "success" },
  cancelled: { label: "Annullato", variant: "destructive" },
  partito: { label: "Partito", variant: "default" },
  in_transito: { label: "In Transito", variant: "warning" },
  consegnato: { label: "Consegnato", variant: "success" },
  preventivato: { label: "Preventivato", variant: "default" },
}

const PRODUCTION_PHASES = [
  { key: "materiali_ricevuti", label: "Materiali", icon: Package, order: 1 },
  { key: "taglio", label: "Taglio", icon: RefreshCcw, order: 2 },
  { key: "assemblaggio", label: "Assemblaggio", icon: Factory, order: 3 },
  { key: "controllo_qualita", label: "Controllo Qualità", icon: CheckCircle, order: 4 },
  { key: "pronto", label: "Pronto", icon: Star, order: 5 },
]

const URGENCY_BADGE: Record<string, { label: string; variant: "default" | "destructive" | "warning" | "secondary" }> = {
  low: { label: "Bassa", variant: "secondary" },
  normal: { label: "Normale", variant: "default" },
  medium: { label: "Media", variant: "warning" },
  high: { label: "Alta", variant: "destructive" },
  urgent: { label: "Urgente", variant: "destructive" },
}

function BadgeStatus({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] || { label: status, variant: "secondary" as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export default function SuppliersPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("anagrafica")
  const [selectedSupplierId, setSelectedSupplierId] = useState<Id<"suppliers"> | null>(null)
  const [search, setSearch] = useState("")

  const suppliers = useQuery(api.suppliers.list, orgId ? { organizationId: orgId, search: search || undefined, userEmail: user?.email } : "skip")
  const selectedSupplier = useQuery(api.suppliers.get, selectedSupplierId ? { id: selectedSupplierId, organizationId: orgId! } : "skip")

  if (!orgId || !suppliers) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fornitori</h1>
          <p className="text-white/60 mt-1">{suppliers.length} fornitori trovati</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedSupplierId && (
            <Button variant="outline" onClick={() => setSelectedSupplierId(null)} className="border-white/10 text-sm">
              ← Tutti i fornitori
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "text-kranely-accent border-b-2 border-kranely-accent bg-kranely-accent/5"
                  : "bg-white text-black hover:bg-white/80"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {selectedSupplierId && selectedSupplier && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="w-10 h-10 rounded-full bg-kranely-accent/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-kranely-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{selectedSupplier.companyName}</p>
            <p className="text-xs text-white/40">{selectedSupplier.supplierCode || "Nessun codice"} · {selectedSupplier.email}</p>
          </div>
          <BadgeStatus status={selectedSupplier.status} />
        </div>
      )}

      {activeTab === "anagrafica" && (
        <AnagraficaTab
          orgId={orgId}
          selectedSupplierId={selectedSupplierId}
          setSelectedSupplierId={setSelectedSupplierId}
          userEmail={user?.email}
        />
      )}
      {activeTab === "richieste" && (
        <RichiesteTab orgId={orgId} selectedSupplierId={selectedSupplierId} userEmail={user?.email} />
      )}
      {activeTab === "ordini" && (
        <OrdiniTab orgId={orgId} selectedSupplierId={selectedSupplierId} userEmail={user?.email} />
      )}
      {activeTab === "produzione" && (
        <ProduzioneTab orgId={orgId} selectedSupplierId={selectedSupplierId} userEmail={user?.email} />
      )}
      {activeTab === "consegna" && (
        <ConsegnaTab orgId={orgId} selectedSupplierId={selectedSupplierId} userEmail={user?.email} />
      )}
      {activeTab === "chat" && (
        <ChatTab orgId={orgId} selectedSupplierId={selectedSupplierId} userEmail={user?.email} />
      )}
      {activeTab === "calendario" && (
        <CalendarioTab orgId={orgId} selectedSupplierId={selectedSupplierId} userEmail={user?.email} />
      )}
    </div>
  )
}

function AnagraficaTab({
  orgId,
  selectedSupplierId,
  setSelectedSupplierId,
  userEmail,
}: {
  orgId: Id<"organizations">
  selectedSupplierId: Id<"suppliers"> | null
  setSelectedSupplierId: (id: Id<"suppliers"> | null) => void
  userEmail?: string
}) {
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [editId, setEditId] = useState<Id<"suppliers"> | null>(null)
  const [detailId, setDetailId] = useState<Id<"suppliers"> | null>(null)
  const [form, setForm] = useState({
    companyName: "", email: "", phone: "", contactPerson: "", address: "",
    vatNumber: "", type: "material", status: "pending", rating: "", notes: "",
    supplierCode: "", whatsappLink: "",
  })

  const suppliers = useQuery(api.suppliers.list, { organizationId: orgId, search: search || undefined, type: filterType !== "all" ? filterType : undefined, status: filterStatus !== "all" ? filterStatus : undefined, userEmail })
  const detail = useQuery(api.suppliers.get, detailId ? { id: detailId, organizationId: orgId } : "skip")
  const createSupplier = useMutation(api.suppliers.create)
  const updateSupplier = useMutation(api.suppliers.update)
  const deleteSupplier = useMutation(api.suppliers.remove)

  const resetForm = () => setForm({ companyName: "", email: "", phone: "", contactPerson: "", address: "", vatNumber: "", type: "material", status: "pending", rating: "", notes: "", supplierCode: "", whatsappLink: "" })

  const handleCreate = async () => {
    if (!form.companyName || !form.email) { toast.error("Compila i campi obbligatori"); return }
    try {
      await createSupplier({
        organizationId: orgId, companyName: form.companyName, email: form.email,
        phone: form.phone || undefined, contactPerson: form.contactPerson || undefined,
        address: form.address || undefined, vatNumber: form.vatNumber || undefined,
        type: form.type as any, status: form.status as any,
        supplierCode: form.supplierCode || undefined,
        notes: form.notes || undefined,
      })
      setShowCreate(false); resetForm(); toast.success("Fornitore aggiunto")
    } catch { toast.error("Errore creazione") }
  }

  const handleEdit = async () => {
    if (!editId) return
    try {
      await updateSupplier({ id: editId, organizationId: orgId, companyName: form.companyName, email: form.email, phone: form.phone || undefined, contactPerson: form.contactPerson || undefined, address: form.address || undefined, vatNumber: form.vatNumber || undefined, type: form.type as any, status: form.status as any, rating: form.rating ? parseFloat(form.rating) : undefined, notes: form.notes || undefined })
      setShowEdit(false); toast.success("Fornitore aggiornato")
    } catch { toast.error("Errore aggiornamento") }
  }

  const openEdit = (s: any) => {
    setEditId(s._id)
    setForm({ companyName: s.companyName, email: s.email, phone: s.phone || "", contactPerson: s.contactPerson || "", address: s.address || "", vatNumber: s.vatNumber || "", type: s.type, status: s.status, rating: s.rating?.toString() || "", notes: s.notes || "", supplierCode: s.supplierCode || "", whatsappLink: s.whatsappLink || "" })
    setShowEdit(true)
  }

  const typeLabel = (t: string) => ({ material: "Materiali", equipment: "Attrezzature", service: "Servizi", logistics: "Logistica", subprod: "Sub Fornitura", subeng: "Sub Ingegneria", general: "Generale" })[t] || t

  if (!suppliers) return <div className="text-white/40 text-center py-12">Caricamento...</div>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca..." className="pl-10" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
            <option value="all">Tutti</option><option value="material">Materiali</option><option value="equipment">Attrezzature</option>
            <option value="service">Servizi</option><option value="logistics">Logistica</option><option value="subprod">Sub Fornitura</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
            <option value="all">Tutti stati</option><option value="active">Attivo</option><option value="pending">In Attesa</option><option value="inactive">Inattivo</option>
          </select>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true) }} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">
          <Plus className="w-4 h-4 mr-2" /> Nuovo Fornitore
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Codice</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Fornitore</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden md:table-cell">Contatti</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Account</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {suppliers.map((s) => (
                <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-kranely-accent">{s.supplierCode || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-kranely-accent/10 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-kranely-accent" />
                      </div>
                      <p className="text-sm font-medium text-white">{s.companyName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-white/60"><Mail className="w-3 h-3" />{s.email}</div>
                      {s.phone && <div className="flex items-center gap-1.5 text-xs text-white/60"><Phone className="w-3 h-3" />{s.phone}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Badge variant="secondary">{typeLabel(s.type)}</Badge></td>
                  <td className="px-4 py-3"><BadgeStatus status={s.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {s.userId ? (
                      <Badge variant="success" className="flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Collegato</Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Non collegato</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setDetailId(s._id); setShowDetail(true) }} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setSelectedSupplierId(s._id)} className="p-1.5 rounded bg-white text-black hover:bg-white/80"><ChevronRight className="w-4 h-4" /></button>
                      <button onClick={async () => { if (confirm("Eliminare?")) { try { await deleteSupplier({ id: s._id, organizationId: orgId }); toast.success("Eliminato") } catch { toast.error("Errore") } } }} className="p-1.5 rounded bg-white text-black hover:bg-red-100 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {suppliers.length === 0 && (
          <div className="p-12 text-center text-white/40">
            <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nessun fornitore trovato</p>
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nuovo Fornitore</DialogTitle><DialogDescription>Inserisci i dati del fornitore</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Ragione Sociale *</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Referente</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div><Label>Tipo</Label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="material">Materiali</option><option value="equipment">Attrezzature</option><option value="service">Servizi</option><option value="logistics">Logistica</option><option value="subprod">Sub Fornitura</option></select></div>
            <div><Label>Codice Fornitore</Label><Input value={form.supplierCode} onChange={(e) => setForm({ ...form, supplierCode: e.target.value })} placeholder="FRN-001" /></div>
            <div><Label>P.IVA</Label><Input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} /></div>
            <div><Label>Indirizzo</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Crea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Modifica Fornitore</DialogTitle><DialogDescription>Aggiorna i dati del fornitore</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2"><Label>Ragione Sociale</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Stato</Label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="active">Attivo</option><option value="pending">In Attesa</option><option value="inactive">Inattivo</option></select></div>
            <div><Label>Rating</Label><Input type="number" step="0.1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleEdit} className="bg-kranely-accent text-kranely-app-bg">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Dettagli Fornitore</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-kranely-accent/10 flex items-center justify-center"><Truck className="w-6 h-6 text-kranely-accent" /></div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{detail.companyName}</h3>
                  <p className="text-xs text-white/40 font-mono">{detail.supplierCode || "Nessun codice"}</p>
                  <div className="flex gap-2 mt-1">
                    <BadgeStatus status={detail.status} />
                    <Badge variant="secondary">{typeLabel(detail.type)}</Badge>
                    {detail.rating && <div className="flex items-center gap-1"><Star className="w-3 h-3 text-kranely-accent fill-kranely-accent" /><span className="text-sm text-white">{detail.rating}</span></div>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40">Email</span><p className="text-white">{detail.email}</p></div>
                <div><span className="text-white/40">Telefono</span><p className="text-white">{detail.phone || "-"}</p></div>
                <div><span className="text-white/40">Referente</span><p className="text-white">{detail.contactPerson || "-"}</p></div>
                <div><span className="text-white/40">P.IVA</span><p className="text-white">{detail.vatNumber || "-"}</p></div>
                <div><span className="text-white/40">Indirizzo</span><p className="text-white">{detail.address || "-"}</p></div>
                <div><span className="text-white/40">Account collegato</span><p className="text-white">{detail.userId ? "Sì" : "No"}</p></div>
              </div>
              {detail.notes && <div><span className="text-white/40 text-sm">Note</span><p className="text-sm text-white mt-1">{detail.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RichiesteTab({ orgId, selectedSupplierId, userEmail }: { orgId: Id<"organizations">; selectedSupplierId: Id<"suppliers"> | null; userEmail?: string }) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreate, setShowCreate] = useState(false)
  const [showConvert, setShowConvert] = useState<Id<"supplierRequests"> | null>(null)
  const [convertAmount, setConvertAmount] = useState("")
  const [convertDelivery, setConvertDelivery] = useState("")
  const [form, setForm] = useState({ title: "", description: "", quantity: "", urgency: "normal", material: "", notes: "" })

  const requests = useQuery(api.supplierRequests.list, { organizationId: orgId, supplierId: selectedSupplierId || undefined, status: statusFilter !== "all" ? statusFilter : undefined, userEmail })
  const createRequest = useMutation(api.supplierRequests.create)
  const convertToOrder = useMutation(api.supplierRequests.convertToOrder)

  const handleCreate = async () => {
    if (!form.title) { toast.error("Inserisci un titolo"); return }
    try {
      await createRequest({ organizationId: orgId, title: form.title, description: form.description || undefined, quantity: form.quantity ? parseInt(form.quantity) : undefined, urgency: form.urgency as any, material: form.material || undefined, supplierId: selectedSupplierId || undefined })
      setShowCreate(false); setForm({ title: "", description: "", quantity: "", urgency: "normal", material: "", notes: "" }); toast.success("Richiesta creata")
    } catch { toast.error("Errore") }
  }

  const handleConvert = async () => {
    if (!showConvert || !convertAmount) { toast.error("Inserisci l'importo totale"); return }
    try {
      await convertToOrder({ requestId: showConvert, organizationId: orgId, supplierId: selectedSupplierId!, totalAmount: parseFloat(convertAmount), expectedDelivery: convertDelivery || undefined })
      setShowConvert(null); setConvertAmount(""); setConvertDelivery(""); toast.success("Ordine creato!")
    } catch (e: any) { toast.error(e.data || "Errore conversione") }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
            <option value="all">Tutti gli stati</option><option value="draft">Bozza</option><option value="sent">Inviato</option>
            <option value="quoted">Preventivato</option><option value="accepted">Accettato</option><option value="rejected">Rifiutato</option>
          </select>
        </div>
        {selectedSupplierId && (
          <Button onClick={() => setShowCreate(true)} className="bg-kranely-accent text-kranely-app-bg"><Plus className="w-4 h-4 mr-2" /> Nuova Richiesta</Button>
        )}
      </div>

      {!selectedSupplierId ? (
        <div className="p-12 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Seleziona un fornitore per vedere le richieste</p>
        </div>
      ) : !requests ? (
        <div className="text-white/40 text-center py-12">Caricamento...</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">{r.title}</h3>
                    <BadgeStatus status={r.status} />
                    {r.urgency && <Badge variant={URGENCY_BADGE[r.urgency]?.variant || "secondary"}>{URGENCY_BADGE[r.urgency]?.label || r.urgency}</Badge>}
                  </div>
                  {r.description && <p className="text-xs text-white/50 mt-1">{r.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                    {r.quantity && <span>Q.tà: {r.quantity}</span>}
                    {r.material && <span>Materiale: {r.material}</span>}
                    {r.budgetEstimate && <span>Budget: EUR{r.budgetEstimate.toLocaleString("it-IT")}</span>}
                    {r.depositPaid && <Badge variant="success" className="text-[10px]">Acconto pagato ✓</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "accepted" && !r.depositPaid && (
                    <Button size="sm" variant="outline" className="border-kranely-accent/30 text-kranely-accent text-xs"
                      onClick={() => { setShowConvert(r._id); setConvertAmount(r.quotedPrice?.toString() || ""); }}>
                        <CreditCard className="w-3 h-3 mr-1" /> Converti in Ordine
                    </Button>
                  )}
                  {r.status === "accepted" && r.depositPaid && !r.conversionOrderId && (
                    <Button size="sm" className="bg-kranely-accent text-kranely-app-bg text-xs"
                      onClick={() => { setShowConvert(r._id); setConvertAmount(r.quotedPrice?.toString() || ""); }}>
                        <Package className="w-3 h-3 mr-1" /> Genera Ordine
                    </Button>
                  )}
                  {r.conversionOrderId && <Badge variant="success">Ordine creato</Badge>}
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 && <div className="p-8 text-center text-white/40"><p>Nessuna richiesta trovata</p></div>}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuova Richiesta</DialogTitle><DialogDescription>Inserisci i dettagli della richiesta per il fornitore</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Titolo *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Descrizione</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantità</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><Label>Urgenza</Label><select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="low">Bassa</option><option value="normal">Normale</option><option value="medium">Media</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></div>
            </div>
            <div><Label>Materiale</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Crea Richiesta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showConvert} onOpenChange={(o) => { if (!o) setShowConvert(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Converti in Ordine</DialogTitle><DialogDescription>Conferma l'importo totale e la data di consegna prevista</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Importo Totale Ordine (EUR) *</Label><Input type="number" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} /></div>
            <div><Label>Data Consegna Prevista</Label><Input type="date" value={convertDelivery} onChange={(e) => setConvertDelivery(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvert(null)} className="border-white/10">Annulla</Button>
            <Button onClick={handleConvert} className="bg-kranely-accent text-kranely-app-bg"><Package className="w-4 h-4 mr-2" /> Crea Ordine</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrdiniTab({ orgId, selectedSupplierId, userEmail }: { orgId: Id<"organizations">; selectedSupplierId: Id<"suppliers"> | null; userEmail?: string }) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [showEditPricing, setShowEditPricing] = useState<Id<"supplierOrders"> | null>(null)
  const [pricingAmount, setPricingAmount] = useState("")

  const orders = useQuery(api.supplierOrders.list, { organizationId: orgId, supplierId: selectedSupplierId || undefined, status: statusFilter !== "all" ? statusFilter : undefined, userEmail })
  const updateOrder = useMutation(api.supplierOrders.update)

  const handleUpdatePricing = async () => {
    if (!showEditPricing || !pricingAmount) return
    try {
      await updateOrder({ id: showEditPricing, organizationId: orgId, userEmail, totalAmount: parseFloat(pricingAmount) })
      setShowEditPricing(null); toast.success("Prezzo aggiornato")
    } catch { toast.error("Errore") }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
          <option value="all">Tutti gli ordini</option><option value="pending">In attesa</option><option value="confirmed">Confermato</option>
          <option value="in_production">In Produzione</option><option value="shipped">Spedito</option><option value="delivered">Consegnato</option>
        </select>
      </div>

      {!selectedSupplierId ? (
        <div className="p-12 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Seleziona un fornitore per vedere gli ordini</p>
        </div>
      ) : !orders ? (
        <div className="text-white/40 text-center py-12">Caricamento...</div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">ID Ordine</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Descrizione</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden md:table-cell">Importo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase hidden lg:table-cell">Consegna</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-kranely-accent">{o.orderNumber || o._id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{o.description || "-"}</p>
                    {o.cantiereId && <p className="text-xs text-white/40">Cantiere collegato</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm font-medium text-kranely-accent">EUR {o.totalAmount?.toLocaleString("it-IT") || 0}</span>
                  </td>
                  <td className="px-4 py-3"><BadgeStatus status={o.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-white/60">{o.expectedDelivery || "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setShowEditPricing(o._id); setPricingAmount(o.totalAmount?.toString() || "") }} className="p-1.5 rounded bg-white text-black hover:bg-white/80" title="Modifica prezzo">
                      <Euro className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <div className="p-8 text-center text-white/40"><p>Nessun ordine</p></div>}
        </div>
      )}

      <Dialog open={!!showEditPricing} onOpenChange={(o) => { if (!o) setShowEditPricing(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configura Prezzo Ordine</DialogTitle><DialogDescription>Modifica l'importo totale dell'ordine</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Importo Totale (EUR)</Label><Input type="number" value={pricingAmount} onChange={(e) => setPricingAmount(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPricing(null)} className="border-white/10">Annulla</Button>
            <Button onClick={handleUpdatePricing} className="bg-kranely-accent text-kranely-app-bg">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProduzioneTab({ orgId, selectedSupplierId, userEmail }: { orgId: Id<"organizations">; selectedSupplierId: Id<"suppliers"> | null; userEmail?: string }) {
  const [selectedOrderId, setSelectedOrderId] = useState<Id<"supplierOrders"> | null>(null)
  const [adminEmail] = useState(() => { if (typeof window !== "undefined") return localStorage.getItem("kranely_user_email") || ""; return "" })

  const orders = useQuery(api.supplierOrders.list, { organizationId: orgId, supplierId: selectedSupplierId || undefined, userEmail })
  const production = useQuery(api.supplierProduction.list, { organizationId: orgId, supplierId: selectedSupplierId || undefined, orderId: selectedOrderId || undefined, userEmail })

  const updateProduction = useMutation(api.supplierProduction.update)
  const createProduction = useMutation(api.supplierProduction.create)
  const updateOrder = useMutation(api.supplierOrders.update)

  const handleAdvancePhase = async (prodId: Id<"supplierProduction">, currentPhase: string | undefined) => {
    const phases = ["materiali_ricevuti", "taglio", "assemblaggio", "controllo_qualita", "pronto"]
    const currentIdx = phases.indexOf(currentPhase || "")
    const nextPhase = phases[currentIdx + 1]
    if (!nextPhase) { toast.success("Produzione già completata!"); return }

    try {
      await updateProduction({
        id: prodId,
        organizationId: orgId!,
        phase: nextPhase as any,
        status: nextPhase === "pronto" ? "completed" : "in_progress",
        progressPercentage: ((currentIdx + 2) / phases.length) * 100,
        userEmail: adminEmail,
      })
      toast.success(`Fase avanzata a: ${PRODUCTION_PHASES.find((p) => p.key === nextPhase)?.label}`)
    } catch (e: any) { toast.error(e.data || "Errore aggiornamento produzione") }
  }

  const handleStartProduction = async (orderId: Id<"supplierOrders">) => {
    if (!selectedSupplierId) return
    try {
      const desc = orders?.find((o) => o._id === orderId)?.description || "Produzione"
      await createProduction({
        organizationId: orgId,
        supplierId: selectedSupplierId,
        orderId,
        description: desc,
        quantity: 1,
        phase: "materiali_ricevuti",
        status: "in_progress",
        startedDate: new Date().toISOString().split("T")[0],
        progressPercentage: 20,
        userEmail,
      })
      await updateOrderStatus(orderId, "in_production")
      toast.success("Produzione avviata!")
    } catch (e: any) { toast.error(e.data || "Errore") }
  }

  const updateOrderStatus = async (id: Id<"supplierOrders">, status: string) => {
    try {
      await updateOrder({ id, organizationId: orgId, userEmail, status: status as any })
    } catch { toast.error("Errore aggiornamento ordine") }
  }

  return (
    <div>
      {!selectedSupplierId ? (
        <div className="p-12 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
          <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Seleziona un fornitore per vedere la produzione</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Label className="text-white/60 text-sm">Filtra per ordine:</Label>
            <select
              value={selectedOrderId || ""}
              onChange={(e) => setSelectedOrderId(e.target.value ? e.target.value as Id<"supplierOrders"> : null)}
              className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white flex-1 max-w-xs"
            >
              <option value="">Tutti gli ordini</option>
              {orders?.filter((o) => o.status === "confirmed" || o.status === "in_production" || o.status === "ready").map((o) => (
                <option key={o._id} value={o._id}>{o.orderNumber || o.description} - EUR {o.totalAmount?.toLocaleString("it-IT") || 0}</option>
              ))}
            </select>
          </div>

          {!orders?.some((o) => o.status === "confirmed" || o.status === "in_production" || o.status === "ready") && !production?.length ? (
            <div className="p-8 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun ordine confermato. Gli ordini appaiono qui dopo la conferma.</p>
            </div>
          ) : null}

          {production && production.length > 0 && (
            <div className="grid gap-4">
              {production.map((prod) => {
                const phaseIdx = PRODUCTION_PHASES.findIndex((p) => p.key === prod.phase)
                return (
                  <div key={prod._id} className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-white">{prod.description}</h3>
                        {prod.estimatedCompletion && <p className="text-xs text-white/40">Fine prevista: {prod.estimatedCompletion}</p>}
                      </div>
                      <Badge variant={prod.status === "completed" ? "success" : "default"}>
                        {prod.progressPercentage ? `${Math.round(prod.progressPercentage)}%` : prod.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {PRODUCTION_PHASES.map((phase, i) => {
                        const isActive = i <= phaseIdx
                        const isCurrent = i === phaseIdx
                        const PhaseIcon = phase.icon
                        return (
                          <div key={phase.key} className="flex items-center gap-2 flex-1">
                            <div className={`flex flex-col items-center gap-1 flex-1`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isCurrent ? "bg-kranely-accent text-kranely-app-bg ring-2 ring-kranely-accent/50" :
                                isActive ? "bg-kranely-accent/20 text-kranely-accent" :
                                "bg-white/5 text-white/30"
                              }`}>
                                <PhaseIcon className="w-5 h-5" />
                              </div>
                              <span className={`text-[10px] text-center leading-tight max-w-[60px] ${
                                isCurrent ? "text-kranely-accent font-medium" :
                                isActive ? "text-white/60" : "text-white/30"
                              }`}>
                                {phase.label}
                              </span>
                            </div>
                            {i < PRODUCTION_PHASES.length - 1 && (
                              <div className={`h-0.5 flex-1 ${i < phaseIdx ? "bg-kranely-accent/50" : "bg-white/10"}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      {prod.phase !== "pronto" && (
                        <Button
                          size="sm"
                          onClick={() => handleAdvancePhase(prod._id, prod.phase)}
                          className="bg-kranely-accent text-kranely-app-bg text-xs"
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Avanza a {PRODUCTION_PHASES[phaseIdx + 1]?.label}
                        </Button>
                      )}
                    </div>
                    {prod.notes && <p className="text-xs text-white/40 mt-2">{prod.notes}</p>}
                  </div>
                )
              })}
            </div>
          )}

          {(orders || []).filter((o) => o.status === "confirmed" && !production?.some((p) => p.orderId === o._id)).map((o) => (
            <div key={o._id} className="p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{o.orderNumber || o.description} — EUR {o.totalAmount?.toLocaleString("it-IT") || 0}</p>
                <p className="text-xs text-white/40">In attesa di avvio produzione</p>
              </div>
              <Button size="sm" onClick={() => handleStartProduction(o._id)} className="bg-kranely-accent text-kranely-app-bg">
                <Factory className="w-3 h-3 mr-1" /> Avvia Produzione
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConsegnaTab({ orgId, selectedSupplierId, userEmail }: { orgId: Id<"organizations">; selectedSupplierId: Id<"suppliers"> | null; userEmail?: string }) {
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [form, setForm] = useState({
    description: "", expectedDate: "", deliveryDate: "", driverName: "", driverPhone: "",
    driverVehicle: "", driverLicensePlate: "", notes: "",
  })

  const deliveries = useQuery(api.supplierDeliveries.list, { organizationId: orgId, supplierId: selectedSupplierId || undefined, status: statusFilter !== "all" ? statusFilter : undefined, userEmail })
  const createDelivery = useMutation(api.supplierDeliveries.create)
  const updateDelivery = useMutation(api.supplierDeliveries.update)

  const handleCreate = async () => {
    if (!form.description || !selectedSupplierId) { toast.error("Compila i campi obbligatori"); return }
    try {
      await createDelivery({
        organizationId: orgId, userEmail, supplierId: selectedSupplierId, description: form.description,
        expectedDate: form.expectedDate || undefined, deliveryDate: form.deliveryDate || undefined,
        driverName: form.driverName || undefined, driverPhone: form.driverPhone || undefined,
        driverVehicle: form.driverVehicle || undefined, driverLicensePlate: form.driverLicensePlate || undefined,
        notes: form.notes || undefined,
      })
      setShowCreate(false); setForm({ description: "", expectedDate: "", deliveryDate: "", driverName: "", driverPhone: "", driverVehicle: "", driverLicensePlate: "", notes: "" })
      toast.success("Consegna programmata")
    } catch { toast.error("Errore") }
  }

  const handleStatusChange = async (id: Id<"supplierDeliveries">, status: string) => {
    try {
      await updateDelivery({ id, organizationId: orgId, userEmail, status: status as any })
      toast.success("Stato aggiornato")
    } catch { toast.error("Errore") }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
            <option value="all">Tutte</option><option value="pending">In attesa</option><option value="partito">Partito</option>
            <option value="in_transito">In Transito</option><option value="consegnato">Consegnato</option>
          </select>
        </div>
        {selectedSupplierId && (
          <Button onClick={() => setShowCreate(true)} className="bg-kranely-accent text-kranely-app-bg"><Plus className="w-4 h-4 mr-2" /> Nuova Consegna</Button>
        )}
      </div>

      {!selectedSupplierId ? (
        <div className="p-12 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
          <TruckIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Seleziona un fornitore per vedere le consegne</p>
        </div>
      ) : !deliveries ? (
        <div className="text-white/40 text-center py-12">Caricamento...</div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((d) => (
            <div key={d._id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">{d.description || "Consegna"}</h3>
                    <BadgeStatus status={d.status} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                    {d.expectedDate && (
                      <div>
                        <span className="text-white/40">Data prevista</span>
                        <p className="text-white mt-0.5">{d.expectedDate}</p>
                      </div>
                    )}
                    {d.deliveryDate && (
                      <div>
                        <span className="text-white/40">Data consegna</span>
                        <p className="text-white mt-0.5">{d.deliveryDate}</p>
                      </div>
                    )}
                    {d.driverName && (
                      <div>
                        <span className="text-white/40">Autista</span>
                        <p className="text-white mt-0.5 flex items-center gap-1"><User className="w-3 h-3" />{d.driverName}</p>
                      </div>
                    )}
                    {d.driverLicensePlate && (
                      <div>
                        <span className="text-white/40">Targa</span>
                        <p className="text-white mt-0.5 font-mono">{d.driverLicensePlate}</p>
                      </div>
                    )}
                    {d.driverVehicle && (
                      <div>
                        <span className="text-white/40">Veicolo</span>
                        <p className="text-white mt-0.5">{d.driverVehicle}</p>
                      </div>
                    )}
                    {d.driverPhone && (
                      <div>
                        <span className="text-white/40">Contatto autista</span>
                        <p className="text-white mt-0.5"><Phone className="w-3 h-3 inline mr-1" />{d.driverPhone}</p>
                      </div>
                    )}
                  </div>
                  {d.notes && <p className="text-xs text-white/40 mt-2">{d.notes}</p>}
                  {d.documents && d.documents.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <FileText className="w-3 h-3 text-kranely-accent" />
                      <span className="text-xs text-white/40">{d.documents.length} documenti</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {d.status === "pending" && (
                    <button onClick={() => handleStatusChange(d._id, "partito")} className="p-1.5 rounded bg-white text-black hover:bg-white/80" title="Segna partito">
                      <Truck className="w-4 h-4" />
                    </button>
                  )}
                  {d.status === "partito" && (
                    <button onClick={() => handleStatusChange(d._id, "in_transito")} className="p-1.5 rounded bg-white text-black hover:bg-white/80" title="In transito">
                      <Clock className="w-4 h-4" />
                    </button>
                  )}
                  {(d.status === "in_transito" || d.status === "partito") && (
                    <button onClick={() => handleStatusChange(d._id, "consegnato")} className="p-1.5 rounded bg-white text-black hover:bg-white/80 hover:text-green-600" title="Consegnato">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {deliveries.length === 0 && <div className="p-8 text-center text-white/40"><p>Nessuna consegna</p></div>}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuova Consegna</DialogTitle><DialogDescription>Inserisci i dettagli della consegna</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Descrizione *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Materiale finestre / Infissi" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data partenza prevista</Label><Input type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} /></div>
              <div><Label>Data consegna</Label><Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} /></div>
            </div>
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Dati Autista</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome Autista</Label><Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} /></div>
                <div><Label>Telefono Autista</Label><Input value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} /></div>
                <div><Label>Veicolo</Label><Input value={form.driverVehicle} onChange={(e) => setForm({ ...form, driverVehicle: e.target.value })} placeholder="Fiat Ducato" /></div>
                <div><Label>Targa</Label><Input value={form.driverLicensePlate} onChange={(e) => setForm({ ...form, driverLicensePlate: e.target.value })} placeholder="AB123CD" /></div>
              </div>
            </div>
            <div><Label>Note</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10">Annulla</Button>
            <Button onClick={handleCreate} className="bg-kranely-accent text-kranely-app-bg">Programma Consegna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
}

function ChatTab({ orgId, selectedSupplierId, userEmail }: { orgId: Id<"organizations">; selectedSupplierId: Id<"suppliers"> | null; userEmail?: string }) {
  const [message, setMessage] = useState("")
  const adminEmail = typeof window !== "undefined" ? localStorage.getItem("kranely_user_email") || "" : ""

  const channels = useQuery(api.chat.listChannels, orgId && userEmail ? { organizationId: orgId, userEmail } : "skip")
  const supplierChannel = channels?.find((ch) =>
    ch.type === "private" && ch.linkedId === selectedSupplierId
  )

  const channelId = supplierChannel?._id as Id<"chatChannels"> | undefined
  const messages = useQuery(api.chat.listMessages, channelId && orgId ? { channelId, organizationId: orgId, userEmail } : "skip")

  const createChannel = useMutation(api.chat.createChannel)
  const sendMessage = useMutation(api.chat.sendMessage)

  const ensureChannel = async () => {
    if (!channelId && selectedSupplierId) {
      const supplier = await (await import("../../../../convex/_generated/api")).default
      try {
        await createChannel({
          organizationId: orgId,
          name: `Fornitore-${selectedSupplierId}`,
          type: "private",
          linkedId: selectedSupplierId,
          members: [adminEmail],
        })
      } catch { toast.error("Errore creazione canale chat") }
    }
  }

  const handleSend = async () => {
    if (!message.trim() || !channelId) return
    try {
      await sendMessage({ organizationId: orgId, channelId, senderEmail: adminEmail, content: message })
      setMessage("")
    } catch { toast.error("Errore invio") }
  }

  return (
    <div>
      {!selectedSupplierId ? (
        <div className="p-12 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Seleziona un fornitore per chattare</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="p-3 border-b border-white/10 bg-white/5">
            <p className="text-sm font-medium text-white">Chat con fornitore</p>
            {!channelId && (
              <Button size="sm" variant="outline" onClick={ensureChannel} className="mt-2 border-white/10 text-xs">
                Avvia chat
              </Button>
            )}
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {!channelId ? (
              <div className="text-center text-white/40 text-sm py-12">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Clicca "Avvia chat" per iniziare</p>
              </div>
            ) : !messages ? (
              <div className="text-center text-white/40 py-12">Caricamento...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-white/40 text-sm py-12">
                <p>Nessun messaggio. Inizia la conversazione!</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m._id} className={`flex ${m.senderEmail === adminEmail ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl ${
                    m.senderEmail === adminEmail ? "bg-kranely-accent/20 text-white" : "bg-white/10 text-white/80"
                  }`}>
                    <p className="text-sm">{m.content}</p>
                    <p className="text-[10px] text-white/40 mt-1">
                      {m.senderEmail === adminEmail ? "Tu" : "Fornitore"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {channelId && (
            <div className="p-3 border-t border-white/10 flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrivi un messaggio..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!message.trim()} className="bg-kranely-accent text-kranely-app-bg">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CalendarioTab({ orgId, selectedSupplierId, userEmail }: { orgId: Id<"organizations">; selectedSupplierId: Id<"suppliers"> | null; userEmail?: string }) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "quarter">("month")
  const [currentDate, setCurrentDate] = useState(new Date())

  const deliveries = useQuery(api.supplierDeliveries.list, { organizationId: orgId, supplierId: selectedSupplierId || undefined, userEmail })

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const filteredDeliveries = (deliveries || []).filter((d) => {
    if (!d.expectedDate && !d.deliveryDate) return false
    const dDate = d.deliveryDate || d.expectedDate || ""
    if (viewMode === "month") return dDate >= monthStart.toISOString().split("T")[0] && dDate <= monthEnd.toISOString().split("T")[0]
    if (viewMode === "week") return dDate >= weekStart.toISOString().split("T")[0] && dDate <= weekEnd.toISOString().split("T")[0]
    if (viewMode === "day") return dDate === currentDate.toISOString().split("T")[0]
    return true
  }).sort((a, b) => ((a.deliveryDate || a.expectedDate) || "").localeCompare((b.deliveryDate || b.expectedDate) || ""))

  const navigate = (dir: number) => {
    const newDate = new Date(currentDate)
    if (viewMode === "day") newDate.setDate(newDate.getDate() + dir)
    else if (viewMode === "week") newDate.setDate(newDate.getDate() + 7 * dir)
    else if (viewMode === "month") newDate.setMonth(newDate.getMonth() + dir)
    else if (viewMode === "quarter") newDate.setMonth(newDate.getMonth() + 3 * dir)
    setCurrentDate(newDate)
  }

  const getDateLabel = () => {
    const opts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }
    if (viewMode === "day") return currentDate.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
    if (viewMode === "week") return `Settimana del ${weekStart.toLocaleDateString("it-IT", { day: "numeric", month: "long" })}`
    if (viewMode === "month") return currentDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
    if (viewMode === "quarter") {
      const q = Math.floor(currentDate.getMonth() / 3) + 1
      return `Q${q} ${currentDate.getFullYear()}`
    }
    return ""
  }

  return (
    <div>
      {!selectedSupplierId ? (
        <div className="p-12 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Seleziona un fornitore per vedere il calendario consegne</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="border-white/10">&larr;</Button>
              <span className="text-sm font-medium text-white capitalize min-w-[180px] text-center">{getDateLabel()}</span>
              <Button variant="outline" size="sm" onClick={() => navigate(1)} className="border-white/10">&rarr;</Button>
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {(["day", "week", "month", "quarter"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    viewMode === mode ? "bg-kranely-accent text-kranely-app-bg" : "text-white/60 hover:text-white"
                  }`}
                >
                  {mode === "day" ? "Giorno" : mode === "week" ? "Settimana" : mode === "month" ? "Mese" : "Trimestre"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
              {filteredDeliveries.length === 0 ? (
                <div className="p-12 text-center text-white/40">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessuna consegna in questo periodo</p>
                </div>
              ) : (
                filteredDeliveries.map((d) => {
                  const date = d.deliveryDate || d.expectedDate || ""
                  return (
                    <div key={d._id} className="p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[48px]">
                          <p className="text-lg font-bold text-kranely-accent">{new Date(date).getDate()}</p>
                          <p className="text-[10px] text-white/40 uppercase">
                            {new Date(date).toLocaleDateString("it-IT", { month: "short" })}
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{d.description || "Consegna"}</p>
                            <BadgeStatus status={d.status} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                            {d.driverName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{d.driverName}</span>}
                            {d.driverLicensePlate && <span className="font-mono">{d.driverLicensePlate}</span>}
                            {d.driverVehicle && <span>{d.driverVehicle}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
