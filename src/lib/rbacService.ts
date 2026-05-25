import { Id } from "../../convex/_generated/dataModel"

export type UserRole = "superadmin" | "admin" | "supplier" | "collaborator" | "client" | "driver"
export type UserSubrole = "serramenti" | "edilizia" | "generale"

const ROLE_HIERARCHY: Record<UserRole, number> = {
  superadmin: 100,
  admin: 80,
  collaborator: 60,
  supplier: 40,
  driver: 30,
  client: 20,
}

export function roleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0
}

export function canAccess(role: UserRole, minLevel: number): boolean {
  return roleLevel(role) >= minLevel
}

interface Permission {
  entity: string
  action: "view" | "create" | "edit" | "delete"
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [
    { entity: "*", action: "view" },
    { entity: "*", action: "create" },
    { entity: "*", action: "edit" },
    { entity: "*", action: "delete" },
  ],
  admin: [
    { entity: "clients", action: "view" },
    { entity: "clients", action: "create" },
    { entity: "clients", action: "edit" },
    { entity: "clients", action: "delete" },
    { entity: "cantieri", action: "view" },
    { entity: "cantieri", action: "create" },
    { entity: "cantieri", action: "edit" },
    { entity: "cantieri", action: "delete" },
    { entity: "quotes", action: "view" },
    { entity: "quotes", action: "create" },
    { entity: "quotes", action: "edit" },
    { entity: "quotes", action: "delete" },
    { entity: "suppliers", action: "view" },
    { entity: "suppliers", action: "create" },
    { entity: "suppliers", action: "edit" },
    { entity: "suppliers", action: "delete" },
    { entity: "collaborators", action: "view" },
    { entity: "collaborators", action: "create" },
    { entity: "collaborators", action: "edit" },
    { entity: "messages", action: "view" },
    { entity: "messages", action: "create" },
    { entity: "documents", action: "view" },
    { entity: "documents", action: "create" },
    { entity: "payments", action: "view" },
    { entity: "payments", action: "create" },
    { entity: "settings", action: "view" },
    { entity: "settings", action: "edit" },
  ],
  collaborator: [
    { entity: "cantieri", action: "view" },
    { entity: "cantieri", action: "edit" },
    { entity: "tasks", action: "view" },
    { entity: "tasks", action: "create" },
    { entity: "tasks", action: "edit" },
    { entity: "certificates", action: "view" },
    { entity: "messages", action: "view" },
    { entity: "messages", action: "create" },
    { entity: "documents", action: "view" },
    { entity: "appointments", action: "view" },
  ],
  supplier: [
    { entity: "orders", action: "view" },
    { entity: "orders", action: "edit" },
    { entity: "production", action: "view" },
    { entity: "production", action: "edit" },
    { entity: "messages", action: "view" },
    { entity: "messages", action: "create" },
    { entity: "documents", action: "view" },
  ],
  driver: [
    { entity: "deliveries", action: "view" },
    { entity: "deliveries", action: "edit" },
    { entity: "messages", action: "view" },
    { entity: "messages", action: "create" },
  ],
  client: [
    { entity: "quotes", action: "view" },
    { entity: "cantieri", action: "view" },
    { entity: "payments", action: "view" },
    { entity: "messages", action: "view" },
    { entity: "messages", action: "create" },
    { entity: "documents", action: "view" },
    { entity: "appointments", action: "view" },
  ],
}

export function hasPermission(role: UserRole, entity: string, action: Permission["action"]): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  return perms.some((p) => (p.entity === "*" || p.entity === entity) && p.action === action)
}

export function getPermittedRoles(entity: string, action: Permission["action"]): UserRole[] {
  return (Object.keys(ROLE_PERMISSIONS) as UserRole[]).filter((role) => hasPermission(role, entity, action))
}
