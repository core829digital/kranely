import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    return await ctx.db
      .query("referralCodes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
      .then((items) => items.sort((a, b) => b._creationTime - a._creationTime))
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    code: v.string(),
    discountPercent: v.number(),
    description: v.optional(v.string()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const id = await ctx.db.insert("referralCodes", {
      organizationId: args.organizationId,
      code: args.code,
      discountPercent: args.discountPercent,
      description: args.description,
      isActive: true,
      usesCount: 0,
      maxUses: args.maxUses,
    })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("referralCodes"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    code: v.optional(v.string()),
    discountPercent: v.optional(v.number()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: prev.organizationId,
        userEmail: userEmail || "system",
        action: "updated",
        entityType: "referralCode",
        entityId: id,
        entityName: prev.code,
        details: `Codice referral "${prev.code}" aggiornato`,
      })
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("referralCodes"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const prev = await ctx.db.get(args.id)
    if (!prev || prev.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: args.organizationId,
        userEmail: args.userEmail || "system",
        action: "deleted",
        entityType: "referralCode",
        entityId: args.id,
        entityName: prev.code,
        details: `Codice referral "${prev.code}" rimosso`,
      })
    }

    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const codes = await ctx.db
      .query("referralCodes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      total: codes.length,
      active: codes.filter((c) => c.isActive).length,
      totalUses: codes.reduce((sum, c) => sum + (c.usesCount || 0), 0),
    }
  },
})
