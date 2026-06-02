import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { assertOrgAccess } from "./auth"

async function checkSupplierAccess(ctx: any, supplierId: any, userEmail: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", userEmail))
    .first()

  if (!user) throw new Error("Utente non trovato")

  const isAdmin = user.role === "admin" || user.role === "superadmin"
  const isSupplier = user.role === "supplier"

  if (isAdmin) return true

  if (isSupplier) {
    const supplier = await ctx.db.get(supplierId)
    if (supplier && supplier.email === userEmail) return true
    throw new Error("Accesso negato: puoi modificare solo i tuoi dati")
  }

  throw new Error("Accesso negato: solo fornitori e admin possono modificare")
}

// ═══════════════════════════════════════════════════════
// SUPPLIER PRODUCTION (Produzione Fornitori)
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), supplierId: v.optional(v.id("suppliers")), orderId: v.optional(v.id("supplierOrders")), status: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let items = await ctx.db.query("supplierProduction").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    const isPwa = user.role === "admin" || user.role === "superadmin"
    if (!isPwa && user.role !== "anonymous" && user.role === "supplier") {
      const supplierDoc = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
      if (supplierDoc) items = items.filter((p) => p.supplierId === supplierDoc._id); else items = []
    }
    if (args.supplierId) items = items.filter((p) => p.supplierId === args.supplierId)
    let filtered = items.sort((a, b) => b._creationTime - a._creationTime)
    if (args.orderId) filtered = filtered.filter((p) => p.orderId === args.orderId)
    if (args.status && args.status !== "all") filtered = filtered.filter((p) => p.status === args.status)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("supplierProduction"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin && user.role !== "anonymous") {
      if (user.role === "supplier") {
        const supplierDoc = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
        if (!supplierDoc || doc.supplierId !== supplierDoc._id) throw new Error("Not found")
      } else {
        throw new Error("Not found")
      }
    }
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    supplierId: v.id("suppliers"),
    orderId: v.optional(v.id("supplierOrders")),
    description: v.optional(v.string()),
    quantity: v.optional(v.number()),
    completed: v.optional(v.number()),
    phase: v.optional(v.union(v.literal("materiali_ricevuti"), v.literal("taglio"), v.literal("assemblaggio"), v.literal("controllo_qualita"), v.literal("pronto"))),
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"))),
    startedDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
    estimatedCompletion: v.optional(v.string()),
    notes: v.optional(v.string()),
    progressPercentage: v.optional(v.number()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin && user.role !== "supplier") throw new Error("Not authorized")
    if (!isAdmin) {
      const supplierDoc = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
      if (!supplierDoc || supplierDoc._id !== args.supplierId) throw new Error("Not authorized: suppliers can only create their own production")
    }
    const { userEmail, ...rest } = args
    const id = await ctx.db.insert("supplierProduction", { ...rest, status: args.status || "pending", completed: args.completed || 0 })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      action: "created",
      entityType: "supplierProduction",
      entityId: id,
      entityName: args.description,
      details: `Produzione "${args.description}" avviata`,
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("supplierProduction"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    phase: v.optional(v.string()),
    status: v.optional(v.string()),
    progressPercentage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin && user.role !== "supplier") throw new Error("Not authorized")
    const { id, organizationId, userEmail, ...data } = args
    const record = await ctx.db.get(id)
    if (!record || record.organizationId !== organizationId) throw new Error("Record produzione non trovato")
    if (!isAdmin) {
      const supplierDoc = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
      if (!supplierDoc || supplierDoc._id !== record.supplierId) throw new Error("Not authorized: suppliers can only update their own production")
    }
    await ctx.db.patch(id, data as any)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "updated",
      entityType: "supplierProduction",
      entityId: args.id,
      details: `Produzione "${record.description}" aggiornata`,
    })

    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id("supplierProduction"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    const prod = await ctx.db.get(args.id)
    if (!prod || prod.organizationId !== args.organizationId) throw new Error("Production record not found")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "supplierProduction",
      entityId: args.id,
      details: "Produzione record rimosso",
    })

    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let production = await ctx.db
      .query("supplierProduction")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const isPwa = user.role === "admin" || user.role === "superadmin"
    if (!isPwa && user.role !== "anonymous" && user.role === "supplier") {
      const supplierDoc = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
      if (supplierDoc) production = production.filter((p) => p.supplierId === supplierDoc._id); else production = []
    }

    return {
      total: production.length,
      pending: production.filter((p) => p.status === "pending").length,
      inProgress: production.filter((p) => p.status === "in_progress").length,
      completed: production.filter((p) => p.status === "completed").length,
    }
  },
})

export const getProductionByOrderForClient = query({
  args: { orderId: v.id("supplierOrders"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const records = await ctx.db
      .query("supplierProduction")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect()
    return records.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      orderId: r.orderId,
      description: r.description,
      quantity: r.quantity,
      completed: r.completed,
      phase: r.phase,
      status: r.status,
      startedDate: r.startedDate,
      completedDate: r.completedDate,
      estimatedCompletion: r.estimatedCompletion,
      progressPercentage: r.progressPercentage,
    }))
  },
})

export const canEdit = query({
  args: { userEmail: v.string(), supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .first()

    if (!user) return { canEdit: false, role: "client" }

    const isAdmin = user.role === "admin" || user.role === "superadmin"
    const isSupplier = user.role === "supplier"

    if (isAdmin) return { canEdit: true, role: "admin" }

    if (isSupplier) {
      const supplier = await ctx.db.get(args.supplierId)
      const isOwner = supplier && supplier.email === args.userEmail
      return { canEdit: !!isOwner, role: "supplier" }
    }

    return { canEdit: false, role: user.role }
  },
})
