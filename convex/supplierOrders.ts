import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"

// ═══════════════════════════════════════════════════════
// SUPPLIER ORDERS (Ordini Fornitori)
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), supplierId: v.optional(v.id("suppliers")), cantiereId: v.optional(v.id("cantieri")), quoteId: v.optional(v.id("quotes")), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("supplierOrders").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    const orders = await q.collect()

    let filtered = orders
    if (args.supplierId) filtered = filtered.filter((o) => o.supplierId === args.supplierId)
    if (args.cantiereId) filtered = filtered.filter((o) => o.cantiereId === args.cantiereId)
    if (args.quoteId) filtered = filtered.filter((o) => o.quoteId === args.quoteId)
    if (args.status && args.status !== "all") filtered = filtered.filter((o) => o.status === args.status)

    return filtered.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const get = query({
  args: { id: v.id("supplierOrders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    supplierId: v.id("suppliers"),
    cantiereId: v.optional(v.id("cantieri")),
    quoteId: v.optional(v.id("quotes")),
    requestId: v.optional(v.id("supplierRequests")),
    orderNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("confirmed"), v.literal("in_production"), v.literal("shipped"), v.literal("delivered"), v.literal("cancelled"))),
    expectedDelivery: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ...rest } = args
    const id = await ctx.db.insert("supplierOrders", { ...rest, status: args.status || "pending" })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: "system",
      action: "created",
      entityType: "supplierOrder",
      entityId: id,
      entityName: args.orderNumber,
      details: `Ordine fornitore "${args.orderNumber}" creato`,
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("supplierOrders"),
    orderNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("confirmed"), v.literal("in_production"), v.literal("shipped"), v.literal("delivered"), v.literal("cancelled"))),
    expectedDelivery: v.optional(v.string()),
    notes: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev) throw new Error("Ordine non trovato")
    await ctx.db.patch(id, data)

    if (data.status && data.status !== prev.status) {
      const statusLabels: Record<string, string> = {
        pending: "In attesa", confirmed: "Confermato", in_production: "In produzione",
        shipped: "Spedito", delivered: "Consegnato", cancelled: "Annullato",
      }

      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: prev.organizationId,
        userEmail: userEmail || "admin@kranely.demo",
        title: `Ordine ${statusLabels[data.status] || data.status}`,
        message: `L'ordine "${prev.orderNumber || prev.description}" è ora "${statusLabels[data.status] || data.status}"`,
        type: "order_status_change",
        priority: data.status === "delivered" ? "high" : "normal",
        link: "/suppliers",
      })

      if (data.status === "confirmed" && prev.totalAmount) {
        await ctx.db.insert("payments", {
          organizationId: prev.organizationId,
          type: "supplier",
          description: `Pagamento ordine ${prev.orderNumber || prev.description}`,
          amount: prev.totalAmount,
          status: "in_attesa",
          dueDate: prev.expectedDelivery || undefined,
          supplierId: prev.supplierId,
          orderId: id,
          cantiereId: prev.cantiereId,
        })
      }

      if (data.status === "delivered" && prev.cantiereId) {
        const cantiere = await ctx.db.get(prev.cantiereId)
        if (cantiere && cantiere.status !== "completato") {
          const allDelivered = await ctx.db
            .query("supplierOrders")
            .withIndex("by_cantiere", (q) => q.eq("cantiereId", prev.cantiereId!))
            .collect()
            .then((orders) => orders.every((o) => o.status === "delivered" || o._id === id))

          if (!allDelivered && prev.cantiereId) {
            await ctx.db.patch(prev.cantiereId, { status: "in_corso" })
          }
        }
      }
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("supplierOrders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id)
    if (!order) throw new Error("Supplier order not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("supplierOrders")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      inProduction: orders.filter((o) => o.status === "in_production").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      totalValue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    }
  },
})
