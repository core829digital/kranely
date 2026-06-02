import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin) return []
    return await ctx.db
      .query("companyTeams")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
      .then((items) => items.sort((a, b) => b._creationTime - a._creationTime))
  },
})

export const get = query({
  args: { id: v.id("companyTeams"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
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
    companyEmail: v.string(),
    teamName: v.string(),
    companyName: v.optional(v.string()),
    members: v.optional(v.array(v.string())),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    const id = await ctx.db.insert("companyTeams", {
      organizationId: args.organizationId,
      companyEmail: args.companyEmail,
      teamName: args.teamName,
      companyName: args.companyName,
      members: args.members || [],
    })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("companyTeams"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    teamName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    members: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: prev.organizationId,
        userEmail: userEmail || "system",
        action: "updated",
        entityType: "companyTeam",
        entityId: id,
        entityName: prev.teamName,
        details: `Team "${prev.teamName}" aggiornato`,
      })
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("companyTeams"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    const prev = await ctx.db.get(args.id)
    if (!prev || prev.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: args.organizationId,
        userEmail: args.userEmail || "system",
        action: "deleted",
        entityType: "companyTeam",
        entityId: args.id,
        entityName: prev.teamName,
        details: `Team "${prev.teamName}" rimosso`,
      })
    }

    return args.id
  },
})
