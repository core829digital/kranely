"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Truck, CheckCircle2, Clock, AlertCircle, Package, MessageSquare, Loader2, Navigation, MapPin, FileText, ChevronDown, ChevronRight, Pen, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useQuery } from "convex/react"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { toast } from "sonner"
import SignaturePad from "@/components/SignaturePad"

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
  const [expandedDdt, setExpandedDdt] = useState<Set<string>>(new Set())
  const [signatureDelivery, setSignatureDelivery] = useState<any>(null)
  const [signatureName, setSignatureName] = useState("")
  const [signatureMode, setSignatureMode] = useState<"confirm" | "sign" | "done">("confirm")
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [viewingSignature, setViewingSignature] = useState<string | null>(null)

  const deliveries = useQuery(api.supplierDeliveries.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const updateDelivery = useMutation(api.supplierDeliveries.update)
  const confirmByClient = useMutation(api.supplierDeliveries.confirmByClient)

  if (!orgId || !user) return <PageSkeleton />

  const myDeliveries = deliveries?.filter((d) => d.driverId === user._id) || []

  const pending = myDeliveries.filter((d) => d.status === "pending")
  const inTransit = myDeliveries.filter((d) => d.status === "in_transito" || d.status === "partito")
  const delivered = myDeliveries.filter((d) => d.status === "consegnato")

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    if (currentStatus === "in_transito") {
      const delivery = myDeliveries.find((d) => d._id === id)
      setSignatureDelivery(delivery)
      setSignatureMode("confirm")
      setSignatureName("")
      setSignatureDataUrl(null)
      return
    }
    await doStatusUpdate(id, currentStatus)
  }

  const doStatusUpdate = async (id: string, currentStatus: string, sigData?: { dataUrl: string; name: string }) => {
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return
    setUpdatingId(id)
    try {
      if (sigData) {
        await confirmByClient({
          deliveryId: id as any,
          organizationId: orgId,
          userEmail: user.email,
          signatureDataUrl: sigData.dataUrl,
          signatureName: sigData.name,
        })
      } else {
        const patch: any = { id, organizationId: orgId, status: nextStatus, userEmail: user.email }
        if (nextStatus === "partito") patch.departureDate = new Date().toISOString()
        if (nextStatus === "consegnato") {
          patch.deliveryDate = new Date().toISOString()
          patch.actualDate = new Date().toISOString()
          patch.confirmedArrival = new Date().toISOString()
        }
        await updateDelivery(patch)
      }
      toast.success(`Consegna aggiornata a "${STATUS_LABELS[nextStatus]}"`)
      setSignatureDelivery(null)
    } catch (err: any) {
      toast.error(err.message || "Errore aggiornamento")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl)
    setSignatureMode("done")
  }

  const handleConfirmWithSignature = async () => {
    if (!signatureDelivery || !signatureDataUrl) return
    await doStatusUpdate(signatureDelivery._id, signatureDelivery.status, {
      dataUrl: signatureDataUrl,
      name: signatureName || user.fullName || user.email,
    })
  }

  const toggleDdt = (id: string) => {
    setExpandedDdt((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const DeliveryRow = ({ d }: { d: typeof myDeliveries[0] }) => {
    const Icon = STATUS_ICONS[d.status] || Package
    const nextStatusKey = NEXT_STATUS[d.status]
    const isUpdating = updatingId === d._id
    const isDdtExpanded = expandedDdt.has(d._id)
    const manifest = d.loadManifest as any[] | null | undefined
    const hasDdt = d.ddtNumber || d.loadManifest

    return (
      <div key={d._id}>
        <div className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-kranely-accent" />
              <p className="text-white font-medium">{d.description || "Consegna"}</p>
              {d.status === "consegnato" && d.signatureDataUrl && (
                <button onClick={() => setViewingSignature(d._id)} className="text-green-400 hover:text-green-300" title="Firma presente">
                  <Pen className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-white/40 mt-1">
              {d.expectedDate ? new Date(d.expectedDate).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : ""}
              {d.ddtNumber ? ` · DDT: ${d.ddtNumber}` : ""}
              {d.driverLicensePlate ? ` · Targa: ${d.driverLicensePlate}` : ""}
            </p>
            {d.notes && <p className="text-xs text-white/30 mt-1">{d.notes}</p>}
            {hasDdt && (
              <button
                onClick={() => toggleDdt(d._id)}
                className="flex items-center gap-1 text-xs text-kranely-accent hover:underline mt-1"
              >
                {isDdtExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <FileText className="w-3 h-3" /> Dettagli DDT
              </button>
            )}
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
        {isDdtExpanded && hasDdt && (
          <div className="mx-4 mb-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {d.ddtNumber && (
                <>
                  <span className="text-white/40">DDT N.</span>
                  <span className="text-white text-right">{d.ddtNumber}</span>
                </>
              )}
              {d.ddtDate && (
                <>
                  <span className="text-white/40">Data DDT</span>
                  <span className="text-white text-right">{d.ddtDate}</span>
                </>
              )}
              {d.supplierId && (
                <>
                  <span className="text-white/40">Fornitore</span>
                  <span className="text-white text-right">{d.driverName || "—"}</span>
                </>
              )}
            </div>
            {manifest && manifest.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-xs text-white/50 mb-1 font-medium">Merci trasportate:</p>
                {manifest.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-0.5">
                    <span className="text-white/70">{item.description || item.name || `Articolo ${i + 1}`}</span>
                    <span className="text-white/50">{item.quantity || ""}{item.unit ? ` ${item.unit}` : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

      <Dialog open={!!signatureDelivery && signatureMode === "confirm"} onOpenChange={(open) => !open && setSignatureDelivery(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conferma Consegna</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-white/80">Stai per confermare la consegna di:</p>
            <p className="text-white font-medium">{signatureDelivery?.description || "Consegna"}</p>
            <p className="text-sm text-white/60">Il cliente o destinatario deve firmare per ricevuta.</p>
            <div>
              <label className="text-xs text-white/40 block mb-1">Nome del firmatario</label>
              <Input
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Nome e cognome"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureDelivery(null)} className="border-white/10">Annulla</Button>
            <Button onClick={() => setSignatureMode("sign")} className="bg-kranely-accent text-kranely-app-bg">
              <Pen className="w-4 h-4 mr-2" />Acquisisci Firma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={signatureMode === "sign"} onOpenChange={() => setSignatureMode("confirm")}>
        <DialogContent>
          <DialogHeader><DialogTitle>Firma Digitale</DialogTitle></DialogHeader>
          <div className="py-4">
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setSignatureMode("confirm")}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={signatureMode === "done"} onOpenChange={() => setSignatureMode("done")}>
        <DialogContent>
          <DialogHeader><DialogTitle>Riepilogo Consegna</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-400 mb-2" />
              <p className="text-green-400 font-medium">Firma acquisita con successo</p>
            </div>
            {signatureDataUrl && (
              <div>
                <p className="text-xs text-white/40 mb-1">Firma:</p>
                <img src={signatureDataUrl} alt="Firma" className="w-full max-h-[100px] rounded border border-white/10 bg-black/40" />
              </div>
            )}
            <p className="text-sm text-white/60">Confermare la consegna con la firma acquisita?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureMode("sign")} className="border-white/10">
              Rifirma
            </Button>
            <Button onClick={handleConfirmWithSignature} className="bg-green-600 hover:bg-green-700 text-white" disabled={updatingId !== null}>
              {updatingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Conferma e Archivia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingSignature} onOpenChange={() => setViewingSignature(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Firma di Consegna</DialogTitle></DialogHeader>
          {viewingSignature && (() => {
            const delivery = myDeliveries.find((d) => d._id === viewingSignature)
            if (!delivery) return null
            return (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs text-white/40">Consegna</span><p className="text-white">{delivery.description}</p></div>
                  <div><span className="text-xs text-white/40">Firmato da</span><p className="text-white">{delivery.signatureName || "—"}</p></div>
                  <div><span className="text-xs text-white/40">Data</span><p className="text-white">{delivery.signatureDate ? new Date(delivery.signatureDate).toLocaleDateString("it-IT") : "—"}</p></div>
                  <div><span className="text-xs text-white/40">Confermato da</span><p className="text-white">{delivery.confirmedArrival || "—"}</p></div>
                </div>
                {delivery.signatureDataUrl && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">Firma:</p>
                    <img src={delivery.signatureDataUrl} alt="Firma" className="w-full max-h-[150px] rounded border border-white/10 bg-black/40" />
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}