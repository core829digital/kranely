import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { canAccessRoute, getDefaultRouteForRole, type UserRole } from "@/lib/auth/rbac"

const PUBLIC_PATHS = [
  "/sign-in", "/sign-up", "/forgot-password", "/reset-password",
  "/onboarding", "/onboarding-staff",
  "/", "/about", "/services", "/contact",
  "/blog", "/pricing", "/public-pricing", "/privacy", "/terms", "/cookie", "/cookies", "/reviews", "/calculator",
  "/rent-your-app", "/pdf-editor",
  "/api", "/_next",
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function getSessionRole(request: NextRequest): string | null {
  try {
    const data = request.cookies.get("kranely_session_data")
    if (!data?.value) return null
    return JSON.parse(decodeURIComponent(data.value)).role ?? null
  } catch {
    return null
  }
}

function getDefaultRoute(role: string | null): string {
  if (!role) return "/sign-in"
  return getDefaultRouteForRole(role as UserRole)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get("kranely_session")
  if (!sessionCookie?.value) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  const role = getSessionRole(request)
  if (!role) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (!canAccessRoute(role, pathname)) {
    const redirectUrl = new URL(getDefaultRoute(role), request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
}