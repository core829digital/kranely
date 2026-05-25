"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, FileText, Download, Eye, Calendar, User, Building2, Lock, Clock, CheckCircle2 } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { Doc } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/auth-context"

const statusColors: Record<string, string> = {
  draft: "text-white/40", sent: "text-kranely-accent", accepted: "text-green-400",
  rejected: "text-red-400", in_lavorazione: "text-blue-400", completato: "text-green-400",
}

export default function PrivateAreaPage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const [search, setSearch] = useState("")
  const [selectedQuote, setSelectedQuote] = useState<Doc<"quotes"> | null>(null)

  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId } : "skip")
  const allQuotes = useQuery(api.quotes.list, orgId ? { organizationId: orgId } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId } : "skip")
  const documents = useQuery(api.documents.list, orgId ? { organizationId: orgId } : "skip")
  const payments = useQuery(api.payments.list, orgId ? { organizationId: orgId } : "skip")

  const isAdmin = user?.role === "admin" || user?.role === "superadmin"
  const myClient = clients?.find((c) => c.email === user?.email)
  const clientId = myClient?._id

  const quotes = isAdmin ? allQuotes : allQuotes?.filter((q) => clientId && q.clientId === clientId)
  const myCantieri = isAdmin ? cantieri : cantieri?.filter((c) => clientId && c.clientId === clientId)
  const myDocs = isAdmin ? documents : documents?.filter((d) => clientId && d.clientId === clientId)
  const myPayments = isAdmin ? payments : payments?.filter((p) => clientId && p.clientId === clientId)

  const filteredQuotes = (quotes || [])?.filter((q) => {
    if (!search) return true; const s = search.toLowerCase()
    return (q.title || "").toLowerCase().includes(s) || (q.fullName || "").toLowerCase().includes(s) || (q.email || "").toLowerCase().includes(s)
  })

  const filteredDocs = (myDocs || [])?.filter((d) => {
    if (!search) return true; return (d.title || d.name || "").toLowerCase().includes(search.toLowerCase())
  })

  if (!orgId || !allQuotes) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Area Riservata</h1><p className="text-white/60 mt-1">Documenti e preventivi condivisi con il cliente</p></div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca..." className="pl-10" /></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-kranely-accent" /><span className="text-sm text-white/60">Preventivi</span></div><p className="text-xl font-bold text-kranely-accent">{quotes?.length || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-green-400" /><span className="text-sm text-white/60">Cantieri</span></div><p className="text-xl font-bold text-green-400">{myCantieri?.length || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-blue-400" /><span className="text-sm text-white/60">Documenti</span></div><p className="text-xl font-bold text-blue-400">{myDocs?.length || 0}</p></div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"><div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-purple-400" /><span className="text-sm text-white/60">Pagamenti</span></div><p className="text-xl font-bold text-purple-400">{myPayments?.length || 0}</p></div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-kranely-accent" /> Preventivi</h2>
        <div className="space-y-3">
          {filteredQuotes.map((quote) => (
            <div key={quote._id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]" onClick={() => setSelectedQuote(quote)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-medium text-white">{quote.title || "Preventivo"}</h3><span className={`text-xs font-medium ${statusColors[quote.status] || "text-white/40"}`}>{quote.status}</span></div>
                  {quote.fullName && <p className="text-sm text-white/60 mt-1">{quote.fullName}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                    {quote.estimatedPrice && <span>Importo: EUR{quote.estimatedPrice.toLocaleString("it-IT")}</span>}
                    {quote.clientId && <span>Cliente: <Link href="/clients" className="text-kranely-accent hover:underline">Vai</Link></span>}
                    {quote.cantiereId && <span>Cantiere: <Link href="/cantieri" className="text-kranely-accent hover:underline">Vai</Link></span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={quote.status === "accepted" ? "success" : quote.status === "rejected" ? "destructive" : "secondary"}>{quote.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-400" /> Documenti Condivisi</h2>
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div key={doc._id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-400" /></div>
                  <div><h3 className="text-sm font-medium text-white">{doc.title || doc.fileName || "Documento"}</h3><p className="text-xs text-white/40">{doc.type || ""} - {new Date(doc._creationTime).toLocaleDateString("it-IT")}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.entityType && <Badge variant="secondary">{doc.entityType}</Badge>}
                  <Button size="sm" variant="outline" className="border-white/10 bg-white text-black hover:bg-white/90" title="Scarica" aria-label="Scarica"><Download className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredQuotes.length === 0 && filteredDocs.length === 0 && <div className="p-12 text-center text-white/40"><Lock className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun contenuto condiviso</p></div>}

      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selectedQuote?.title || "Preventivo"}</DialogTitle></DialogHeader>
          {selectedQuote && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-white/40">Stato</span><p className="text-white capitalize">{selectedQuote.status}</p></div>
                <div><span className="text-xs text-white/40">Tipo</span><p className="text-white">{selectedQuote.quoteType}</p></div>
                {selectedQuote.estimatedPrice && <div><span className="text-xs text-white/40">Importo</span><p className="text-kranely-accent font-semibold">EUR{selectedQuote.estimatedPrice.toLocaleString("it-IT")}</p></div>}
                {selectedQuote.fullName && <div><span className="text-xs text-white/40">Cliente</span><p className="text-white">{selectedQuote.fullName}</p></div>}
                {selectedQuote.email && <div><span className="text-xs text-white/40">Email</span><p className="text-white">{selectedQuote.email}</p></div>}
                {selectedQuote.phone && <div><span className="text-xs text-white/40">Telefono</span><p className="text-white">{selectedQuote.phone}</p></div>}
              </div>
              {selectedQuote.notes && <div><span className="text-xs text-white/40">Note</span><p className="text-white/80 mt-1">{selectedQuote.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
