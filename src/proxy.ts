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

const ONBOARDING_PATH = "/onboarding-setup"

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === ONBOARDING_PATH
}

function getSessionData(request: NextRequest): { role: string | null; onboardingCompleted: boolean; accountType: string | null } {
  try {
    const data = request.cookies.get("kranely_session_data")
    if (!data?.value) return { role: null, onboardingCompleted: false, accountType: null }
    const parsed = JSON.parse(decodeURIComponent(data.value))
    return {
      role: parsed.role ?? null,
      onboardingCompleted: parsed.onboardingCompleted ?? false,
      accountType: parsed.accountType ?? null,
    }
  } catch {
    return { role: null, onboardingCompleted: false, accountType: null }
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

  const { role, onboardingCompleted, accountType } = getSessionData(request)
  if (!role) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (isOnboardingPath(pathname)) {
    if (onboardingCompleted) {
      const redirectUrl = new URL(getDefaultRoute(role), request.url)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  if (!onboardingCompleted && (role === "admin" || role === "superadmin")) {
    const onboardingUrl = new URL(ONBOARDING_PATH, request.url)
    return NextResponse.redirect(onboardingUrl)
  }

  if (!canAccessRoute(role, pathname, accountType)) {
    const redirectUrl = new URL(getDefaultRoute(role), request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
}