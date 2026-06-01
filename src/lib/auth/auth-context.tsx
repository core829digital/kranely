"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { Logo } from "@/components/Logo"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

export type UserRole = "superadmin" | "admin" | "supplier" | "driver" | "collaborator" | "client"
export type UserSubrole = "serramenti" | "edilizia" | "generale" | null

interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  subrole: UserSubrole
  organizationId: string | undefined
  _id: Id<"users"> | undefined
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, fullName: string, role: UserRole, subrole?: UserSubrole, phone?: string) => Promise<boolean>
  signOut: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = "kranely_session"
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000
const SESSION_DATA_COOKIE = "kranely_session_data"

function setSessionCookie(email: string) {
  try { document.cookie = `kranely_session=${encodeURIComponent(email)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax` } catch {}
}

function setSessionDataCookie(role: string, organizationId: string) {
  try {
    const data = encodeURIComponent(JSON.stringify({ role, organizationId }))
    document.cookie = `${SESSION_DATA_COOKIE}=${data}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
  } catch {}
}

function clearSessionCookie() {
  try { document.cookie = "kranely_session=; path=/; max-age=0"; document.cookie = `${SESSION_DATA_COOKIE}=; path=/; max-age=0` } catch {}
}

interface SessionData {
  email: string
  fullName: string
  role: UserRole
  subrole: UserSubrole
  organizationId: string
  userId: string
  expires: number
}

function getSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data: SessionData = JSON.parse(raw)
    if (Date.now() > data.expires) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return data
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

function setSession(data: Omit<SessionData, "expires">) {
  const session: SessionData = { ...data, expires: Date.now() + SESSION_EXPIRY }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const loginMutation = useMutation(api.auth.login)
  const registerMutation = useMutation(api.auth.register)
  const trackSession = useMutation(api.analytics.trackSessionEvent)

  useEffect(() => {
    const session = getSession()
    if (session) {
      setUser({
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
        subrole: session.subrole,
        organizationId: session.organizationId,
        _id: session.userId as Id<"users"> | undefined,
      })
      setSessionCookie(session.email)
      setSessionDataCookie(session.role, session.organizationId)
    }
    setInitialized(true)
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await loginMutation({ email: email.toLowerCase().trim(), password })
      if (!result) { setError("Credenziali non valide"); setIsLoading(false); return false }
      const u: User = {
        id: result._id,
        email: result.email,
        fullName: result.fullName || "",
        role: result.role as UserRole,
        subrole: (result.subrole as UserSubrole) || null,
        organizationId: result.organizationId,
        _id: result._id,
      }
      setUser(u)
      const orgIdForCookie = u.organizationId || ""
      setSession({ email: u.email, fullName: u.fullName, role: u.role, subrole: u.subrole, organizationId: orgIdForCookie, userId: u.id })
      setSessionCookie(u.email)
      setSessionDataCookie(u.role, orgIdForCookie)
      trackSession({ userEmail: u.email, sessionId: crypto.randomUUID(), event: "sign_in", userAgent: navigator.userAgent })
      setIsLoading(false)
      return true
    } catch (e: any) {
      setError(e.message || "Errore di accesso")
      setIsLoading(false)
      return false
    }
  }, [loginMutation])

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    subrole?: UserSubrole,
    phone?: string,
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await registerMutation({
        email: email.toLowerCase().trim(),
        password,
        fullName,
        role: role as "admin" | "supplier" | "collaborator" | "client" | "driver",
        subrole: subrole || undefined,
        organizationId: undefined,
        phone: phone || undefined,
      })
      if (!result) { setError("Errore registrazione"); setIsLoading(false); return false }
      const loginOk = await signIn(email, password)
      if (!loginOk) {
        setError("Account creato ma accesso non riuscito. Effettua il login manualmente.")
        setIsLoading(false)
      }
      return loginOk
    } catch (e: any) {
      setError(e.message || "Errore registrazione")
      setIsLoading(false)
      return false
    }
  }, [signIn, registerMutation])

  const signOut = useCallback(() => {
    if (user) {
      trackSession({ userEmail: user.email, sessionId: crypto.randomUUID(), event: "sign_out" })
    }
    setUser(null)
    clearSession()
    clearSessionCookie()
  }, [user, trackSession])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
        <div className="text-center">
          <Logo size="md" />
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
