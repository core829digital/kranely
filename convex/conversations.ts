import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), clientEmail: v.optional(v.string()), adminEmail: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("conversations").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin && user.role !== "anonymous") {
      filtered = filtered.filter((c) => c.clientEmail === user.email || c.adminEmail === user.email)
    }
    if (args.clientEmail) filtered = filtered.filter((c) => c.clientEmail === args.clientEmail)
    if (args.adminEmail) filtered = filtered.filter((c) => c.adminEmail === args.adminEmail)
    return filtered
  },
})

export const get = query({
  args: { id: v.id("conversations"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin && user.role !== "anonymous") {
      if (user.role === "client" && doc.clientEmail !== user.email) throw new Error("Not found")
      else if (user.role === "collaborator" && doc.adminEmail !== user.email) throw new Error("Not found")
      else if (user.role === "supplier" && doc.adminEmail !== user.email) throw new Error("Not found")
      else if (user.role === "driver" && doc.adminEmail !== user.email) throw new Error("Not found")
    }
    return doc
  },
})

export const findByParticipants = query({
  args: { organizationId: v.id("organizations"), clientEmail: v.string(), adminEmail: v.string(), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
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
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
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
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { id, organizationId, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin) {
      const isParticipant = prev.clientEmail === user.email || prev.adminEmail === user.email
      if (!isParticipant) throw new Error("Not authorized: only conversation participants or admin can update")
    }
    await ctx.db.patch(id, data)

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: args.userEmail || "system",
      action: "updated",
      entityType: "conversation",
      entityId: id,
      details: `Conversazione cliente aggiornata`,
    })

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("conversations"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin) {
      const isParticipant = doc.clientEmail === user.email || doc.adminEmail === user.email
      if (!isParticipant) throw new Error("Not authorized: only conversation participants or admin can delete")
    }
    const messages = await ctx.db
      .query("conversationMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
      .collect()
    for (const msg of messages) {
      await ctx.db.delete(msg._id)
    }
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "conversation",
      entityId: args.id,
      details: `Conversazione eliminata`,
    })

    return args.id
  },
})
