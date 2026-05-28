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
    let items
    if (args.supplierId) {
      items = await ctx.db.query("supplierProduction").withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId!)).collect()
    } else {
      items = await ctx.db.query("supplierProduction").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    }
    let filtered = items.sort((a, b) => b._creationTime - a._creationTime)
    if (args.orderId) filtered = filtered.filter((p) => p.orderId === args.orderId)
    if (args.status && args.status !== "all") filtered = filtered.filter((p) => p.status === args.status)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("supplierProduction"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
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
    const { userEmail, ...rest } = args
    const id = await ctx.db.insert("supplierProduction", { ...rest, status: args.status || "pending", completed: args.completed || 0 })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: "system",
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
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, userEmail, ...data } = args
    const record = await ctx.db.get(id)
    if (!record) throw new Error("Record produzione non trovato")

    await checkSupplierAccess(ctx, record.supplierId, userEmail)
    await ctx.db.patch(id, data)

    if (data.phase === "pronto" && record.phase !== "pronto") {
      const order = record.orderId ? await ctx.db.get(record.orderId) : null

      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: record.organizationId,
        userEmail: userEmail,
        title: "Produzione completata!",
        message: `L'ordine ${order?.orderNumber || "N/A"} è pronto in produzione per "${record.description}".`,
        type: "production_ready",
        priority: "high",
        link: "/suppliers",
      })

      const existingDeliveries = await ctx.db.query("supplierDeliveries").collect()
        .then((ds) => ds.filter((d) => d.orderId === record.orderId))

      if (!existingDeliveries.length && record.orderId) {
        await ctx.db.insert("supplierDeliveries", {
          organizationId: record.organizationId,
          supplierId: record.supplierId,
          orderId: record.orderId,
          productionId: id,
          description: `Consegna: ${record.description}`,
          status: "pending",
          expectedDate: record.estimatedCompletion || undefined,
          cantiereId: order?.cantiereId || undefined,
        })
      }

      if (order && order.status !== "in_production") {
        await ctx.db.patch(record.orderId!, { status: "in_production" })
      }
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("supplierProduction") },
  handler: async (ctx, args) => {
    const prod = await ctx.db.get(args.id)
    if (!prod) throw new Error("Production record not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const production = await ctx.db
      .query("supplierProduction")
      .collect()
      .then((items) => items.filter((p) => p.organizationId === args.organizationId))

    return {
      total: production.length,
      pending: production.filter((p) => p.status === "pending").length,
      inProgress: production.filter((p) => p.status === "in_progress").length,
      completed: production.filter((p) => p.status === "completed").length,
    }
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
