import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const get = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db
      .query("paymentSettings")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first()
    return doc || null
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    accontoB2cPct: v.optional(v.number()),
    accontoB2bPct: v.optional(v.number()),
    intermedioPct: v.optional(v.number()),
    saldoPct: v.optional(v.number()),
    customClientOverrides: v.optional(v.any()),
    customSupplierOverrides: v.optional(v.any()),
    updatedById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { updatedById, ...rest } = args
    const existing = await ctx.db
      .query("paymentSettings")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { ...rest, updatedById })
      return existing._id
    }
    const id = await ctx.db.insert("paymentSettings", { ...rest, updatedById })
    return id
  },
})

export const update = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    accontoB2cPct: v.optional(v.number()),
    accontoB2bPct: v.optional(v.number()),
    intermedioPct: v.optional(v.number()),
    saldoPct: v.optional(v.number()),
    customClientOverrides: v.optional(v.any()),
    customSupplierOverrides: v.optional(v.any()),
    updatedById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { organizationId, updatedById, ...data } = args
    const existing = await ctx.db
      .query("paymentSettings")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .first()
    if (!existing) throw new Error("Payment settings not found")
    await ctx.db.patch(existing._id, { ...data, updatedById })

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: args.userEmail || "system",
      action: "updated",
      entityType: "paymentSettings",
      entityId: existing._id,
      details: `Impostazioni pagamento aggiornate`,
    })

    return existing._id
  },
})

export const remove = mutation({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const existing = await ctx.db
      .query("paymentSettings")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first()
    if (!existing) throw new Error("Not found")
    await ctx.db.delete(existing._id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "paymentSettings",
      entityId: existing._id,
      details: `Impostazioni pagamento rimosse`,
    })

    return existing._id
  },
})
