import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), category: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin) return []
    let filtered = await ctx.db.query("jobTitles").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.category && args.category !== "all") filtered = filtered.filter((j) => j.category === args.category)
    return filtered
  },
})

export const get = query({
  args: { id: v.id("jobTitles"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin) throw new Error("Not found")
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    title: v.string(),
    category: v.union(v.literal("construction"), v.literal("office"), v.literal("other")),
    createdById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    const { createdById, ...rest } = args
    const id = await ctx.db.insert("jobTitles", { ...rest, createdById })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("jobTitles"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    title: v.optional(v.string()),
    category: v.optional(v.union(v.literal("construction"), v.literal("office"), v.literal("other"))),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    const { id, organizationId, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: args.userEmail || "system",
      action: "updated",
      entityType: "jobTitle",
      entityId: id,
      entityName: prev.title,
      details: `Mansione "${prev.title}" aggiornata`,
    })

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("jobTitles"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "jobTitle",
      entityId: args.id,
      entityName: doc.title,
      details: `Mansione "${doc.title}" eliminata`,
    })

    return args.id
  },
})
