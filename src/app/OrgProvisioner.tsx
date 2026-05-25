"use client"

import { useEffect, useState } from "react"
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
          <div className="w-8 h-8 rounded-lg bg-kranely-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-kranely-app-bg font-bold text-lg">K</span>
          </div>
          <p className="text-white/60 text-sm">Inizializzazione...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
