import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("reviews")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .collect()
    return items.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20)
  },
})

export const list = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const items = await ctx.db
      .query("reviews")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
    return items.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const submit = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    text: v.string(),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be 1-5")
    if (args.text.length < 10) throw new Error("Il testo della recensione deve essere di almeno 10 caratteri")
    const id = await ctx.db.insert("reviews", {
      organizationId: args.organizationId,
      name: args.name,
      email: args.email,
      company: args.company,
      text: args.text,
      rating: args.rating,
      approved: false,
      createdAt: Date.now(),
    })
    return id
  },
})

export const approve = mutation({
  args: { id: v.id("reviews"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    await ctx.db.patch(args.id, { approved: true })
    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id("reviews"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const all = await ctx.db
      .query("reviews")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
    const approved = all.filter((r) => r.approved)
    const avgRating = approved.length > 0
      ? Math.round((approved.reduce((s, r) => s + r.rating, 0) / approved.length) * 10) / 10
      : 0
    return {
      total: all.length,
      approved: approved.length,
      pending: all.filter((r) => !r.approved).length,
      averageRating: avgRating,
    }
  },
})