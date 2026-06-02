import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { resolveNotifTarget } from "./lib/helpers"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), supplierId: v.optional(v.id("suppliers")), status: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("supplierRequests").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    const isRwa = user.role === "admin" || user.role === "superadmin"
    if (!isRwa && user.role !== "anonymous" && user.role === "supplier") {
      const supplierDoc = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
      if (supplierDoc) filtered = filtered.filter((r) => r.supplierId === supplierDoc._id); else filtered = []
    }
    if (args.supplierId) filtered = filtered.filter((r) => r.supplierId === args.supplierId)
    if (args.status && args.status !== "all") filtered = filtered.filter((r) => r.status === args.status)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("supplierRequests"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    supplierId: v.optional(v.id("suppliers")),
    title: v.string(),
    description: v.optional(v.string()),
    fixtureType: v.optional(v.string()),
    fixtureSpecs: v.optional(v.any()),
    photos: v.optional(v.array(v.string())),
    quantity: v.optional(v.number()),
    urgency: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    cantiereId: v.optional(v.id("cantieri")),
    clientId: v.optional(v.id("clients")),
    quoteId: v.optional(v.id("quotes")),
    dimensions: v.optional(v.any()),
    material: v.optional(v.string()),
    color: v.optional(v.string()),
    glassType: v.optional(v.string()),
    budgetEstimate: v.optional(v.number()),
    neededBy: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { userEmail, ...rest } = args
    const id = await ctx.db.insert("supplierRequests", { ...rest, status: "draft", depositPaid: false })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      action: "created",
      entityType: "supplierRequest",
      entityId: id,
      entityName: args.title,
      details: `Richiesta "${args.title}" creata`,
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("supplierRequests"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("received"), v.literal("quoted"), v.literal("accepted"), v.literal("rejected"), v.literal("preventivato"))),
    supplierId: v.optional(v.id("suppliers")),
    quotedPrice: v.optional(v.number()),
    supplierNotes: v.optional(v.string()),
    depositPaid: v.optional(v.boolean()),
    depositPaymentId: v.optional(v.id("payments")),
    conversionOrderId: v.optional(v.id("supplierOrders")),
    supplierQuoteDocId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: prev.organizationId,
        userEmail: userEmail || "system",
        action: "updated",
        entityType: "supplierRequest",
        entityId: id,
        entityName: prev.title,
        details: `Richiesta "${prev.title}" aggiornata`,
      })
    }

    return id
  },
})

export const convertToOrder = mutation({
  args: {
    requestId: v.id("supplierRequests"),
    organizationId: v.id("organizations"),
    supplierId: v.id("suppliers"),
    totalAmount: v.number(),
    expectedDelivery: v.optional(v.string()),
    notes: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error("Richiesta non trovata")
    if (!request.depositPaymentId) throw new Error("L'acconto deve essere pagato prima di convertire in ordine")
    const depositPayment = await ctx.db.get(request.depositPaymentId)
    if (!depositPayment || depositPayment.status !== "pagato") throw new Error("L'acconto deve essere pagato prima di convertire in ordine")

    const orderId = await ctx.db.insert("supplierOrders", {
      organizationId: args.organizationId,
      supplierId: args.supplierId,
      requestId: args.requestId,
      cantiereId: request.cantiereId,
      quoteId: request.quoteId,
      orderNumber: `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      description: request.title,
      totalAmount: args.totalAmount,
      status: "confirmed",
      expectedDelivery: args.expectedDelivery,
      notes: args.notes,
      accontoPaid: true,
      accontoPaymentId: request.depositPaymentId,
      produzioneSbloccata: true,
    })

    await ctx.db.patch(args.requestId, {
      status: "accepted",
      conversionOrderId: orderId,
      depositPaid: true,
    })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "converted",
      entityType: "supplierRequest",
      entityId: args.requestId,
      entityName: request.title,
      details: `Richiesta "${request.title}" convertita in ordine ${orderId}`,
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: await resolveNotifTarget(ctx, args.organizationId),
      title: "Nuovo ordine generato",
      message: `La richiesta "${request.title}" è stata convertita in ordine con importo EUR${args.totalAmount.toLocaleString("it-IT")}`,
      type: "order_created",
      priority: "high",
      link: "/suppliers",
    })

    return orderId
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), supplierId: v.optional(v.id("suppliers")), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let q = ctx.db.query("supplierRequests").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    const requests = await q.collect()

    let filtered = requests
    if (args.supplierId) filtered = filtered.filter((r) => r.supplierId === args.supplierId)

    return {
      total: filtered.length,
      draft: filtered.filter((r) => r.status === "draft").length,
      sent: filtered.filter((r) => r.status === "sent").length,
      quoted: filtered.filter((r) => r.status === "quoted" || r.status === "preventivato").length,
      accepted: filtered.filter((r) => r.status === "accepted").length,
      depositPending: filtered.filter((r) => r.status === "accepted" && !r.depositPaid).length,
    }
  },
})

export const remove = mutation({
  args: { id: v.id("supplierRequests"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const existing = await ctx.db.get(args.id)
    if (!existing || existing.organizationId !== args.organizationId) throw new Error("Richiesta non trovata")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "supplierRequest",
      entityId: args.id,
      entityName: existing.title,
      details: `Richiesta fornitore "${existing.title}" eliminata`,
    })

    return args.id
  },
})
