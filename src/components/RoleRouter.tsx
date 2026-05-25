"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const ROLE_ROUTES: Record<string, string> = {
  admin: "/dashboard",
  superadmin: "/dashboard",
  supplier: "/supplier-dashboard",
  client: "/client-dashboard",
  collaborator: "/collaborator-dashboard",
  driver: "/driver-dashboard",
}

export function RoleRouter() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      const target = ROLE_ROUTES[user.role]
      if (target) {
        router.replace(target)
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-kranely-app-bg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-kranely-accent animate-spin mx-auto mb-4" />
          <p className="text-white/60">Caricamento...</p>
        </div>
      </div>
    )
  }

  return null
}
