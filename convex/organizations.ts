import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect()
  },
})

export const get = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()
  },
})

export const create = mutation({
  args: { name: v.string(), slug: v.string(), ownerEmail: v.string() },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      ownerEmail: args.ownerEmail,
      plan: "free",
      status: "trial",
    })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise"))),
    status: v.optional(v.union(v.literal("trial"), v.literal("active"), v.literal("suspended"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args
    await ctx.db.patch(id, data)
    return id
  },
})

export const listUsers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
  },
})

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    fullName: v.optional(v.string()),
    role: v.optional(v.union(v.literal("superadmin"), v.literal("admin"), v.literal("supplier"), v.literal("driver"), v.literal("collaborator"), v.literal("client"))),
    subrole: v.optional(v.union(v.literal("serramenti"), v.literal("edilizia"), v.literal("generale"))),
    companyRole: v.optional(v.string()),
    workSector: v.optional(v.string()),
    phone: v.optional(v.string()),
    blocked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Utente non trovato")
    await ctx.db.patch(id, data)
    return id
  },
})

export const removeUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)
    if (!existing) throw new Error("Utente non trovato")
    await ctx.db.delete(args.id)
    return args.id
  },
})
