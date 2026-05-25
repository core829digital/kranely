import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"

export const list = query({
  args: { organizationId: v.id("organizations"), clientEmail: v.optional(v.string()), adminEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("conversations").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    const convs = await q.collect()
    let filtered = convs
    if (args.clientEmail) filtered = filtered.filter((c) => c.clientEmail === args.clientEmail)
    if (args.adminEmail) filtered = filtered.filter((c) => c.adminEmail === args.adminEmail)
    return filtered.sort((a, b) => (b.lastMessageDate || "") > (a.lastMessageDate || "") ? 1 : -1)
  },
})

export const get = query({
  args: { id: v.id("conversations"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const findByParticipants = query({
  args: { organizationId: v.id("organizations"), clientEmail: v.string(), adminEmail: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("conversations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("clientEmail"), args.clientEmail))
      .filter((q) => q.eq(q.field("adminEmail"), args.adminEmail))
      .first()
    return doc || null
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    clientEmail: v.string(),
    adminEmail: v.string(),
    clientName: v.optional(v.string()),
    adminName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("clientEmail"), args.clientEmail))
      .filter((q) => q.eq(q.field("adminEmail"), args.adminEmail))
      .first()
    if (existing) return existing._id
    const id = await ctx.db.insert("conversations", {
      ...args,
      lastMessage: "",
      lastMessageDate: undefined,
      unreadClient: 0,
      unreadAdmin: 0,
    })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("conversations"),
    organizationId: v.id("organizations"),
    lastMessage: v.optional(v.string()),
    lastMessageDate: v.optional(v.string()),
    unreadClient: v.optional(v.number()),
    unreadAdmin: v.optional(v.number()),
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
  args: { id: v.id("conversations"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    const messages = await ctx.db
      .query("conversationMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
      .collect()
    for (const msg of messages) {
      await ctx.db.delete(msg._id)
    }
    await ctx.db.delete(args.id)
    return args.id
  },
})
