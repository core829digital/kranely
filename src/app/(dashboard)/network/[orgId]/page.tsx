"use client"

import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { PageSkeleton } from "@/components/Skeletons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Id } from "../../../../../convex/_generated/dataModel"
import {
  Building2, ArrowLeft, MapPin, Globe, Phone, Users,
  CalendarDays, CheckCircle2, Package, Wrench, Sparkles,
  FileText, ShoppingCart, ExternalLink
} from "lucide-react"

export default function NetworkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const orgId = params.orgId as string

  const profile = useQuery(
    api.organizations.getPublicProfile,
    { orgId: orgId as Id<"organizations">, userEmail: user?.email },
  )

  if (!profile) return <PageSkeleton />

  const memberSince = profile.metrics?.memberSince
    ? new Date(profile.metrics.memberSince).toLocaleDateString("it-IT", {
        year: "numeric", month: "long",
      })
    : null

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/network")}
        className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Torna alla rete
      </button>

      {/* Hero */}
      <div className="p-6 lg:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {profile.logo ? (
              <img
                src={`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${profile.logo}`}
                alt={profile.companyName}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="w-8 h-8 lg:w-10 lg:h-10 text-white/30" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{profile.companyName}</h1>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border",
                profile.accountType === "manufacturer"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-green-500/10 text-green-400 border-green-500/20"
              )}>
                {profile.accountType === "manufacturer" ? "Produttore" : "Rivenditore"}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
              {(profile.country || profile.city) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-white/30" />
                  {[profile.city, profile.country].filter(Boolean).join(", ")}
                </span>
              )}
              {profile.employeeCount != null && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-white/30" />
                  {profile.employeeCount} dipendenti
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-white/30" />
                  Membro dal {memberSince}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {profile.profileDescription && (
        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-kranely-accent" />
            <h2 className="text-lg font-semibold text-white">Chi Siamo</h2>
          </div>
          <p className="text-white/60 leading-relaxed whitespace-pre-line">{profile.profileDescription}</p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Specializations */}
        {profile.specializations && profile.specializations.length > 0 && (
          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-kranely-accent" />
              <h3 className="text-sm font-semibold text-white">Specializzazioni</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.specializations.map(s => (
                <span key={s} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Materials */}
        {profile.materialsUsed && profile.materialsUsed.length > 0 && (
          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-kranely-accent" />
              <h3 className="text-sm font-semibold text-white">Materiali</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.materialsUsed.map(m => (
                <span key={m} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hardware */}
        {profile.hardwareBrands && profile.hardwareBrands.length > 0 && (
          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-kranely-accent" />
              <h3 className="text-sm font-semibold text-white">Ferramenta</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.hardwareBrands.map(h => (
                <span key={h} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-kranely-accent" />
            <h3 className="text-sm font-semibold text-white">Contatti</h3>
          </div>
          <div className="space-y-2 text-sm">
            {profile.contactPhone && (
              <a href={`tel:${profile.contactPhone}`} className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors">
                <Phone className="w-4 h-4 text-white/30" />
                {profile.contactPhone}
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-kranely-accent/70 hover:text-kranely-accent transition-colors">
                <Globe className="w-4 h-4" />
                {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Metrics */}
        {profile.metrics && (
          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-kranely-accent" />
              <h3 className="text-sm font-semibold text-white">Attività</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {profile.metrics.completedOrders > 0 && (
                <div>
                  <p className="text-2xl font-bold text-white">{profile.metrics.completedOrders}</p>
                  <p className="text-xs text-white/40">Ordini completati</p>
                </div>
              )}
              {profile.metrics.totalClients > 0 && (
                <div>
                  <p className="text-2xl font-bold text-white">{profile.metrics.totalClients}</p>
                  <p className="text-xs text-white/40">Clienti totali</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
