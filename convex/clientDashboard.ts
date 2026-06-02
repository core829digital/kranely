import { v } from "convex/values"
import { query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const getClientDashboard = query({
  args: { organizationId: v.id("organizations"), clientEmail: v.string(), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"

    if (!isAdmin && user.role === "client" && user.email !== args.clientEmail) {
      throw new Error("clientDashboard: client can only access their own dashboard")
    }

    const client = await ctx.db
      .query("clients")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("email"), args.clientEmail))
      .first()

    if (!client) return null

    const cantieri = await ctx.db
      .query("cantieri")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect()

    const cantieriIds = cantieri.map((c) => c._id)

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect()

    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect()

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect()

    const totalBudget = cantieri.reduce((s, c) => s + (c.totalBudget || 0), 0)
    const totalPaid = payments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0)
    const totalPending = payments.filter((p) => p.status === "in_attesa" || p.status === "in_ritardo").reduce((s, p) => s + p.amount, 0)

    const supplierOrders = (
      await Promise.all(
        cantieriIds.map((cId) =>
          ctx.db
            .query("supplierOrders")
            .withIndex("by_cantiere", (q) => q.eq("cantiereId", cId))
            .collect()
        )
      )
    ).flat()
    const nonFinancialOrders = supplierOrders.map((o) => ({
      _id: o._id,
      _creationTime: o._creationTime,
      supplierId: o.supplierId,
      orderNumber: o.orderNumber,
      description: o.description,
      status: o.status,
      expectedDelivery: o.expectedDelivery,
      deliveryDate: o.deliveryDate,
      cantiereId: o.cantiereId,
    }))

    const allDeliveries = await ctx.db
      .query("supplierDeliveries")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
    const cantiereDeliveries = allDeliveries.filter((d) => d.cantiereId && cantieriIds.some((cId) => cId === d.cantiereId))

    const supplierProductionRaw = (
      await Promise.all(
        supplierOrders.map((o) =>
          ctx.db
            .query("supplierProduction")
            .withIndex("by_order", (q) => q.eq("orderId", o._id))
            .collect()
        )
      )
    ).flat()
    const supplierProduction = isAdmin
      ? supplierProductionRaw
      : supplierProductionRaw.map((p) => ({
          _id: p._id,
          _creationTime: p._creationTime,
          orderId: p.orderId,
          supplierId: p.supplierId,
          description: p.description,
          quantity: p.quantity,
          completed: p.completed,
          phase: p.phase,
          status: p.status,
          startedDate: p.startedDate,
          completedDate: p.completedDate,
          estimatedCompletion: p.estimatedCompletion,
          progressPercentage: p.progressPercentage,
        }))

    return {
      clientId: client._id,
      client,
      cantieri: {
        total: cantieri.length,
        active: cantieri.filter((c) => c.status === "in_corso").length,
        completed: cantieri.filter((c) => c.status === "completato").length,
        planned: cantieri.filter((c) => c.status === "pianificato").length,
        list: cantieri.map((c) => ({ ...c, totalBudget: undefined })),
      },
      payments: {
        total: payments.length,
        paid: payments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0),
        pending: totalPending,
        overdue: payments.filter((p) => p.status === "in_ritardo").reduce((s, p) => s + p.amount, 0),
        list: payments.sort((a, b) => b._creationTime - a._creationTime).slice(0, 10),
      },
      quotes: {
        total: quotes.length,
        accepted: quotes.filter((q) => q.status === "accepted").length,
        pending: quotes.filter((q) => q.status === "draft" || q.status === "sent").length,
        list: quotes.sort((a, b) => b._creationTime - a._creationTime).slice(0, 10),
        totalValue: quotes.reduce((s, q) => s + (q.estimatedPrice || 0), 0),
      },
      documents: {
        total: documents.length,
        list: documents.sort((a, b) => b._creationTime - a._creationTime).slice(0, 10),
      },
      budget: {
        total: totalBudget,
        spent: totalPaid,
        remaining: Math.max(0, totalBudget - totalPaid),
        usagePercent: totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0,
      },
      supplierTracking: {
        orders: nonFinancialOrders,
        deliveries: cantiereDeliveries,
        production: supplierProduction,
      },
    }
  },
})
