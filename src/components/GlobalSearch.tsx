"use client"

import { useState, useEffect, useRef } from "react"
import { Search, FileText, User, Building2, HardHat, Truck, FolderOpen, ArrowRight } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useOrgId } from "@/hooks/useOrgId"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  href: string
  type: string
}

export default function GlobalSearch() {
  const orgId = useOrgId()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const clients = useQuery(api.clients.list, orgId ? { organizationId: orgId } : "skip")
  const cantieri = useQuery(api.cantieri.list, orgId ? { organizationId: orgId } : "skip")
  const suppliers = useQuery(api.suppliers.list, orgId ? { organizationId: orgId } : "skip")
  const quotes = useQuery(api.quotes.list, orgId ? { organizationId: orgId } : "skip")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
    setSelectedIndex(0)
  }, [open])

  const results: SearchResult[] = []

  const q = query.toLowerCase().trim()
  if (q.length >= 2) {
    if (clients) {
      clients.filter((c) => (c.fullName || c.companyName || c.email || "").toLowerCase().includes(q)).slice(0, 5).forEach((c) => {
        results.push({ id: `client-${c._id}`, label: c.fullName || c.companyName || c.email || "", description: c.email || "", icon: <User className="w-4 h-4" />, href: "/clients", type: "Cliente" })
      })
    }
    if (cantieri) {
      cantieri.filter((c) => (c.name || "").toLowerCase().includes(q)).slice(0, 5).forEach((c) => {
        results.push({ id: `cantiere-${c._id}`, label: c.name || "", description: c.address || "", icon: <HardHat className="w-4 h-4" />, href: "/cantieri", type: "Cantiere" })
      })
    }
    if (suppliers) {
      suppliers.filter((s) => (s.companyName || "").toLowerCase().includes(q)).slice(0, 5).forEach((s) => {
        results.push({ id: `supplier-${s._id}`, label: s.companyName || "", description: s.email || "", icon: <Truck className="w-4 h-4" />, href: "/suppliers", type: "Fornitore" })
      })
    }
    if (quotes) {
      quotes.filter((q2) => (q2.title || "").toLowerCase().includes(q)).slice(0, 5).forEach((q2) => {
        results.push({ id: `quote-${q2._id}`, label: q2.title || "", description: `${q2.quoteType || ""} - ${q2.status || ""}`, icon: <FileText className="w-4 h-4" />, href: "/quotes", type: "Preventivo" })
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === "Enter" && results[selectedIndex]) { window.location.href = results[selectedIndex].href; setOpen(false) }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 bg-white text-black hover:bg-white/80 text-sm w-full max-w-[240px]"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Cerca...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/40"><span className="text-xs">⌘</span>K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl bg-kranely-app-bg border border-white/10 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cerca clienti, cantieri, fornitori..."
                className="flex-1 bg-transparent text-white outline-none placeholder:text-white/30 text-sm"
              />
              <button onClick={() => setOpen(false)} className="bg-white text-black hover:bg-white/80 text-xs px-2 py-1 rounded">ESC</button>
            </div>
            {query.length >= 2 && (
              <div className="max-h-[50vh] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="p-8 text-center text-white/40 text-sm">Nessun risultato per "{query}"</div>
                ) : (
                  <div className="py-2">
                    {results.map((r, i) => (
                      <Link
                        key={r.id}
                        href={r.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors group",
                          i === selectedIndex && "bg-white/[0.06]"
                        )}
                      >
                        <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-kranely-accent flex-shrink-0">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{r.label}</p>
                          {r.description && <p className="text-xs text-white/40 truncate">{r.description}</p>}
                        </div>
                        <span className="text-[10px] text-white/30 uppercase tracking-wider flex-shrink-0">{r.type}</span>
                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            {query.length < 2 && (
              <div className="p-6 text-center text-white/30 text-sm">Inizia a digitare per cercare (min. 2 caratteri)</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
