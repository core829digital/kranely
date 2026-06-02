"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { FileText, Building2, CreditCard, CheckCircle2, Clock, AlertCircle, MessageSquare, Eye, Euro, TrendingUp, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function ClientDashboardPage() {
  const { user } = useAuth()
  const orgId = useOrgId()

  const clientData = useQuery(
    api.clientDashboard.getClientDashboard,
    orgId && user?.email ? { organizationId: orgId, clientEmail: user.email, userEmail: user?.email } : "skip"
  )

  if (!orgId || !user) return <PageSkeleton />

  if (!clientData) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-transparent border border-teal-500/20 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative"><h1 className="text-2xl font-bold text-white">Area Cliente</h1><p className="text-white/60 mt-1">Benvenuto, {user.fullName || user.email}</p></div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h2 className="text-xl font-semibold text-white mb-2">Nessun dato trovato</h2>
          <p className="text-white/60 max-w-md mx-auto">
            Non ci sono ancora dati associati al tuo account. Contatta l&apos;amministrazione per associare la tua email ai tuoi cantieri e preventivi.
          </p>
        </div>
      </div>
    )
  }

  const { client, cantieri, payments, quotes, documents, budget } = clientData

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-transparent border border-teal-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white">Area Cliente</h1><p className="text-white/60 mt-1">Benvenuto, {client.fullName || user.email} — i tuoi cantieri, preventivi e pagamenti</p></div>
          <div className="w-10 h-10 rounded-lg bg-teal-500/15 flex items-center justify-center"><span className="text-lg text-teal-400">◆</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Cantieri Attivi</CardTitle>
            <Building2 className="w-4 h-4 text-teal-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-teal-400">{cantieri.active}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Completati</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-400">{cantieri.completed}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Preventivi</CardTitle>
            <FileText className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-cyan-400">{quotes.total}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Da Pagare</CardTitle>
            <Clock className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-yellow-400">EUR{payments.pending.toLocaleString("it-IT")}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">I Miei Cantieri</h3>
            <Link href="/cantieri"><Button variant="outline" size="sm" className="border-white/10"><Eye className="w-3 h-3 mr-1" />Vedi</Button></Link>
          </div>
          {cantieri.list.length === 0 ? (
            <div className="p-8 text-center text-white/40"><Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun cantiere</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {cantieri.list.slice(0, 5).map((c) => (
                <div key={c._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{c.name}</p>
                    <p className="text-xs text-white/40">{c.address || ""}</p>
                  </div>
                  <Badge className={
                    c.status === "completato" ? "bg-green-500/20 text-green-400" :
                    c.status === "in_corso" ? "bg-blue-500/20 text-blue-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }>
                    {c.status === "completato" ? "Completato" : c.status === "in_corso" ? "In Corso" : c.status === "pianificato" ? "Pianificato" : c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">I Miei Preventivi</h3>
            <Link href="/quotes"><Button variant="outline" size="sm" className="border-white/10"><Eye className="w-3 h-3 mr-1" />Vedi</Button></Link>
          </div>
          {quotes.list.length === 0 ? (
            <div className="p-8 text-center text-white/40"><FileText className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun preventivo</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {quotes.list.slice(0, 5).map((q) => (
                <div key={q._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{q.title || `Preventivo #${q._id.slice(-6)}`}</p>
                    <p className="text-xs text-white/40">{q.estimatedPrice ? `EUR${q.estimatedPrice.toLocaleString("it-IT")}` : ""}</p>
                  </div>
                  <Badge className={
                    q.status === "accepted" ? "bg-green-500/20 text-green-400" :
                    q.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    q.status === "sent" ? "bg-blue-500/20 text-blue-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }>
                    {q.status === "accepted" ? "Approvato" :
                     q.status === "rejected" ? "Rifiutato" :
                     q.status === "sent" ? "Inviato" : "Bozza"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white/[0.02] border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Euro className="w-4 h-4 text-kranely-accent" /> Situazione Pagamenti</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.list.length === 0 ? (
              <p className="text-white/40 text-sm">Nessun pagamento registrato</p>
            ) : (
              <div className="divide-y divide-white/10">
                {payments.list.map((p) => (
                  <div key={p._id} className="py-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white">{p.description}</p>
                      <p className="text-xs text-white/40">{p.dueDate ? `Scadenza: ${p.dueDate}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">EUR{p.amount.toLocaleString("it-IT")}</p>
                      <Badge className={
                        p.status === "pagato" ? "bg-green-500/20 text-green-400 text-[10px]" :
                        p.status === "in_ritardo" ? "bg-red-500/20 text-red-400 text-[10px]" :
                        p.status === "in_verifica" ? "bg-blue-500/20 text-blue-400 text-[10px]" :
                        "bg-yellow-500/20 text-yellow-400 text-[10px]"
                      }>
                        {p.status === "pagato" ? "Pagato" :
                         p.status === "in_attesa" ? "In attesa" :
                         p.status === "in_ritardo" ? "Scaduto" :
                         p.status === "in_verifica" ? "In verifica" : p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/[0.02] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Budget totale</span>
                <span className="text-white font-medium">EUR{budget.total.toLocaleString("it-IT")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Speso</span>
                <span className="text-green-400 font-medium">EUR{budget.spent.toLocaleString("it-IT")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Residuo</span>
                <span className="text-blue-400 font-medium">EUR{budget.remaining.toLocaleString("it-IT")}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${budget.usagePercent > 90 ? "bg-red-500" : budget.usagePercent > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(budget.usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-white/40 text-center">{budget.usagePercent}% del budget utilizzato</p>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center gap-2"><FileText className="w-4 h-4 text-kranely-accent" /> Documenti</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.list.length === 0 ? (
                <p className="text-white/40 text-sm">Nessun documento</p>
              ) : (
                <div className="space-y-2">
                  {documents.list.map((d) => (
                    <div key={d._id} className="flex items-center justify-between p-2 rounded bg-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3 h-3 text-white/40 shrink-0" />
                        <span className="text-sm text-white truncate">{d.title}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-white/10 shrink-0 ml-2">{d.type || "documento"}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {documents.total > 5 && (
                <p className="text-xs text-white/40 mt-2">+{documents.total - 5} altri documenti</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-kranely-accent" />
          <h3 className="text-white font-semibold">Comunicazioni</h3>
        </div>
        <p className="text-white/60 text-sm mb-4">Puoi contattare l&apos;amministrazione per qualsiasi richiesta</p>
        <Link href="/messages">
          <Button className="bg-kranely-accent text-kranely-app-bg">
            <MessageSquare className="w-4 h-4 mr-2" />Apri Chat
          </Button>
        </Link>
      </div>
    </div>
  )
}
