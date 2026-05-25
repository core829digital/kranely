import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: { organizationId: v.id("organizations"), category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("jobTitles").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    const items = await q.collect()
    let filtered = items
    if (args.category && args.category !== "all") filtered = filtered.filter((j) => j.category === args.category)
    return filtered.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const get = query({
  args: { id: v.id("jobTitles"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    category: v.union(v.literal("construction"), v.literal("office"), v.literal("other")),
    createdById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args
    const id = await ctx.db.insert("jobTitles", { ...rest, createdById })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("jobTitles"),
    organizationId: v.id("organizations"),
    title: v.optional(v.string()),
    category: v.optional(v.union(v.literal("construction"), v.literal("office"), v.literal("other"))),
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
  args: { id: v.id("jobTitles"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})
