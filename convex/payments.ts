import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { resolveNotifTarget } from "./lib/helpers"
import { assertOrgAccess } from "./auth"

// ═══════════════════════════════════════════════════════
// PAYMENTS (Pagamenti)
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), cantiereId: v.optional(v.id("cantieri")), clientId: v.optional(v.id("clients")), status: v.optional(v.string()), type: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("payments").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    const isPwa = user.role === "admin" || user.role === "superadmin"
    if (!isPwa && user.role !== "anonymous") {
      if (user.role === "client") {
        const clientDoc = await ctx.db.query("clients").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
        if (clientDoc) filtered = filtered.filter((p) => p.clientId === clientDoc._id); else filtered = []
      } else if (user.role === "supplier") {
        const supplierDoc = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
        if (supplierDoc) filtered = filtered.filter((p) => p.supplierId === supplierDoc._id); else filtered = []
      } else {
        filtered = []
      }
    }
    if (args.cantiereId) filtered = filtered.filter((p) => p.cantiereId === args.cantiereId)
    if (args.clientId) filtered = filtered.filter((p) => p.clientId === args.clientId)
    if (args.status && args.status !== "all") filtered = filtered.filter((p) => p.status === args.status)
    if (args.type && args.type !== "all") filtered = filtered.filter((p) => p.type === args.type)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("payments"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const getWithProof = query({
  args: { id: v.id("payments"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.id)
    if (!payment || payment.organizationId !== args.organizationId) throw new Error("Not found")
    let proofDoc = null
    if (payment.proofDocId) {
      proofDoc = await ctx.db.get(payment.proofDocId)
    }
    return { payment, proofDoc }
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    type: v.union(v.literal("supplier"), v.literal("collaborator"), v.literal("client")),
    description: v.string(),
    amount: v.number(),
    status: v.optional(v.union(v.literal("in_attesa"), v.literal("in_verifica"), v.literal("pagato"), v.literal("in_ritardo"), v.literal("parziale"))),
    dueDate: v.optional(v.string()),
    paidDate: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    cantiereId: v.optional(v.id("cantieri")),
    supplierId: v.optional(v.id("suppliers")),
    collaboratorId: v.optional(v.id("collaborators")),
    method: v.optional(v.union(v.literal("bonifico"), v.literal("contanti"), v.literal("carta"), v.literal("paypal"), v.literal("altro"))),
    proofDocId: v.optional(v.id("documents")),
    notes: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userEmail, ...rest } = args
    const user = await assertOrgAccess(ctx, userEmail, args.organizationId)
    const id = await ctx.db.insert("payments", { ...rest, status: args.status || "in_attesa" })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      action: "created",
      entityType: "payment",
      entityId: id,
      entityName: args.description,
      details: `Pagamento "${args.description}" di EUR${args.amount} creato`,
    })

    if (args.dueDate) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: args.organizationId,
        userEmail: await resolveNotifTarget(ctx, args.organizationId, userEmail),
        title: "Nuovo pagamento in arrivo",
        message: `Pagamento di EUR${args.amount.toLocaleString("it-IT")} "${args.description}" in scadenza il ${new Date(args.dueDate).toLocaleDateString("it-IT")}`,
        type: "payment_due",
        priority: "normal",
        link: "/payments",
      })
    }

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("payments"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    status: v.optional(v.union(v.literal("in_attesa"), v.literal("in_verifica"), v.literal("pagato"), v.literal("in_ritardo"), v.literal("parziale"))),
    dueDate: v.optional(v.string()),
    paidDate: v.optional(v.string()),
    method: v.optional(v.union(v.literal("bonifico"), v.literal("carta"), v.literal("paypal"), v.literal("altro"))),
    proofDocId: v.optional(v.id("documents")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, userEmail, ...data } = args
    const user = await assertOrgAccess(ctx, userEmail, organizationId)
    const doc = await ctx.db.get(id)
    if (!doc || doc.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: userEmail || "system",
      action: "updated",
      entityType: "payment",
      entityId: id,
      entityName: doc.description,
      details: `Pagamento "${doc.description}" aggiornato`,
    })

    return id
  },
})

export const markAsPaid = mutation({
  args: {
    id: v.id("payments"),
    organizationId: v.id("organizations"),
    paidDate: v.optional(v.string()),
    proofDocId: v.optional(v.id("documents")),
    method: v.optional(v.union(v.literal("bonifico"), v.literal("contanti"), v.literal("carta"), v.literal("paypal"), v.literal("altro"))),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const payment = await ctx.db.get(args.id)
    if (!payment || payment.organizationId !== args.organizationId) throw new Error("Payment not found")

    const patch: any = {
      status: "pagato",
      paidDate: args.paidDate || new Date().toISOString().split("T")[0],
    }
    if (args.proofDocId) patch.proofDocId = args.proofDocId
    if (args.method) patch.method = args.method

    await ctx.db.patch(args.id, patch)

    await ctx.db.insert("activityLog", {
      organizationId: payment.organizationId,
      userEmail: args.userEmail || "system",
      action: "marked_paid",
      entityType: "payment",
      entityId: args.id,
      entityName: payment.description,
      details: `Pagamento "${payment.description}" di EUR${payment.amount.toLocaleString("it-IT")} segnato come pagato${args.proofDocId ? " con ricevuta" : ""}`,
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: payment.organizationId,
      userEmail: await resolveNotifTarget(ctx, payment.organizationId),
      title: "Pagamento ricevuto",
      message: `Pagamento di EUR${payment.amount.toLocaleString("it-IT")} "${payment.description}" è stato segnato come pagato`,
      type: "payment_received",
      priority: "normal",
      link: "/payments",
    })

    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id("payments"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const payment = await ctx.db.get(args.id)
    if (!payment || payment.organizationId !== args.organizationId) throw new Error("Not found")

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "payment",
      entityId: args.id,
      entityName: payment.description,
      details: `Pagamento "${payment.description}" eliminato`,
    })

    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let payments = await ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const isPwa = user.role === "admin" || user.role === "superadmin"
    if (!isPwa && user.role !== "anonymous") {
      if (user.role === "client") {
        const clientDoc = await ctx.db.query("clients").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
        if (clientDoc) payments = payments.filter((p) => p.clientId === clientDoc._id); else payments = []
      } else if (user.role === "supplier") {
        const supplierDoc = await ctx.db.query("suppliers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
        if (supplierDoc) payments = payments.filter((p) => p.supplierId === supplierDoc._id); else payments = []
      } else {
        payments = []
      }
    }

    const incoming = payments.filter((p) => p.type === "client")
    const outgoing = payments.filter((p) => p.type === "supplier" || p.type === "collaborator")

    return {
      total: payments.length,
      pending: payments.filter((p) => p.status === "in_attesa").length,
      paid: payments.filter((p) => p.status === "pagato").length,
      overdue: payments.filter((p) => p.status === "in_ritardo").length,
      totalIncoming: incoming.reduce((sum, p) => sum + p.amount, 0),
      totalOutgoing: outgoing.reduce((sum, p) => sum + p.amount, 0),
      paidIncoming: incoming.filter((p) => p.status === "pagato").reduce((sum, p) => sum + p.amount, 0),
      paidOutgoing: outgoing.filter((p) => p.status === "pagato").reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments.filter((p) => p.status === "in_attesa").reduce((sum, p) => sum + p.amount, 0),
      overdueAmount: payments.filter((p) => p.status === "in_ritardo").reduce((sum, p) => sum + p.amount, 0),
    }
  },
})
