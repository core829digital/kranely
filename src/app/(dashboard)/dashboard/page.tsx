"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Users, FileText, Building2, CreditCard, ArrowUpRight, ArrowDownRight, Plus, Clock, CheckCircle2, AlertCircle, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import Link from "next/link"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { toast } from "sonner"

const COLORS = ["#FFC703", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"]

interface TooltipPayloadEntry { color: string; name: string; value: number | string }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#2a2826] border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-white/80 font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === "number" ? `EUR${entry.value.toLocaleString("it-IT")}` : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user } = useAuth()
  const orgId = useOrgId()

  const overview = useQuery(api.dashboard.overview, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const revenueTrend = useQuery(api.dashboard.revenueTrend, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const clientDistribution = useQuery(api.dashboard.clientDistribution, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const cantiereStatus = useQuery(api.dashboard.cantiereStatus, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const quoteStatus = useQuery(api.dashboard.quoteStatus, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const recentActivity = useQuery(api.dashboard.recentActivity, orgId ? { organizationId: orgId, limit: 10, userEmail: user?.email } : "skip")

  const hasError = useRef(false)

  useEffect(() => {
    if (orgId && overview === undefined && !hasError.current) {
      const timeout = setTimeout(() => {
        if (overview === undefined && !hasError.current) {
          hasError.current = true
          toast.error("Errore nel caricamento")
        }
      }, 15000)
      return () => clearTimeout(timeout)
    }
  }, [orgId, overview])

  if (!orgId || !overview) return <PageSkeleton />

  const stats = [
    { label: "Clienti Totali", value: overview.clients.total.toString(), change: `${overview.clients.active > 0 ? "+" : ""}${overview.clients.active}`, trend: overview.clients.active > overview.clients.leads ? "up" : "down", icon: Users, href: "/clients" },
    { label: "Preventivi", value: overview.quotes.total.toString(), change: `${overview.quotes.accepted} accettati`, trend: overview.quotes.accepted > overview.quotes.pending ? "up" : "down", icon: FileText, href: "/quotes" },
    { label: "Cantieri Attivi", value: overview.cantieri.inCorso.toString(), change: `${overview.cantieri.completati} completati`, trend: overview.cantieri.inCorso > 0 ? "up" : "down", icon: Building2, href: "/cantieri" },
    { label: "Pagamenti in Attesa", value: `EUR${overview.payments.pending.toLocaleString("it-IT")}`, change: overview.payments.overdue > 0 ? `EUR${overview.payments.overdue.toLocaleString("it-IT")} scaduti` : "Nessun scaduto", trend: overview.payments.overdue > 0 ? "down" : "up", icon: CreditCard, href: "/payments" },
  ]

  let revenueChartData: { month: string; revenue: number; expenses: number }[] = []
  let quoteChartData: { name: string; value: number; color: string }[] = []

  try {
    revenueChartData = revenueTrend?.map((item) => ({ month: item.month, revenue: item.incoming, expenses: item.outgoing })) || []
  } catch {
    toast.error("Errore nel caricamento")
  }

  try {
    quoteChartData = quoteStatus?.map((item, i) => ({ name: item.name, value: item.value, color: COLORS[i % COLORS.length] })) || []
  } catch {
    toast.error("Errore nel caricamento")
  }

  const activityIcons: Record<string, React.ReactNode> = {
    quote: <FileText className="w-3.5 h-3.5 text-blue-400" />,
    payment: <CreditCard className="w-3.5 h-3.5 text-green-400" />,
    cantiere: <Building2 className="w-3.5 h-3.5 text-kranely-accent" />,
    supplier: <Truck className="w-3.5 h-3.5 text-purple-400" />,
    client: <Users className="w-3.5 h-3.5 text-cyan-400" />,
    certificate: <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />,
    delivery: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
    collaborator: <Clock className="w-3.5 h-3.5 text-orange-400" />,
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000; const diff = now - timestamp
    if (diff < 60) return "Adesso"; if (diff < 3600) return `${Math.floor(diff / 60)} min fa`; if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`; return `${Math.floor(diff / 86400)} giorni fa`
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl md:text-3xl font-bold text-white">Bentornato, {user?.fullName?.split(" ")[0] || "Utente"}</h1><p className="text-white/60 mt-1">
          {user?.role === "client" ? "Ecco i tuoi cantieri e pagamenti" :
           user?.role === "supplier" ? "Ecco lo stato dei tuoi ordini" :
           "Ecco un riepilogo della tua attivita"}
        </p></div>
        <Badge variant="success" className="text-xs"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" /> Online</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.label}>
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-kranely-accent/5 group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-kranely-accent/10 flex items-center justify-center group-hover:bg-kranely-accent/20 transition-colors"><stat.icon className="w-5 h-5 text-kranely-accent" /></div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === "up" ? "text-green-400" : "text-red-400"}`}>{stat.change}{stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}</div>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/60 mt-1">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-lg font-semibold text-white">Andamento Ricavi</h2><p className="text-sm text-white/40">Ultimi 12 mesi</p></div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-kranely-accent" /><span className="text-white/60">Ricavi</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white/30" /><span className="text-white/60">Spese</span></div>
            </div>
          </div>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFC703" stopOpacity={0.3} /><stop offset="95%" stopColor="#FFC703" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#535252" stopOpacity={0.3} /><stop offset="95%" stopColor="#535252" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(v) => `EUR${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Ricavi" stroke="#FFC703" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={2000} animationBegin={200} />
                <Area type="monotone" dataKey="expenses" name="Spese" stroke="#535252" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" animationDuration={2000} animationBegin={400} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[280px] text-white/40">Nessun dato disponibile</div>}
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-2">Stato Preventivi</h2>
          <p className="text-sm text-white/40 mb-4">Distribuzione attuale</p>
          {quoteChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={quoteChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" animationDuration={1500} animationBegin={300}>{quoteChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip content={<CustomTooltip />} /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">{quoteChartData.map((item) => (<div key={item.name} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-white/60">{item.name}</span></div><span className="text-white font-medium">{item.value}</span></div>))}</div>
            </>
          ) : <div className="flex items-center justify-center h-[200px] text-white/40">Nessun preventivo</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-2">Distribuzione Clienti</h2>
          <p className="text-sm text-white/40 mb-4">B2B vs B2C</p>
          {clientDistribution && clientDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={clientDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" animationDuration={1500}>{clientDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip content={<CustomTooltip />} /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">{clientDistribution.map((item, i) => (<div key={item.name} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} /><span className="text-white/60">{item.name}</span></div><span className="text-white font-medium">{item.value}</span></div>))}</div>
            </>
          ) : <div className="flex items-center justify-center h-[220px] text-white/40">Nessun cliente</div>}
        </div>

        <div className="lg:col-span-2 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-lg font-semibold text-white">Stato Cantieri</h2><p className="text-sm text-white/40">Panoramica cantieri</p></div>
            <Link href="/cantieri"><Button variant="outline" size="sm" className="border-white/20">Vedi tutti</Button></Link>
          </div>
          {cantiereStatus && cantiereStatus.some((c) => c.value > 0) ? (
            <div className="space-y-5">{cantiereStatus.filter((c) => c.value > 0).map((c) => {
              const total = cantiereStatus.reduce((sum, x) => sum + x.value, 0); const progress = Math.round((c.value / total) * 100)
              const statusColors: Record<string, string> = { "Pianificati": "warning", "In Corso": "default", "Completati": "success", "Sospesi": "destructive" }
              return (<div key={c.name}><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-white">{c.name}</span><div className="flex items-center gap-3"><Badge variant={statusColors[c.name] as any || "default"}>{c.value} cantieri</Badge><span className="text-sm text-kranely-accent font-semibold">{progress}%</span></div></div><Progress value={progress} className="h-2" /></div>)
            })}</div>
          ) : <div className="flex items-center justify-center h-[200px] text-white/40">Nessun cantiere attivo</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Attivita Recente</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin pr-2">
            {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">{activityIcons[activity.entityType] || <AlertCircle className="w-3.5 h-3.5 text-white/40" />}</div>
                <div className="flex-1 min-w-0"><p className="text-sm text-white/80">{activity.details || `${activity.action} ${activity.entityName}`}</p><p className="text-xs text-white/40 mt-0.5">{formatTimeAgo(activity._creationTime)}</p></div>
              </div>
            )) : <div className="text-center py-8 text-white/40">Nessuna attivita recente</div>}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Azioni Rapide</h2>
          <div className="space-y-3">
            {[
              { label: "Nuovo Cliente", icon: Users, href: "/clients", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
              { label: "Nuovo Preventivo", icon: FileText, href: "/quotes", color: "bg-kranely-accent/10 text-kranely-accent border-kranely-accent/20" },
              { label: "Nuovo Cantiere", icon: Building2, href: "/cantieri", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
              { label: "Nuovo Fornitore", icon: Truck, href: "/suppliers", color: "bg-green-500/10 text-green-400 border-green-500/20" },
              { label: "Registra Pagamento", icon: CreditCard, href: "/payments", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
              { label: "Nuovo Appuntamento", icon: Clock, href: "/appointments", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${action.color} hover:opacity-80 transition-all duration-200 group cursor-pointer`}>
                  <action.icon className="w-4 h-4" /><span className="text-sm font-medium">{action.label}</span><Plus className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
