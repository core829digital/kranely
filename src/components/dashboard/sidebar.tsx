"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogoLink } from "@/components/Logo"
import {
  LayoutDashboard,
  Users,
  Truck,
  FileText,
  Building2,
  CreditCard,
  UserCog,
  ShieldCheck,
  MessageSquare,
  FolderOpen,
  CalendarDays,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Workflow,
  HardHat,
  UserCheck,
  Package,
  ClipboardList,
  Megaphone,
  BarChart3,
  Globe,
  Activity,
  ChevronUp,
  User as UserIcon,
  X,
} from "lucide-react"
import { useState, useCallback } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useOrgId } from "@/hooks/useOrgId"

interface NavItem {
  href: string
  label: string
  icon: any
  roles?: string[]
  accountType?: ("manufacturer" | "reseller")[]
}

interface NavSection {
  title: string
  items: NavItem[]
  roles?: string[]
}

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const { user } = useAuth()
  const orgId = useOrgId()
  const whitelabel = useQuery(api.whitelabel.get, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")

  const role = user?.role || "client"
  const accountType = user?.accountType || null
  const isAdmin = role === "admin" || role === "superadmin"

  const sections: NavSection[] = [
    {
      title: "Principale",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/my-appointments", label: "I Miei Appuntamenti", icon: CalendarDays, roles: ["client", "supplier", "collaborator", "driver"] },
      ],
    },
    {
      title: "Gestione",
      roles: ["superadmin", "admin"],
      items: [
        { href: "/clients", label: "Clienti", icon: Users },
        { href: "/suppliers", label: "Fornitori", icon: Truck },
        { href: "/collaborators", label: "Collaboratori", icon: UserCog },
        { href: "/quotes", label: "Preventivi", icon: FileText },
        { href: "/cantieri", label: "Cantieri", icon: Building2 },
        { href: "/workflow", label: "Flusso Lavoro", icon: Workflow, accountType: ["manufacturer"] },
        { href: "/supplier-dashboard", label: "Dashboard Fornitore", icon: HardHat, roles: ["superadmin", "admin", "supplier"] },
        { href: "/driver-dashboard", label: "Dashboard Autista", icon: Truck, roles: ["superadmin", "admin", "driver"] },
      ],
    },
    {
      title: "Operatività",
      items: [
        { href: "/tasks", label: "Task Cantieri", icon: ClipboardList, roles: ["admin", "superadmin", "collaborator", "supplier"] },
        { href: "/certificates", label: "Certificati", icon: ShieldCheck, roles: ["admin", "superadmin", "collaborator"] },
        { href: "/payments", label: "Pagamenti", icon: CreditCard, roles: ["admin", "superadmin", "client", "supplier"] },
        { href: "/storage", label: "Archivio File", icon: FolderOpen },
      ],
    },
    {
      title: "Comunicazione",
      items: [
        { href: "/messages", label: "Messaggi", icon: MessageSquare },
        { href: "/appointments", label: "Appuntamenti", icon: CalendarDays, roles: ["superadmin", "admin", "collaborator", "driver"] },
      ],
    },
    {
      title: "Piattaforma",
      roles: ["superadmin", "admin"],
      items: [
        { href: "/admin", label: "Pannello Admin", icon: Shield },
        { href: "/activity-log", label: "Registro Attività", icon: Activity },
        { href: "/whitelabel", label: "White Label", icon: Globe },
        { href: "/referral", label: "Codici Referral", icon: Megaphone },
        { href: "/settings", label: "Impostazioni", icon: Settings },
        { href: "/profile", label: "Il Mio Profilo", icon: UserIcon, roles: undefined },
      ],
    },
  ]

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.roles && !item.roles.includes(role)) return false
        if (item.accountType && !item.accountType.includes(accountType as any)) return false
        return true
      }),
    }))
    .filter((section) => section.items.length > 0)

  const hasActiveInSection = useCallback(
    (section: NavSection) => {
      return section.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      )
    },
    [pathname]
  )

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const sidebarContent = (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-white/10 bg-[#1C1A18] transition-all duration-300 flex-shrink-0 z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
        {!collapsed && <LogoLink href="/dashboard" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          title={collapsed ? "Espandi menu" : "Comprimi menu"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {visibleSections.map((section) => {
          const isExpanded = expandedSections[section.title] ?? true

          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "flex items-center w-full gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors",
                  collapsed
                    ? "justify-center text-white/40"
                    : "text-white/50 hover:text-white/80"
                )}
                title={collapsed ? section.title : undefined}
              >
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{section.title}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-white/30" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    )}
                  </>
                )}
              </button>

              {(isExpanded || collapsed) && (
                <div className={cn("space-y-0.5", collapsed ? "" : "mt-0.5")}>
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          collapsed ? "justify-center mx-auto" : "",
                          isActive
                            ? "text-[#FFC703] bg-[#FFC703]/10"
                            : "text-white/65 hover:text-white hover:bg-white/10"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="text-xs text-white/40">
            Kranely v2.0 &copy; {new Date().getFullYear()}
          </div>
        </div>
      )}
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}