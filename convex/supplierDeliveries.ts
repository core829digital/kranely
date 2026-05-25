import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"

export const list = query({
  args: { organizationId: v.id("organizations"), supplierId: v.optional(v.id("suppliers")), cantiereId: v.optional(v.id("cantieri")), orderId: v.optional(v.id("supplierOrders")), status: v.optional(v.string()), driverId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("supplierDeliveries").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    const deliveries = await q.collect()

    let filtered = deliveries
    if (args.supplierId) filtered = filtered.filter((d) => d.supplierId === args.supplierId)
    if (args.cantiereId) filtered = filtered.filter((d) => d.cantiereId === args.cantiereId)
    if (args.orderId) filtered = filtered.filter((d) => d.orderId === args.orderId)
    if (args.driverId) filtered = filtered.filter((d) => d.driverId === args.driverId)
    if (args.status && args.status !== "all") filtered = filtered.filter((d) => d.status === args.status)

    return filtered.sort((a, b) => (b.expectedDate || "").localeCompare(a.expectedDate || ""))
  },
})

export const get = query({
  args: { id: v.id("supplierDeliveries"), organizationId: v.id("organizations") },
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
    cantiereId: v.optional(v.id("cantieri")),
    orderId: v.optional(v.id("supplierOrders")),
    productionId: v.optional(v.id("supplierProduction")),
    description: v.optional(v.string()),
    expectedDate: v.optional(v.string()),
    deliveryDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("partito"), v.literal("in_transito"), v.literal("consegnato"))),
    driverId: v.optional(v.id("users")),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    driverVehicle: v.optional(v.string()),
    driverLicensePlate: v.optional(v.string()),
    documents: v.optional(v.array(v.string())),
    loadManifest: v.optional(v.any()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ...rest } = args
    const id = await ctx.db.insert("supplierDeliveries", { ...rest, status: args.status || "pending" })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: "system",
      action: "created",
      entityType: "supplierDelivery",
      entityId: id,
      entityName: args.description,
      details: `Consegna "${args.description}" programmata`,
    })

    if (args.driverId) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: args.organizationId,
        userEmail: "admin@kranely.demo",
        title: "Nuova consegna assegnata",
        message: `Consegna "${args.description}" programmata per il ${args.expectedDate}`,
        type: "delivery_assigned",
        priority: "normal",
        link: "/suppliers",
      })
    }

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("supplierDeliveries"),
    organizationId: v.id("organizations"),
    description: v.optional(v.string()),
    expectedDate: v.optional(v.string()),
    deliveryDate: v.optional(v.string()),
    actualDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("partito"), v.literal("in_transito"), v.literal("consegnato"))),
    driverId: v.optional(v.id("users")),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    driverVehicle: v.optional(v.string()),
    driverLicensePlate: v.optional(v.string()),
    documents: v.optional(v.array(v.string())),
    loadManifest: v.optional(v.any()),
    notes: v.optional(v.string()),
    confirmedArrival: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (data.status && data.status !== prev.status) {
      const statusLabels: Record<string, string> = {
        pending: "In attesa", partito: "Partito", in_transito: "In transito", consegnato: "Consegnato",
      }
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: prev.organizationId,
        userEmail: userEmail || "admin@kranely.demo",
        title: `Consegna ${statusLabels[data.status] || data.status}`,
        message: `La consegna "${prev.description}" è ora "${statusLabels[data.status] || data.status}"`,
        type: "delivery_status_change",
        priority: data.status === "consegnato" ? "high" : "normal",
        link: "/suppliers",
      })

      if (data.status === "consegnato") {
        if (prev.orderId) {
          await ctx.db.patch(prev.orderId, { status: "delivered" })
        }
        if (prev.cantiereId) {
          const cantiere = await ctx.db.get(prev.cantiereId)
          if (cantiere && cantiere.status !== "completato") {
            await ctx.db.patch(prev.cantiereId, { status: "completato" })
          }
        }
      }
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("supplierDeliveries"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.id)
    if (!delivery || delivery.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const deliveries = await ctx.db
      .query("supplierDeliveries")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      total: deliveries.length,
      pending: deliveries.filter((d) => d.status === "pending").length,
      inTransit: deliveries.filter((d) => d.status === "in_transito").length,
      delivered: deliveries.filter((d) => d.status === "consegnato").length,
      partito: deliveries.filter((d) => d.status === "partito").length,
    }
  },
})

export const listByProduction = query({
  args: { productionId: v.id("supplierProduction") },
  handler: async (ctx, args) => {
    const deliveries = await ctx.db
      .query("supplierDeliveries")
      .collect()
      .then((items) => items.filter((d) => d.productionId === args.productionId))

    return deliveries.sort((a, b) => (b.expectedDate || "").localeCompare(a.expectedDate || ""))
  },
})
