import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
  },
})

export const get = query({
  args: { id: v.id("subscriptions"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const getActive = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
    return subs.find((s) => s.status === "active" || s.status === "trialing") || null
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    status: v.optional(v.union(v.literal("active"), v.literal("past_due"), v.literal("canceled"), v.literal("trialing"))),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    currentPeriodStart: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("subscriptions", {
      ...args,
      status: args.status || "trialing",
    })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("subscriptions"),
    organizationId: v.id("organizations"),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise"))),
    status: v.optional(v.union(v.literal("active"), v.literal("past_due"), v.literal("canceled"), v.literal("trialing"))),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    currentPeriodStart: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id("subscriptions"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})
