import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess, assertAdmin } from "./auth"

export const list = query({
  args: { userEmail: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.userEmail)
    return await ctx.db.query("organizations").collect().then((items) => items.sort((a, b) => b._creationTime - a._creationTime))
  },
})

export const get = query({
  args: { id: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.userEmail) await assertOrgAccess(ctx, args.userEmail, args.id)
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
    userEmail: v.optional(v.string()),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise"))),
    status: v.optional(v.union(v.literal("trial"), v.literal("active"), v.literal("suspended"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.id)
    const { id, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: id,
        userEmail: userEmail || "system",
        action: "updated",
        entityType: "organization",
        entityId: id,
        entityName: prev.name,
        details: `Organizzazione "${prev.name}" aggiornata`,
      })
    }

    return id
  },
})

export const listUsers = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    return await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
      .then((items) => items.sort((a, b) => b._creationTime - a._creationTime))
  }
})

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    fullName: v.optional(v.string()),
    role: v.optional(v.union(v.literal("superadmin"), v.literal("admin"), v.literal("supplier"), v.literal("driver"), v.literal("collaborator"), v.literal("client"))),
    subrole: v.optional(v.union(v.literal("serramenti"), v.literal("edilizia"), v.literal("generale"))),
    companyRole: v.optional(v.string()),
    workSector: v.optional(v.string()),
    phone: v.optional(v.string()),
    blocked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { id, organizationId, userEmail, ...data } = args
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Utente non trovato")
    await ctx.db.patch(id, data)

    if (existing.organizationId) {
      await ctx.db.insert("activityLog", {
        organizationId: existing.organizationId,
        userEmail: userEmail || "system",
        action: "updated",
        entityType: "user",
        entityId: id,
        entityName: existing.fullName || existing.email,
        details: `Utente "${existing.fullName || existing.email}" aggiornato`,
      })
    }

    return id
  },
})

export const removeUser = mutation({
  args: { id: v.id("users"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const existing = await ctx.db.get(args.id)
    if (!existing) throw new Error("Utente non trovato")
    await ctx.db.delete(args.id)

    if (existing.organizationId) {
      await ctx.db.insert("activityLog", {
        organizationId: args.organizationId,
        userEmail: args.userEmail || "system",
        action: "deleted",
        entityType: "user",
        entityId: args.id,
        entityName: existing.fullName || existing.email,
        details: `Utente "${existing.fullName || existing.email}" rimosso`,
      })
    }

    return args.id
  },
})
