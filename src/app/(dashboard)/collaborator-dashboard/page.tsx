"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Building2, ClipboardList, ShieldCheck, CheckCircle2, Clock, MessageSquare, CalendarDays, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"

export default function CollaboratorDashboardPage() {
  const { user } = useAuth()
  const orgId = useOrgId()

  const collaborators = useQuery(api.collaborators.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const certificates = useQuery(api.certificates.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const appointments = useQuery(api.appointments.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")

  if (!orgId || !user) return <PageSkeleton />

  const myProfile = collaborators?.find((c) => c.email === user.email) || null

  const myCantiereIds = new Set(myProfile?.assignedCantieri || [])
  const myCantieri = cantieri?.filter((c) => myCantiereIds.has(c._id)) || []

  if (myCantieri.length === 0 && myProfile == null) {
    if (user.role === "collaborator") {
      const byName = cantieri?.filter((c) => {
        if (c.managerId === user._id) return true
        if (c.teamAssegnato?.includes(user.fullName || "")) return true
        return false
      }) || []
      myCantieri.push(...byName)
    }
  }

  const myCertificates = certificates?.filter((c) => {
    if (myProfile && c.collaboratorId === myProfile._id) return true
    if (c.createdById === user._id) return true
    return false
  }) || []

  const myAppointments = appointments?.filter((a) => {
    if (myProfile && a.collaboratorId === myProfile._id) return true
    return false
  }) || []

  const inProgress = myCantieri.filter((c) => c.status === "in_corso")
  const planned = myCantieri.filter((c) => c.status === "pianificato")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Collaboratore</h1>
        <p className="text-white/60 mt-1">{user.fullName || user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Cantieri Assegnati</CardTitle>
            <Building2 className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-blue-400">{myCantieri.length}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">In Corso</CardTitle>
            <ClipboardList className="w-4 h-4 text-kranely-accent" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-kranely-accent">{inProgress.length}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Certificati</CardTitle>
            <ShieldCheck className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-400">{myCertificates.length}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Appuntamenti</CardTitle>
            <CalendarDays className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-purple-400">{myAppointments.length}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cantieri" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cantieri"><Building2 className="w-4 h-4 mr-2" />Cantieri</TabsTrigger>
          <TabsTrigger value="certificati"><ShieldCheck className="w-4 h-4 mr-2" />Certificati</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2" />Comunicazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="cantieri">
          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">I Miei Cantieri</h3>
              <Link href="/cantieri"><Button variant="outline" size="sm" className="border-white/10"><Eye className="w-3 h-3 mr-1" />Tutti</Button></Link>
            </div>
            {myCantieri.length === 0 ? (
              <div className="p-8 text-center text-white/40"><Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun cantiere assegnato</p></div>
            ) : (
              <div className="divide-y divide-white/10">
                {myCantieri.map((c) => (
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
                      {c.status === "completato" ? "Completato" : c.status === "in_corso" ? "In Corso" : "Pianificato"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="certificati">
          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Certificati</h3>
              <Link href="/certificates"><Button variant="outline" size="sm" className="border-white/10"><Eye className="w-3 h-3 mr-1" />Vedi</Button></Link>
            </div>
            {myCertificates.length === 0 ? (
              <div className="p-8 text-center text-white/40"><ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun certificato</p></div>
            ) : (
              <div className="divide-y divide-white/10">
                {myCertificates.slice(0, 5).map((c) => (
                  <div key={c._id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{c.name}</p>
                      <p className="text-xs text-white/40">{c.category}</p>
                    </div>
                    <Badge className={
                      c.status === "valido" ? "bg-green-500/20 text-green-400" :
                      c.status === "in_scadenza" ? "bg-yellow-500/20 text-yellow-400" :
                      c.status === "scaduto" ? "bg-red-500/20 text-red-400" :
                      "bg-blue-500/20 text-blue-400"
                    }>
                      {c.status === "valido" ? "Valido" : c.status === "in_scadenza" ? "In Scadenza" : c.status === "scaduto" ? "Scaduto" : "In Rinnovo"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-kranely-accent" />
              <h3 className="text-white font-semibold">Comunicazioni</h3>
            </div>
            <p className="text-white/60 text-sm mb-4">Chat con amministrazione e altri collaboratori</p>
            <Link href="/messages">
              <Button className="bg-kranely-accent text-kranely-app-bg">
                <MessageSquare className="w-4 h-4 mr-2" />Apri Chat
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
