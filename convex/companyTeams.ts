import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    return await ctx.db
      .query("companyTeams")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
      .then((items) => items.sort((a, b) => b._creationTime - a._creationTime))
  },
})

export const get = query({
  args: { id: v.id("companyTeams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
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
    teamName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    members: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args
    const prev = await ctx.db.get(id)
    await ctx.db.patch(id, data)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: prev.organizationId,
        userEmail: "system",
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
  args: { id: v.id("companyTeams") },
  handler: async (ctx, args) => {
    const prev = await ctx.db.get(args.id)
    await ctx.db.delete(args.id)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: prev.organizationId,
        userEmail: "system",
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
