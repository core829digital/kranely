"use client"

import { useEffect, useState } from "react"
import { Logo } from "@/components/Logo"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export function OrgProvisioner({ children }: { children: React.ReactNode }) {
  const [provisioned, setProvisioned] = useState(false)
  const getOrCreate = useMutation(api.orgProvision.getOrCreateDefault)
  const org = useQuery(api.orgProvision.getDefault, {})

  useEffect(() => {
    if (!org && !provisioned) {
      getOrCreate().then(() => setProvisioned(true)).catch(() => setProvisioned(true))
    } else if (org) {
      setProvisioned(true)
    }
  }, [org, getOrCreate, provisioned])

  if (!provisioned) {
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
