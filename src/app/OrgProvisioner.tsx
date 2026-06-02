"use client"

import { useEffect, useRef } from "react"
import { Logo } from "@/components/Logo"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export function OrgProvisioner({ children }: { children: React.ReactNode }) {
  const getOrCreate = useMutation(api.orgProvision.getOrCreateDefault)
  const org = useQuery(api.orgProvision.getDefault, {})
  const provisionAttempted = useRef(false)

  useEffect(() => {
    if (org === undefined || provisionAttempted.current) return
    if (org === null) {
      provisionAttempted.current = true
      getOrCreate().catch(() => {
        provisionAttempted.current = false
      })
    }
  }, [org, getOrCreate])

  if (org === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
        <div className="text-center">
          <Logo size="md" />
          <p className="text-white/60 text-sm">Inizializzazione...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
