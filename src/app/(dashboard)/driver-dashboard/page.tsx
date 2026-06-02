"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Truck, CheckCircle2, Clock, AlertCircle, Package, MessageSquare, Loader2, Navigation, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "convex/react"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { toast } from "sonner"

const NEXT_STATUS: Record<string, string> = {
  pending: "partito",
  partito: "in_transito",
  in_transito: "consegnato",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Partenza",
  partito: "In Transito",
  in_transito: "Consegna",
  consegnato: "Consegnato",
}

const STATUS_ICONS: Record<string, typeof Truck> = {
  pending: Package,
  partito: Navigation,
  in_transito: MapPin,
  consegnato: CheckCircle2,
}

export default function DriverDashboardPage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const deliveries = useQuery(api.supplierDeliveries.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const updateDelivery = useMutation(api.supplierDeliveries.update)

  if (!orgId || !user) return <PageSkeleton />

  const myDeliveries = deliveries?.filter((d) => d.driverId === user._id) || []

  const pending = myDeliveries.filter((d) => d.status === "pending")
  const inTransit = myDeliveries.filter((d) => d.status === "in_transito" || d.status === "partito")
  const delivered = myDeliveries.filter((d) => d.status === "consegnato")

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return
    setUpdatingId(id)
    try {
      const patch: any = { id, organizationId: orgId, status: nextStatus, userEmail: user.email }
      if (nextStatus === "partito") patch.departureDate = new Date().toISOString()
      if (nextStatus === "consegnato") {
        patch.deliveryDate = new Date().toISOString()
        patch.actualDate = new Date().toISOString()
        patch.confirmedArrival = new Date().toISOString()
      }
      await updateDelivery(patch)
      toast.success(`Consegna aggiornata a "${STATUS_LABELS[nextStatus]}"`)
    } catch (err: any) {
      toast.error(err.message || "Errore aggiornamento")
    } finally {
      setUpdatingId(null)
    }
  }

  const DeliveryRow = ({ d }: { d: typeof myDeliveries[0] }) => {
    const Icon = STATUS_ICONS[d.status] || Package
    const nextStatusKey = NEXT_STATUS[d.status]
    const isUpdating = updatingId === d._id

    return (
      <div key={d._id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-kranely-accent" />
            <p className="text-white font-medium">{d.description || "Consegna"}</p>
          </div>
          <p className="text-xs text-white/40 mt-1">
            {d.expectedDate ? new Date(d.expectedDate).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : ""}
            {d.cantiereId ? " · Cantiere" : ""}
            {d.driverLicensePlate ? ` · Targa: ${d.driverLicensePlate}` : ""}
          </p>
          {d.notes && <p className="text-xs text-white/30 mt-1">{d.notes}</p>}
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <Badge className={
            d.status === "consegnato" ? "bg-green-500/20 text-green-400" :
            d.status === "in_transito" ? "bg-blue-500/20 text-blue-400" :
            d.status === "partito" ? "bg-cyan-500/20 text-cyan-400" :
            "bg-yellow-500/20 text-yellow-400"
          }>
            {d.status === "consegnato" ? "Consegnato" :
             d.status === "in_transito" ? "In Transito" :
             d.status === "partito" ? "Partito" : "Pianificato"}
          </Badge>
          {nextStatusKey && (
            <Button
              size="sm"
              variant="ghost"
              className="bg-white text-black hover:bg-white/80 h-8 px-3 text-xs"
              disabled={isUpdating}
              onClick={() => handleStatusUpdate(d._id, d.status)}
            >
              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : STATUS_LABELS[nextStatusKey]}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent border border-orange-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white">Dashboard Autista</h1><p className="text-white/60 mt-1">{user.fullName || user.email} — consegne da gestire</p></div>
          <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center"><span className="text-lg text-orange-400">◆</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Da Ritirare</CardTitle>
            <Package className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-yellow-400">{pending.length}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">In Transito</CardTitle>
            <Truck className="w-4 h-4 text-orange-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-orange-400">{inTransit.length}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Consegnate</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-400">{delivered.length}</p></CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white/60">Totale</CardTitle>
            <Truck className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-amber-400">{myDeliveries.length}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="consegne">
        <TabsList>
          <TabsTrigger value="consegne"><Truck className="w-4 h-4 mr-2" />Consegne</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2" />Comunicazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="consegne" className="mt-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Le Mie Consegne</h3>
            </div>
            {myDeliveries.length === 0 ? (
              <div className="p-8 text-center text-white/40"><Truck className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessuna consegna assegnata</p></div>
            ) : (
              <div className="divide-y divide-white/10">
                {myDeliveries.map((d) => <DeliveryRow key={d._id} d={d} />)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-kranely-accent" />
              <h3 className="text-white font-semibold">Comunicazioni</h3>
            </div>
            <p className="text-white/60 text-sm mb-4">Chat con l&apos;amministrazione</p>
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
