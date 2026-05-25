import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = [
  "/sign-in", "/sign-up", "/forgot-password", "/reset-password",
  "/onboarding", "/onboarding-staff",
  "/", "/blog", "/pricing", "/privacy", "/terms", "/cookies",
  "/api", "/_next",
]

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export function middleware(request: NextRequest) {
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

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
}
