"use client"

import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

export function useOrgId(): Id<"organizations"> | null {
  const org = useQuery(api.orgProvision.getDefault, {})
  return org ? org._id : null
}
