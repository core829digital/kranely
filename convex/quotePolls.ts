import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: { organizationId: v.id("organizations"), conversationId: v.optional(v.string()), quoteId: v.optional(v.id("quotes")) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("quotePolls").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    const polls = await q.collect()
    let filtered = polls
    if (args.conversationId) filtered = filtered.filter((p) => p.conversationId === args.conversationId)
    if (args.quoteId) filtered = filtered.filter((p) => p.quoteId === args.quoteId)
    return filtered.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const get = query({
  args: { id: v.id("quotePolls"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    conversationId: v.string(),
    quoteId: v.optional(v.id("quotes")),
    documentId: v.optional(v.id("documents")),
    title: v.string(),
    description: v.optional(v.string()),
    options: v.array(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"))),
    createdById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args
    const id = await ctx.db.insert("quotePolls", { ...rest, status: args.status || "active", createdById })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("quotePolls"),
    organizationId: v.id("organizations"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    votes: v.optional(v.any()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"))),
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
  args: { id: v.id("quotePolls"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})
