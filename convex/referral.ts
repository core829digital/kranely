import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("referralCodes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    code: v.string(),
    discountPercent: v.number(),
    description: v.optional(v.string()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
    code: v.optional(v.string()),
    discountPercent: v.optional(v.number()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args
    await ctx.db.patch(id, data)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id("referralCodes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
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
