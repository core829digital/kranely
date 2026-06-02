import { v } from "convex/values"
import { query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

const ALLOWED_TABLES = new Set([
  "supplierOrders",
  "quotes",
  "cantieri",
  "payments",
  "supplierRequests",
])

export const getNextNumber = query({
  args: {
    organizationId: v.id("organizations"),
    prefix: v.string(),
    table: v.string(),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!ALLOWED_TABLES.has(args.table)) {
      throw new Error(`getNextNumber: table "${args.table}" is not in the allowlist`)
    }
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const year = new Date().getFullYear()
    const items = await ctx.db.query(args.table as any).collect()
    const orgItems = items.filter((i: any) =>
      i.organizationId === args.organizationId &&
      i.orderNumber &&
      i.orderNumber.startsWith(`${args.prefix}-${year}`)
    )
    const maxNum = orgItems.reduce((max: number, item: any) => {
      const num = parseInt(item.orderNumber.split("-").pop() || "0", 10)
      return num > max ? num : max
    }, 0)
    return `${args.prefix}-${year}-${String(maxNum + 1).padStart(3, "0")}`
  },
})
