import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
      .then((items) => items.sort((a, b) => b._creationTime - a._creationTime))
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
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
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
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userEmail, ...rest } = args
    const user = await assertOrgAccess(ctx, userEmail, rest.organizationId)
    const id = await ctx.db.insert("subscriptions", {
      ...rest,
      status: rest.status || "trialing",
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
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, userEmail, ...data } = args
    const user = await assertOrgAccess(ctx, userEmail, organizationId)
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: userEmail || "system",
      action: "updated",
      entityType: "subscription",
      entityId: id,
      entityName: prev.plan,
      details: `Abbonamento aggiornato a "${data.plan || prev.plan}"`,
    })

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("subscriptions"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "subscription",
      entityId: args.id,
      entityName: doc.plan,
      details: `Abbonamento "${doc.plan}" rimosso`,
    })

    return args.id
  },
})
