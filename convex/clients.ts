import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { assertOrgAccess } from "./auth"

// ═══════════════════════════════════════════════════════
// ORGANIZATIONS
// ═══════════════════════════════════════════════════════

export const createOrganization = mutation({
  args: { name: v.string(), slug: v.string(), ownerEmail: v.string() },
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      ownerEmail: args.ownerEmail,
      plan: "free",
      status: "trial",
    })
    return orgId
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

// ═══════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════

export const createOrUpdateUser = mutation({
  args: {
    email: v.string(),
    fullName: v.optional(v.string()),
    role: v.optional(v.union(v.literal("superadmin"), v.literal("admin"), v.literal("supplier"), v.literal("collaborator"), v.literal("client"))),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (existing) {
      const patch: Record<string, unknown> = {}
      if (args.fullName !== undefined) patch.fullName = args.fullName
      if (args.role !== undefined) patch.role = args.role
      if (args.organizationId !== undefined) patch.organizationId = args.organizationId
      await ctx.db.patch(existing._id, patch)
      return existing._id
    }

    return await ctx.db.insert("users", {
      email: args.email,
      fullName: args.fullName,
      role: args.role || "client",
      organizationId: args.organizationId,
    })
  },
})

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()
  },
})

export const getByOrganization = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    return await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
  },
})

// ═══════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), search: v.optional(v.string()), type: v.optional(v.string()), status: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("clients").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.search) {
      const s = args.search.toLowerCase()
      filtered = filtered.filter((c) => c.fullName.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || (c.companyName && c.companyName.toLowerCase().includes(s)))
    }
    if (args.type && args.type !== "all") filtered = filtered.filter((c) => c.clientType === args.type)
    if (args.status && args.status !== "all") filtered = filtered.filter((c) => c.status === args.status)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("clients"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const createClient = mutation({
  args: {
    organizationId: v.id("organizations"),
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    fiscalCode: v.optional(v.string()),
    companyName: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    type: v.union(v.literal("b2b"), v.literal("b2c")),
    status: v.optional(v.union(v.literal("lead"), v.literal("active"), v.literal("archived"))),
    notes: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { createdById, userEmail, ...rest } = args
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)

    const id = await ctx.db.insert("clients", { ...rest, status: args.status || "lead", clientType: args.type, createdById })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: "system",
      action: "created",
      entityType: "client",
      entityId: id,
      entityName: args.fullName,
      details: `Cliente "${args.fullName}" creato`,
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      title: "Nuovo cliente",
      message: `Cliente "${args.fullName}" aggiunto come ${args.type === "b2b" ? "azienda" : "privato"}`,
      type: "client_created",
      priority: "normal",
      link: "/clients",
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("clients"),
    organizationId: v.id("organizations"),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    fiscalCode: v.optional(v.string()),
    companyName: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    type: v.optional(v.union(v.literal("b2b"), v.literal("b2c"))),
    status: v.optional(v.union(v.literal("lead"), v.literal("active"), v.literal("archived"))),
    notes: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (data.status && data.status !== prev.status) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: prev.organizationId,
        userEmail: userEmail || "system",
        title: "Stato cliente aggiornato",
        message: `Il cliente "${prev.fullName}" è ora "${data.status === "active" ? "Attivo" : data.status === "lead" ? "Lead" : "Archiviato"}"`,
        type: "client_status_change",
        priority: "normal",
        link: "/clients",
      })
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("clients"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const client = await ctx.db.get(args.id)
    if (!client || client.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      total: clients.length,
      active: clients.filter((c) => c.status === "active").length,
      leads: clients.filter((c) => c.status === "lead").length,
      archived: clients.filter((c) => c.status === "archived").length,
      b2b: clients.filter((c) => c.clientType === "b2b").length,
      b2c: clients.filter((c) => c.clientType === "b2c").length,
    }
  },
})
