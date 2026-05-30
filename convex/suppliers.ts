import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { resolveNotifTarget } from "./lib/helpers"
import { assertOrgAccess } from "./auth"

// ═══════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), search: v.optional(v.string()), type: v.optional(v.string()), status: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const requestingUser = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.search) {
      const s = args.search.toLowerCase()
      filtered = filtered.filter((supplier) => supplier.name?.toLowerCase().includes(s) || supplier.email.toLowerCase().includes(s) || (supplier.companyName && supplier.companyName.toLowerCase().includes(s)))
    }
    if (args.type && args.type !== "all") filtered = filtered.filter((supplier) => supplier.type === args.type)
    if (args.status && args.status !== "all") filtered = filtered.filter((supplier) => supplier.status === args.status)

    const isAdmin = requestingUser.role === "admin" || requestingUser.role === "superadmin"
    if (!isAdmin && requestingUser.role !== "anonymous") {
      filtered = filtered.filter((supplier) => supplier.email === requestingUser.email)
    }

    return filtered
  },
})

export const get = query({
  args: { id: v.id("suppliers"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    companyName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    address: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    type: v.union(v.literal("subprod"), v.literal("subeng"), v.literal("material"), v.literal("general"), v.literal("equipment"), v.literal("service"), v.literal("logistics")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"))),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    supplierCode: v.optional(v.string()),
    invitationCode: v.optional(v.string()),
    whatsappLink: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userEmail, ...rest } = args
    const user = await assertOrgAccess(ctx, userEmail, rest.organizationId)
    const id = await ctx.db.insert("suppliers", { ...rest, status: args.status || "pending" })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      action: "created",
      entityType: "supplier",
      entityId: id,
      entityName: args.companyName,
      details: `Fornitore "${args.companyName}" aggiunto`,
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("suppliers"),
    organizationId: v.id("organizations"),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    address: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    type: v.optional(v.union(v.literal("subprod"), v.literal("subeng"), v.literal("material"), v.literal("general"), v.literal("equipment"), v.literal("service"), v.literal("logistics"))),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"))),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    whatsappLink: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, userEmail, ...data } = args
    const user = await assertOrgAccess(ctx, userEmail, organizationId)
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      action: "updated",
      entityType: "supplier",
      entityId: id,
      entityName: prev.companyName,
      details: `Fornitore "${prev.companyName}" aggiornato`,
    })

    if (data.status && data.status !== prev.status) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: prev.organizationId,
        userEmail: await resolveNotifTarget(ctx, prev.organizationId, userEmail),
        title: "Stato fornitore aggiornato",
        message: `Il fornitore "${prev.companyName}" è ora "${data.status === "active" ? "Attivo" : data.status === "inactive" ? "Inattivo" : "In attesa"}"`,
        type: "supplier_status_change",
        priority: data.status === "active" ? "normal" : "high",
        link: "/suppliers",
      })
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("suppliers"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const supplier = await ctx.db.get(args.id)
    if (!supplier || supplier.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "supplier",
      entityId: args.id,
      entityName: supplier.companyName,
      details: `Fornitore "${supplier.companyName}" rimosso`,
    })

    return args.id
  },
})

export const generateInvite = mutation({
  args: {
    supplierId: v.id("suppliers"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const supplier = await ctx.db.get(args.supplierId)
    if (!supplier) throw new Error("Fornitore non trovato")

    const code = `INV-SUP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    await ctx.db.patch(args.supplierId, {
      invitationCode: code,
      invitationStatus: "pending",
      invitationSentDate: new Date().toISOString(),
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: await resolveNotifTarget(ctx, args.organizationId),
      title: "Invito fornitore generato",
      message: `Codice invito per ${supplier.companyName}: ${code}`,
      type: "supplier_invite",
      priority: "normal",
      link: "/suppliers",
    })

    return { code }
  },
})

export const acceptInvite = mutation({
  args: {
    invitationCode: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("by_invitation", (q) => q.eq("invitationCode", args.invitationCode))
      .first()

    if (!supplier) throw new Error("Codice invito non valido")
    if (supplier.invitationStatus === "accepted") throw new Error("Invito già utilizzato")
    if (supplier.invitationStatus === "expired") throw new Error("Invito scaduto")

    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("Utente non trovato")

    await ctx.db.patch(supplier._id, {
      userId: args.userId,
      invitationStatus: "accepted",
      status: "active",
    })

    await ctx.db.patch(args.userId, {
      role: "supplier",
    })

    return true
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      total: suppliers.length,
      active: suppliers.filter((s) => s.status === "active").length,
      pending: suppliers.filter((s) => s.status === "pending").length,
      inactive: suppliers.filter((s) => s.status === "inactive").length,
      byType: {
        material: suppliers.filter((s) => s.type === "material").length,
        equipment: suppliers.filter((s) => s.type === "equipment").length,
        subprod: suppliers.filter((s) => s.type === "subprod").length,
        general: suppliers.filter((s) => s.type === "general").length,
      },
    }
  },
})
