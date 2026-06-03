"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/Logo"
import { Search, Users, Eye, MousePointerClick, Activity, Clock, ShieldOff, TrendingUp, BarChart3, LogIn, Euro, ArrowUpCircle, ArrowDownCircle, AlertTriangle, PieChart as PieChartIcon, Star, ThumbsUp, Trash2 } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts"

type ChartTooltipProps = { active?: boolean; payload?: { name?: string; value?: number | string; color?: string }[]; label?: string | number }
function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload?.length) {
    return (
      <div className="bg-[#2a2826] border border-white/10 rounded-lg p-3 text-sm">
        <p className="text-white/60 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function AdminDashboard() {
  const { user } = useAuth()
  const adminData = useQuery(api.analytics.getAdminDashboard, user?.email ? { adminEmail: user.email } : "skip")
  const adminUsers = useQuery(api.analytics.getAdminUsers, user?.email ? { adminEmail: user.email } : "skip")
  const recentActivity = useQuery(api.analytics.getAdminRecentActivity, user?.email ? { adminEmail: user.email, limit: 30 } : "skip")
  const reviewsData = useQuery(api.reviews.adminListAll, user?.email ? { adminEmail: user.email } : "skip")
  const reviewsStats = useQuery(api.reviews.adminStats, user?.email ? { adminEmail: user.email } : "skip")
  const approveReview = useMutation(api.reviews.approve)
  const removeReview = useMutation(api.reviews.remove)

  const [userSearch, setUserSearch] = useState("")
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending" | "approved">("pending")

  if (!adminData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Logo size="lg" />
          <p className="text-white/60 mt-4">Caricamento dati...</p>
        </div>
      </div>
    )
  }

  const { overview, payments, paymentStatusDist, revenueTrend, topOrgsByRevenue, topPages, topFeatures, dailyViews, dailySignIns } = adminData

  const filteredUsers = adminUsers?.filter((u) => {
    if (!userSearch) return true
    const s = userSearch.toLowerCase()
    return u.email.toLowerCase().includes(s) || (u.fullName || "").toLowerCase().includes(s)
  })

  const roleLabels: Record<string, string> = {
    superadmin: "Super Admin", admin: "Admin", supplier: "Fornitore",
    collaborator: "Collaboratore", client: "Cliente", driver: "Autista",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Pannello di Controllo</h1>
        <p className="text-white/60 mt-1">Monitoraggio completo della piattaforma — solo per amministratori</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><Eye className="w-4 h-4 text-blue-400" /><span className="text-xs text-white/40">Visualizzazioni oggi</span></div>
          <p className="text-2xl font-bold text-blue-400">{overview.viewsToday}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-green-400" /><span className="text-xs text-white/40">Accessi unici oggi</span></div>
          <p className="text-2xl font-bold text-green-400">{overview.uniqueSignInsToday}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><MousePointerClick className="w-4 h-4 text-purple-400" /><span className="text-xs text-white/40">Eventi oggi</span></div>
          <p className="text-2xl font-bold text-purple-400">{overview.eventsToday}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><LogIn className="w-4 h-4 text-cyan-400" /><span className="text-xs text-white/40">Utenti registrati</span></div>
          <p className="text-2xl font-bold text-cyan-400">{overview.totalUsers}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-amber-400" /><span className="text-xs text-white/40">Sessioni attive</span></div>
          <p className="text-2xl font-bold text-amber-400">{overview.activeSessions}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-kranely-accent" /><span className="text-xs text-white/40">Visite totali</span></div>
          <p className="text-2xl font-bold text-kranely-accent">{overview.totalViews}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" />Visualizzazioni giornaliere (7 giorni)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Visite" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2"><LogIn className="w-4 h-4 text-green-400" />Accessi giornalieri (7 giorni)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySignIns}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="count" name="Accessi unici" stroke="#4ADE80" strokeWidth={2} dot={{ fill: "#4ADE80", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Revenue / Payments Section ── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Euro className="w-5 h-5 text-green-400" />Revenue & Pagamenti</h2>

        {/* Revenue overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2"><ArrowUpCircle className="w-4 h-4 text-green-400" /><span className="text-xs text-white/40">Totale entrate</span></div>
            <p className="text-2xl font-bold text-green-400">&euro;{payments.totalRevenue.toLocaleString("it-IT")}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2"><ArrowDownCircle className="w-4 h-4 text-red-400" /><span className="text-xs text-white/40">Totale uscite</span></div>
            <p className="text-2xl font-bold text-red-400">&euro;{payments.totalOutgoing.toLocaleString("it-IT")}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2"><Euro className="w-4 h-4 text-kranely-accent" /><span className="text-xs text-white/40">Netto</span></div>
            <p className="text-2xl font-bold text-kranely-accent">&euro;{payments.netRevenue.toLocaleString("it-IT")}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-blue-400" /><span className="text-xs text-white/40">Pagati</span></div>
            <p className="text-2xl font-bold text-blue-400">{payments.totalPaid}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-amber-400" /><span className="text-xs text-white/40">In attesa</span></div>
            <p className="text-2xl font-bold text-amber-400">{payments.totalPending}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-white/40">In ritardo</span></div>
            <p className="text-2xl font-bold text-red-400">{payments.totalOverdue}</p>
          </div>
        </div>

        {/* Revenue chart + Payment status pie + Top orgs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] lg:col-span-2">
            <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" />Andamento entrate/uscite (mensile)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} formatter={(v: any) => `€${Number(v).toLocaleString("it-IT")}`} />
                  <Bar dataKey="incoming" name="Entrate" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outgoing" name="Uscite" fill="#F87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-purple-400" />Stato pagamenti</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: "Pagati", value: paymentStatusDist.pagato },
                      { name: "In attesa", value: paymentStatusDist.in_attesa },
                      { name: "In ritardo", value: paymentStatusDist.in_ritardo },
                      { name: "In verifica", value: paymentStatusDist.in_verifica },
                      { name: "Parziale", value: paymentStatusDist.parziale },
                    ].filter((d) => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" nameKey="name">
                      {[
                        { name: "Pagati", color: "#4ADE80" },
                        { name: "In attesa", color: "#FBBF24" },
                        { name: "In ritardo", color: "#F87171" },
                        { name: "In verifica", color: "#60A5FA" },
                        { name: "Parziale", color: "#A78BFA" },
                      ].filter((_, i) => [paymentStatusDist.pagato, paymentStatusDist.in_attesa, paymentStatusDist.in_ritardo, paymentStatusDist.in_verifica, paymentStatusDist.parziale][i] > 0).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {[
                  { label: "Pagati", value: paymentStatusDist.pagato, color: "bg-green-400" },
                  { label: "In attesa", value: paymentStatusDist.in_attesa, color: "bg-amber-400" },
                  { label: "In ritardo", value: paymentStatusDist.in_ritardo, color: "bg-red-400" },
                  { label: "In verifica", value: paymentStatusDist.in_verifica, color: "bg-blue-400" },
                  { label: "Parziale", value: paymentStatusDist.parziale, color: "bg-purple-400" },
                ].filter((l) => l.value > 0).map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5 text-xs text-white/60">
                    <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                    {l.label}: {l.value}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2"><Euro className="w-4 h-4 text-kranely-accent" />Top organizzazioni</h3>
              <div className="space-y-2">
                {topOrgsByRevenue.map((org, i) => (
                  <div key={org.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-white/30 font-mono w-5 text-right">{i + 1}.</span>
                      <span className="text-sm text-white/80 truncate">{org.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-400 shrink-0 ml-2">&euro;{org.amount.toLocaleString("it-IT")}</span>
                  </div>
                ))}
                {topOrgsByRevenue.length === 0 && <p className="text-sm text-white/40">Nessun dato ancora</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Pages & Top Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" />Pagine più visitate</h3>
          <div className="space-y-2">
            {topPages.slice(0, 10).map((page, i) => (
              <div key={page.path} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-white/30 font-mono w-5 text-right">{i + 1}.</span>
                  <span className="text-sm text-white/80 truncate">{page.path || "/"}</span>
                </div>
                <Badge variant="secondary" className="shrink-0 ml-2">{page.count}</Badge>
              </div>
            ))}
            {topPages.length === 0 && <p className="text-sm text-white/40">Nessun dato ancora</p>}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-purple-400" />Funzioni più utilizzate</h3>
          <div className="space-y-2">
            {topFeatures.slice(0, 10).map((feat, i) => (
              <div key={feat.eventName} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-white/30 font-mono w-5 text-right">{i + 1}.</span>
                  <span className="text-sm text-white/80 truncate">{feat.eventName}</span>
                </div>
                <Badge variant="secondary" className="shrink-0 ml-2">{feat.count}</Badge>
              </div>
            ))}
            {topFeatures.length === 0 && <p className="text-sm text-white/40">Nessun dato ancora</p>}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Users className="w-5 h-5" />Tutti gli utenti ({filteredUsers?.length || 0})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Cerca utente..." className="pl-10 w-64" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-white/40 uppercase border-b border-white/10">
                <th className="text-left p-3 font-semibold">Utente</th>
                <th className="text-left p-3 font-semibold">Ruolo</th>
                <th className="text-left p-3 font-semibold">Online</th>
                <th className="text-left p-3 font-semibold">Accessi</th>
                <th className="text-left p-3 font-semibold">Visite (7g)</th>
                <th className="text-left p-3 font-semibold">Ultima attività</th>
                <th className="text-left p-3 font-semibold">Stato</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((u) => (
                <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div>
                      <p className="text-sm text-white">{u.fullName || "—"}</p>
                      <p className="text-xs text-white/40">{u.email}</p>
                    </div>
                  </td>
                  <td className="p-3"><Badge variant="secondary">{roleLabels[u.role] || u.role}</Badge></td>
                  <td className="p-3">
                    {u.isOnline ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs">
                        <span className="w-2 h-2 rounded-full bg-green-400" /> Online
                      </span>
                    ) : (
                      <span className="text-white/30 text-xs">Offline</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-white/60">{u.sessionCount}</td>
                  <td className="p-3 text-sm text-white/60">{u.pageViewsLast7d}</td>
                  <td className="p-3 text-sm text-white/60">
                    {u.lastActive ? new Date(u.lastActive).toLocaleString("it-IT") : "Mai"}
                  </td>
                  <td className="p-3">
                    {u.blocked ? (
                      <Badge variant="destructive">Bloccato</Badge>
                    ) : (
                      <Badge variant="success">Attivo</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!filteredUsers || filteredUsers.length === 0) && (
          <div className="p-8 text-center text-white/40">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessun utente trovato</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5" />Attività recenti</h2>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {recentActivity?.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] text-sm">
              {a.type === "page_view" && <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              {a.type === "feature_event" && <MousePointerClick className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
              {a.type === "sign_in" && <LogIn className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              {a.type === "sign_out" && <LogIn className="w-3.5 h-3.5 text-red-400 shrink-0 rotate-180" />}
              <span className="text-white/60 min-w-[120px] text-xs">
                {new Date(a.timestamp).toLocaleString("it-IT")}
              </span>
              <span className="text-white/80 min-w-[160px]">{a.userEmail || "Anonimo"}</span>
              <span className="text-white/60">{a.description}</span>
            </div>
          ))}
          {(!recentActivity || recentActivity.length === 0) && (
            <p className="text-sm text-white/40 text-center py-4">Nessuna attività recente</p>
          )}
        </div>
      </div>

      {/* Reviews Management */}
      <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" />Recensioni</h2>

        {reviewsStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
              <p className="text-xs text-white/40">Totale</p>
              <p className="text-xl font-bold text-white">{reviewsStats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
              <p className="text-xs text-white/40">Approvate</p>
              <p className="text-xl font-bold text-green-400">{reviewsStats.approved}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
              <p className="text-xs text-white/40">In attesa</p>
              <p className="text-xl font-bold text-yellow-400">{reviewsStats.pending}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
              <p className="text-xs text-white/40">Media voto</p>
              <p className="text-xl font-bold text-kranely-accent">{reviewsStats.averageRating}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button key={f} onClick={() => setReviewFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                reviewFilter === f ? "bg-kranely-accent text-kranely-app-bg font-semibold" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}>
              {f === "pending" ? "In attesa" : f === "approved" ? "Approvate" : "Tutte"}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {reviewsData && reviewsData.length > 0 ? reviewsData
            .filter((r) => reviewFilter === "all" || (reviewFilter === "pending" && !r.approved) || (reviewFilter === "approved" && r.approved))
            .map((r) => (
              <div key={r._id} className="flex items-start justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{r.name}</span>
                    <span className="text-xs text-white/40">{r.company}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-white/60 line-clamp-2">{r.text}</p>
                  <p className="text-xs text-white/30 mt-1">{new Date(r.createdAt).toLocaleDateString("it-IT")} {r.email && `— ${r.email}`}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {!r.approved && (
                    <button onClick={async () => { try { await approveReview({ id: r._id, organizationId: r.organizationId, userEmail: user?.email }); toast.success("Recensione approvata") } catch (e: any) { toast.error(e.message) } }}
                      className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="Approva" aria-label="Approva recensione">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={async () => { try { await removeReview({ id: r._id, organizationId: r.organizationId, userEmail: user?.email }); toast.success("Recensione rimossa") } catch (e: any) { toast.error(e.message) } }}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Rimuovi" aria-label="Rimuovi recensione">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) : (
            <p className="text-sm text-white/40 text-center py-4">Nessuna recensione</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Logo size="lg" />
          <p className="text-white/60 mt-4">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (user.role !== "admin" && user.role !== "superadmin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <ShieldOff className="w-16 h-16 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Accesso Negato</h1>
          <p className="text-white/60">
            Solo l'amministratore della piattaforma può accedere a questa sezione.
          </p>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}
