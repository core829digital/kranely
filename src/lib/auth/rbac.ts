export type UserRole = "superadmin" | "admin" | "supplier" | "driver" | "collaborator" | "client"
export type AccountType = "manufacturer" | "reseller"

export const PERMISSION_MAP: Record<string, UserRole[]> = {
  "dashboard:view": ["admin", "client", "supplier", "collaborator"],
  "clients:view": ["admin"],
  "clients:create": ["admin"],
  "clients:view_own": ["client"],
  "suppliers:view": ["admin", "supplier"],
  "suppliers:create": ["admin"],
  "suppliers:view_own": ["supplier"],
  "collaborators:view": ["admin"],
  "collaborators:create": ["admin"],
  "collaborators:view_own": ["collaborator"],
  "quotes:view": ["admin"],
  "quotes:view_own": ["client"],
  "cantieri:view": ["admin", "collaborator"],
  "cantieri:edit": ["admin"],
  "payments:view": ["admin"],
  "payments:view_own": ["supplier", "collaborator", "client"],
  "certificates:view": ["admin", "collaborator"],
  "certificates:create": ["admin"],
  "messages:view": ["admin", "client", "collaborator"],
  "documents:view": ["admin", "client", "supplier", "collaborator"],
  "admin:view": ["admin"],
  "admin:manage_users": ["admin"],
  "settings:view": ["admin", "client", "supplier", "collaborator"],
}

export const SIDEBAR_ITEMS: Record<string, UserRole[]> = {
  "Dashboard": ["admin", "client", "supplier", "collaborator"],
  "Fornitori": ["admin", "supplier"],
  "Collaboratori": ["admin"],
  "Certificati": ["admin", "collaborator"],
  "Pagamenti": ["admin", "supplier", "collaborator", "client"],
  "CantieriDashboard": ["admin", "collaborator"],
  "Clienti": ["admin"],
  "Preventivi": ["admin"],
  "Messages": ["admin", "client", "collaborator"],
  "Documents": ["admin", "client", "supplier", "collaborator"],
  "MyAppointments": ["admin", "client", "supplier", "collaborator"],
  "Admin": ["admin"],
  "Settings": ["admin", "client", "supplier", "collaborator"],
}

const ROUTE_ACCESS_MAP: Record<string, UserRole[]> = {
  "/onboarding-setup": ["admin", "superadmin", "supplier", "collaborator", "client", "driver"],
  "/dashboard": ["admin", "client", "supplier", "collaborator"],
  "/client-dashboard": ["client"],
  "/company-profile": ["admin", "superadmin"],
  "/collaborator-dashboard": ["collaborator"],
  "/supplier-dashboard": ["superadmin", "admin", "supplier"],
  "/driver-dashboard": ["superadmin", "admin", "driver"],
  "/admin": ["admin", "superadmin"],
  "/clients": ["admin"],
  "/suppliers": ["admin", "supplier"],
  "/collaborators": ["admin"],
  "/cantieri": ["admin", "collaborator"],
  "/quotes": ["admin"],
  "/payments": ["admin", "supplier", "collaborator", "client"],
  "/documents": ["admin", "client", "supplier", "collaborator", "driver"],
  "/appointments": ["admin", "client", "supplier", "collaborator", "driver"],
  "/my-appointments": ["client", "supplier", "collaborator", "driver"],
  "/certificates": ["admin", "collaborator"],
  "/messages": ["admin", "client", "collaborator", "driver"],
  "/network": ["admin", "superadmin"],
  "/tasks": ["admin", "collaborator"],
  "/blog": ["admin"],
  "/blog-admin": ["admin"],
  "/referral": ["admin"],
  "/whitelabel": ["superadmin"],
  "/company-dashboard": ["admin"],
  "/workflow": ["admin", "supplier"],
  "/activity-log": ["admin"],
  "/settings": ["admin", "client", "supplier", "collaborator"],
  "/profile": ["admin", "client", "supplier", "collaborator", "driver"],
  "/storage": ["admin", "client", "supplier", "collaborator", "driver"],
  "/prices": ["admin", "client", "supplier", "collaborator"],
  "/seed": ["superadmin"],
  "/daily-logs": ["admin", "collaborator"],
  "/shared-documents": ["admin", "client", "supplier", "collaborator", "driver"],
  "/conversations": ["admin", "client", "supplier", "collaborator", "driver"],
  "/private-area": ["admin", "client", "supplier", "collaborator", "driver"],
  "/pdf-editor": ["admin", "client", "supplier", "collaborator", "driver"],
}

export function hasPermission(role: string, permission: string): boolean {
  if (role === "superadmin" || role === "admin") return true
  const allowed = PERMISSION_MAP[permission]
  return allowed?.includes(role as UserRole) ?? false
}

export function canViewSidebarItem(role: string, itemName: string): boolean {
  if (role === "superadmin" || role === "admin") return true
  const allowed = SIDEBAR_ITEMS[itemName]
  return allowed?.includes(role as UserRole) ?? false
}

const ACCOUNT_TYPE_MAP: Record<string, AccountType[]> = {
  "/workflow": ["manufacturer"],
}

export function canAccessRoute(role: string, pathname: string, accountType?: string | null): boolean {
  if (role === "superadmin") return true
  const allowed = ROUTE_ACCESS_MAP[pathname]
  if (allowed && !allowed.includes(role as UserRole)) return false
  if (accountType) {
    const typeAllowed = ACCOUNT_TYPE_MAP[pathname]
    if (typeAllowed && !typeAllowed.includes(accountType as AccountType)) return false
  }
  return true
}

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case "superadmin": return "/admin"
    case "admin": return "/dashboard"
    case "client": return "/client-dashboard"
    case "supplier": return "/supplier-dashboard"
    case "collaborator": return "/collaborator-dashboard"
    case "driver": return "/driver-dashboard"
    default: return "/"
  }
}