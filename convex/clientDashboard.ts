import { v } from "convex/values"
import { query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const getClientDashboard = query({
  args: { organizationId: v.id("organizations"), clientEmail: v.string(), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)

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

    return {
      clientId: client._id,
      client,
      cantieri: {
        total: cantieri.length,
        active: cantieri.filter((c) => c.status === "in_corso").length,
        completed: cantieri.filter((c) => c.status === "completato").length,
        planned: cantieri.filter((c) => c.status === "pianificato").length,
        list: cantieri,
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
    }
  },
})
