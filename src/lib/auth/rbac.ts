export const PERMISSION_MAP: Record<string, string[]> = {
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

export const SIDEBAR_ITEMS: Record<string, string[]> = {
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

export function hasPermission(role: string, permission: string): boolean {
  if (role === "superadmin" || role === "admin") return true
  const allowed = PERMISSION_MAP[permission]
  return allowed?.includes(role) ?? false
}

export function canViewSidebarItem(role: string, itemName: string): boolean {
  if (role === "superadmin" || role === "admin") return true
  const allowed = SIDEBAR_ITEMS[itemName]
  return allowed?.includes(role) ?? false
}
