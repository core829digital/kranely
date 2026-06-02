import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), conversationId: v.optional(v.string()), quoteId: v.optional(v.id("quotes")), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("quotePolls").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.conversationId) filtered = filtered.filter((p) => p.conversationId === args.conversationId)
    if (args.quoteId) filtered = filtered.filter((p) => p.quoteId === args.quoteId)
    return filtered
  },
})

export const get = query({
  args: { id: v.id("quotePolls"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin && user.role !== "anonymous" && user.role !== "client") {
      throw new Error("Not found")
    }
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
    userEmail: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin" && user.role !== "client") {
      throw new Error("Not authorized: only admin or client can create quote polls")
    }
    const { createdById, ...rest } = args
    const id = await ctx.db.insert("quotePolls", { ...rest, status: args.status || "active", createdById })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("quotePolls"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    votes: v.optional(v.any()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin" && user.role !== "client") {
      throw new Error("Not authorized: only admin or client can update quote polls")
    }
    const { id, organizationId, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: args.userEmail || "system",
      action: "updated",
      entityType: "quotePoll",
      entityId: id,
      entityName: prev.title,
      details: `Sondaggio preventivo "${prev.title}" aggiornato`,
    })

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("quotePolls"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized: only admin can delete quote polls")
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "quotePoll",
      entityId: args.id,
      entityName: doc.title,
      details: `Sondaggio preventivo "${doc.title}" eliminato`,
    })

    return args.id
  },
})
