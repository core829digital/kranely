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
    assertAdmin(args.ownerEmail)
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
    accountType: v.optional(v.union(v.literal("manufacturer"), v.literal("reseller"))),
    onboardingCompleted: v.optional(v.boolean()),
    companyName: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    materialsUsed: v.optional(v.array(v.string())),
    hardwareBrands: v.optional(v.array(v.string())),
    profileDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    logo: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev) throw new Error("Not found")
    if (!userEmail) throw new Error("userEmail required")
    const auth = await assertOrgAccess(ctx, userEmail, id)
    if (auth.role !== "admin" && auth.role !== "superadmin") throw new Error("Accesso negato")
    await ctx.db.patch(id, data)
    await ctx.db.insert("activityLog", {
      organizationId: id,
      userEmail,
      action: "updated",
      entityType: "organization",
      entityId: id,
      entityName: prev.name,
      details: `Organizzazione "${prev.name}" aggiornata`,
    })
    return id
  },
})

export const updateCompanyProfile = mutation({
  args: {
    id: v.id("organizations"),
    userEmail: v.string(),
    companyName: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    materialsUsed: v.optional(v.array(v.string())),
    hardwareBrands: v.optional(v.array(v.string())),
    profileDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    logo: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev) throw new Error("Not found")
    const auth = await assertOrgAccess(ctx, userEmail, id)
    if (auth.role !== "admin" && auth.role !== "superadmin") throw new Error("Accesso negato")
    await ctx.db.patch(id, data)
    return id
  },
})

export const getPublicProfile = query({
  args: { orgId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId)
    if (!org) throw new Error("Not found")
    if (!org.accountType) throw new Error("Profile not completed")
    return {
      _id: org._id,
      _creationTime: org._creationTime,
      accountType: org.accountType,
      companyName: org.companyName || org.name,
      vatNumber: org.vatNumber,
      country: org.country,
      city: org.city,
      specializations: org.specializations,
      materialsUsed: org.materialsUsed,
      hardwareBrands: org.hardwareBrands,
      profileDescription: org.profileDescription,
      website: org.website,
      logo: org.logo,
      contactPhone: org.contactPhone,
      employeeCount: org.employeeCount,
      metrics: org.metrics,
    }
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
    subrole: v.optional(v.union(v.literal("serramenti"), v.literal("edilizia"), v.literal("generale"), v.literal("factory"), v.literal("office"), v.literal("construction"))),
    companyRole: v.optional(v.string()),
    workSector: v.optional(v.string()),
    phone: v.optional(v.string()),
    blocked: v.optional(v.boolean()),
    onboardingCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, userEmail, ...data } = args
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Utente non trovato")
    if (!userEmail) throw new Error("userEmail required")
    await assertOrgAccess(ctx, userEmail, organizationId)
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
    assertAdmin(args.userEmail)
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
