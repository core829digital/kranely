import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

// ═══════════════════════════════════════════════════════
// ACTIVITY LOG
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), entityType: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("activityLog").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.entityType) filtered = filtered.filter((l) => l.entityType === args.entityType)
    if (args.userEmail) filtered = filtered.filter((l) => l.userEmail === args.userEmail)

    return filtered
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    entityName: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const id = await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      entityName: args.entityName,
      details: args.details,
    })
    return id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const logs = await ctx.db
      .query("activityLog")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime() / 1000

    return {
      total: logs.length,
      today: logs.filter((l) => l._creationTime > todayTime).length,
      byType: {
        client: logs.filter((l) => l.entityType === "client").length,
        supplier: logs.filter((l) => l.entityType === "supplier").length,
        quote: logs.filter((l) => l.entityType === "quote").length,
        cantiere: logs.filter((l) => l.entityType === "cantiere").length,
        payment: logs.filter((l) => l.entityType === "payment").length,
        collaborator: logs.filter((l) => l.entityType === "collaborator").length,
        certificate: logs.filter((l) => l.entityType === "certificate").length,
        document: logs.filter((l) => l.entityType === "document").length,
      },
    }
  },
})
