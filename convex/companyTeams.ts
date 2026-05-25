import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("companyTeams")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
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
  },
  handler: async (ctx, args) => {
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
    await ctx.db.patch(id, data)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id("companyTeams") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return args.id
  },
})
