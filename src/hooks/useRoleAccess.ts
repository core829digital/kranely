"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { canAccessRoute, getDefaultRouteForRole, hasPermission, type UserRole } from "@/lib/auth/rbac"

export function useRoleAccess() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const role = user?.role ?? ("anonymous" as string)
  const isAuthenticated = !!user

  function canAccess(requestedPath?: string): boolean {
    const path = requestedPath ?? pathname
    return canAccessRoute(role, path)
  }

  function requireAccess(requestedPath?: string): void {
    if (!canAccess(requestedPath)) {
      const defaultRoute = user ? getDefaultRouteForRole(user.role as UserRole) : "/sign-in"
      router.push(defaultRoute)
    }
  }

  function requireRole(allowedRoles: UserRole[]): void {
    if (!allowedRoles.includes(role as UserRole)) {
      const defaultRoute = user ? getDefaultRouteForRole(user.role as UserRole) : "/sign-in"
      router.push(defaultRoute)
    }
  }

  function hasRole(allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(role as UserRole)
  }

  function can(permission: string): boolean {
    return hasPermission(role, permission)
  }

  function requirePermission(permission: string): void {
    if (!hasPermission(role, permission)) {
      const defaultRoute = user ? getDefaultRouteForRole(user.role as UserRole) : "/sign-in"
      router.push(defaultRoute)
    }
  }

  return {
    role,
    isAuthenticated,
    canAccess,
    requireAccess,
    requireRole,
    hasRole,
    can,
    requirePermission,
  }
}