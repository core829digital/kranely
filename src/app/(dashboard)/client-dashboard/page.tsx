"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { FileText, Building2, CreditCard, CheckCircle2, Clock, AlertCircle, MessageSquare, Eye } from "lucide-react"
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

  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId } : "skip")
  const quotes = useQuery(api.quotes.list, orgId ? { organizationId: orgId } : "skip")

  if (!orgId || !user) return <PageSkeleton />

  const myClient = clients?.find((c) => c.email === user.email) || null

  const myCantieri = cantieri?.filter((c) => myClient && c.clientId === myClient._id) || []
  const myQuotes = quotes?.filter((q) => myClient && q.clientId === myClient._id) || []

  const activeCantieri = myCantieri.filter((c) => c.status === "in_corso")
  const completedCantieri = myCantieri.filter((c) => c.status === "completato")
  const pendingQuotes = myQuotes.filter((q) => q.status === "draft" || q.status === "sent")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Area Cliente</h1>
        <p className="text-white/60 mt-1">Benvenuto, {user.fullName || user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Cantieri Attivi</CardTitle>
            <Building2 className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-blue-400">{activeCantieri.length}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Completati</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-400">{completedCantieri.length}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Preventivi</CardTitle>
            <FileText className="w-4 h-4 text-kranely-accent" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-kranely-accent">{myQuotes.length}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">In Attesa</CardTitle>
            <Clock className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-yellow-400">{pendingQuotes.length}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">I Miei Cantieri</h3>
            <Link href="/cantieri"><Button variant="outline" size="sm" className="border-white/10"><Eye className="w-3 h-3 mr-1" />Vedi</Button></Link>
          </div>
          {myCantieri.length === 0 ? (
            <div className="p-8 text-center text-white/40"><Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun cantiere</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {myCantieri.slice(0, 5).map((c) => (
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
          {myQuotes.length === 0 ? (
            <div className="p-8 text-center text-white/40"><FileText className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun preventivo</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {myQuotes.slice(0, 5).map((q) => (
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
