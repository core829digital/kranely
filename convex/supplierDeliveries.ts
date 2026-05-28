import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { resolveNotifTarget } from "./lib/helpers"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), supplierId: v.optional(v.id("suppliers")), cantiereId: v.optional(v.id("cantieri")), orderId: v.optional(v.id("supplierOrders")), status: v.optional(v.string()), driverId: v.optional(v.id("users")), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("supplierDeliveries").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.supplierId) filtered = filtered.filter((d) => d.supplierId === args.supplierId)
    if (args.cantiereId) filtered = filtered.filter((d) => d.cantiereId === args.cantiereId)
    if (args.orderId) filtered = filtered.filter((d) => d.orderId === args.orderId)
    if (args.driverId) filtered = filtered.filter((d) => d.driverId === args.driverId)
    if (args.status && args.status !== "all") filtered = filtered.filter((d) => d.status === args.status)

    return filtered
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
    userEmail: v.optional(v.string()),
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
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { ...rest } = args
    const id = await ctx.db.insert("supplierDeliveries", { ...rest, status: args.status || "pending" })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "created",
      entityType: "supplierDelivery",
      entityId: id,
      entityName: args.description,
      details: `Consegna "${args.description}" programmata`,
    })

    if (args.driverId) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: args.organizationId,
        userEmail: await resolveNotifTarget(ctx, args.organizationId),
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
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const prev = await ctx.db.get(args.id)
    if (!prev || prev.organizationId !== args.organizationId) throw new Error("Not found")
    const { userEmail, ...data } = args
    await ctx.db.patch(args.id, data)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "updated",
      entityType: "supplierDelivery",
      entityId: args.id,
      entityName: prev.description,
      details: `Consegna "${prev.description}" aggiornata`,
    })

    if (data.status && data.status !== prev.status) {
      const statusLabels: Record<string, string> = {
        pending: "In attesa", partito: "Partito", in_transito: "In transito", consegnato: "Consegnato",
      }
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: prev.organizationId,
        userEmail: await resolveNotifTarget(ctx, prev.organizationId, userEmail),
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
            const allOrders = await ctx.db
              .query("supplierOrders")
              .withIndex("by_cantiere", (q) => q.eq("cantiereId", prev.cantiereId!))
              .collect()
            const allDelivered = allOrders.every((o) => o.status === "delivered")
            await ctx.db.patch(prev.cantiereId, { status: allDelivered ? "completato" : "in_corso" })
          }
        }
      }
    }

    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id("supplierDeliveries"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const delivery = await ctx.db.get(args.id)
    if (!delivery || delivery.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "supplierDelivery",
      entityId: args.id,
      entityName: delivery.description,
      details: `Consegna "${delivery.description}" eliminata`,
    })

    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
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
    const items = await ctx.db
      .query("supplierDeliveries")
      .collect()
    const filtered = items.filter((d) => d.productionId === args.productionId)
    return filtered.sort((a, b) => b._creationTime - a._creationTime)
  },
})
