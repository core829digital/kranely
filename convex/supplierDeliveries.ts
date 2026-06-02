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
    const isDwa = user.role === "admin" || user.role === "superadmin"
    if (!isDwa && user.role !== "anonymous") {
      if (user.role === "driver" && user.userId) {
        filtered = filtered.filter((d) => d.driverId === user.userId)
      } else if (user.role === "supplier") {
        const supplierDoc = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
        if (supplierDoc) filtered = filtered.filter((d) => d.supplierId === supplierDoc._id); else filtered = []
      } else {
        filtered = []
      }
    }
    if (args.supplierId) filtered = filtered.filter((d) => d.supplierId === args.supplierId)
    if (args.cantiereId) filtered = filtered.filter((d) => d.cantiereId === args.cantiereId)
    if (args.orderId) filtered = filtered.filter((d) => d.orderId === args.orderId)
    if (args.driverId) filtered = filtered.filter((d) => d.driverId === args.driverId)
    if (args.status && args.status !== "all") filtered = filtered.filter((d) => d.status === args.status)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("supplierDeliveries"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin && user.role !== "anonymous") {
      if (user.role === "driver") {
        if (doc.driverId !== user.userId) throw new Error("Not found")
      } else if (user.role === "supplier") {
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

export const getDeliveriesForCantiere = query({
  args: { cantiereId: v.id("cantieri"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const items = await ctx.db
      .query("supplierDeliveries")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
    return items
      .filter((d) => d.cantiereId === args.cantiereId)
      .sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const confirmByClient = mutation({
  args: {
    deliveryId: v.id("supplierDeliveries"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const delivery = await ctx.db.get(args.deliveryId)
    if (!delivery || delivery.organizationId !== args.organizationId) throw new Error("Consegna non trovata")

    if (delivery.cantiereId) {
      const cantiere = await ctx.db.get(delivery.cantiereId)
      if (!cantiere) throw new Error("Cantiere non trovato")
      const clientDoc = await ctx.db
        .query("clients")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .filter((q: any) => q.eq(q.field("email"), user.email))
        .first()
      if (!clientDoc || cantiere.clientId !== clientDoc._id) {
        throw new Error("Accesso negato: puoi confermare solo consegne dei tuoi cantieri")
      }
    }

    await ctx.db.patch(args.deliveryId, {
      status: "consegnato",
      deliveryDate: new Date().toISOString().split("T")[0],
      confirmedArrival: user.email,
    })

    if (delivery.orderId) {
      await ctx.db.patch(delivery.orderId, { status: "delivered" })
    }
    if (delivery.cantiereId) {
      const allDeliveries = await ctx.db
        .query("supplierDeliveries")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect()
      const allDone = allDeliveries
        .filter((d) => d.cantiereId === delivery.cantiereId)
        .every((d) => d._id === args.deliveryId || (d as any).status === "consegnato" || d.status === "consegnato")
      const cantiere = await ctx.db.get(delivery.cantiereId)
      if (cantiere && cantiere.status !== "completato") {
        await ctx.db.patch(delivery.cantiereId, { status: allDone ? "completato" : "in_corso" })
      }
    }

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "updated",
      entityType: "supplierDelivery",
      entityId: args.deliveryId,
      entityName: delivery.description,
      details: `Consegna "${delivery.description}" confermata dal cliente`,
    })

    return args.deliveryId
  },
})

export const listByProduction = query({
  args: { productionId: v.id("supplierProduction"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const production = await ctx.db.get(args.productionId)
    if (!production || production.organizationId !== args.organizationId) throw new Error("Production not found")
    const items = await ctx.db
      .query("supplierDeliveries")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
    const filtered = items.filter((d) => d.productionId === args.productionId)
    return filtered.sort((a, b) => b._creationTime - a._creationTime)
  },
})
