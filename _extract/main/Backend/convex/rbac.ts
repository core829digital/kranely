/**
 * RBAC (Role-Based Access Control) Middleware for IWHome 2.0
 * Centralized role/permission checking for all Convex mutations and queries.
 *
 * Roles: admin, supplier, collaborator, client
 */

import { QueryCtx, MutationCtx } from "./_generated/server";

// ─── Role Definitions ───────────────────────────────────────
export type UserRole =
    | "admin"
    | "supplier"
    | "collaborator"
    | "client";

// ─── Permission Map ─────────────────────────────────────────
// Which roles can access which modules
const PERMISSION_MAP: Record<string, UserRole[]> = {
    // Fornitori module
    "fornitori:view": ["admin", "supplier"],
    "fornitori:create": ["admin"],
    "fornitori:edit": ["admin"],
    "fornitori:delete": ["admin"],
    // Supplier can modify their own orders
    "fornitori:edit_order": ["admin", "supplier"],
    "fornitori:view_own": ["supplier"],

    // Collaboratori module
    "collaboratori:view": ["admin"],
    "collaboratori:create": ["admin"],
    "collaboratori:edit": ["admin"],
    "collaboratori:delete": ["admin"],
    "collaboratori:view_own": ["collaborator"],

    // Certificati module
    "certificati:view": ["admin", "collaborator"],
    "certificati:create": ["admin"],
    "certificati:edit": ["admin"],
    "certificati:delete": ["admin"],
    "certificati:view_own": ["collaborator", "supplier"],

    // Pagamenti module
    "pagamenti:view": ["admin"],
    "pagamenti:create": ["admin"],
    "pagamenti:edit": ["admin"],
    "pagamenti:view_own": ["supplier", "collaborator", "client"],

    // Clienti module (existing)
    "clienti:view": ["admin"],
    "clienti:create": ["admin"],
    "clienti:edit": ["admin"],
    "clienti:view_own": ["client"],

    // Preventivi module (existing)
    "preventivi:view": ["admin"],
    "preventivi:view_own": ["client"],

    // Cantieri module (existing)
    "cantieri:view": ["admin", "collaborator"],
    "cantieri:edit": ["admin"],

    // Admin panel
    "admin:view": ["admin"],
    "admin:manage_users": ["admin"],

    // Dashboard
    "dashboard:view": ["admin", "client", "supplier", "collaborator"],

    // Messages
    "messages:view": ["admin", "client", "collaborator"],

    // Documents
    "documents:view": ["admin", "client", "supplier", "collaborator"],
};

// ─── Sidebar Navigation Map ─────────────────────────────────
// Which menu items each role can see
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
};

// ─── Helper Functions ────────────────────────────────────────

/**
 * Get the authenticated user's email and role from Convex context.
 */
export async function getCallerInfo(ctx: QueryCtx | MutationCtx): Promise<{ email: string; role: UserRole; userId: string } | null> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const tokenIdentifier = identity.tokenIdentifier;
    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
        .first();

    if (!user) return null;

    return {
        email: user.email,
        role: (user.role ?? "client") as UserRole,
        userId: user._id,
    };
}

/**
 * Require that the caller has one of the specified roles. Throws if not.
 */
export async function requireRole(ctx: QueryCtx | MutationCtx, allowedRoles: UserRole[]): Promise<{ email: string; role: UserRole; userId: string }> {
    const caller = await getCallerInfo(ctx);
    if (!caller) {
        throw new Error("Non autenticato. Effettua il login.");
    }
    // SuperAdmin (runtime migration fallback) and Admin always have access
    if ((caller.role as string) === "superadmin" || caller.role === "admin") {
        return caller;
    }
    if (!allowedRoles.includes(caller.role)) {
        throw new Error(`Accesso negato. Ruolo richiesto: ${allowedRoles.join(", ")}. Ruolo attuale: ${caller.role}`);
    }
    return caller;
}

/**
 * Require any authenticated user — just check they're logged in.
 */
export async function requireAnyAuth(ctx: QueryCtx | MutationCtx): Promise<{ email: string; role: UserRole; userId: string }> {
    const caller = await getCallerInfo(ctx);
    if (!caller) {
        throw new Error("Non autenticato. Effettua il login.");
    }
    return caller;
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: string): boolean {
    // SuperAdmin (runtime migration fallback) and Admin always have permission
    if ((role as string) === "superadmin" || role === "admin") return true;
    const allowedRoles = PERMISSION_MAP[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
}

/**
 * Check if a role can see a specific sidebar item.
 */
export function canViewSidebarItem(role: UserRole, itemName: string): boolean {
    // SuperAdmin (runtime migration fallback) and Admin see everything
    if ((role as string) === "superadmin" || role === "admin") return true;
    const allowedRoles = SIDEBAR_ITEMS[itemName];
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
}
