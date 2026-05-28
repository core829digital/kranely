import { v } from "convex/values"
import { query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

// ═══════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════

export const overview = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const cantieri = await ctx.db
      .query("cantieri")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const collaborators = await ctx.db
      .query("collaborators")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const today = new Date().toISOString().split("T")[0]
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const incoming = payments.filter((p) => p.type === "client")
    const outgoing = payments.filter((p) => p.type === "supplier" || p.type === "collaborator")

    return {
      clients: {
        total: clients.length,
        active: clients.filter((c) => c.status === "active").length,
        leads: clients.filter((c) => c.status === "lead").length,
      },
      quotes: {
        total: quotes.length,
        accepted: quotes.filter((q) => q.status === "accepted").length,
        pending: quotes.filter((q) => q.status === "sent").length,
        totalValue: quotes.reduce((sum, q) => sum + (q.estimatedPrice || 0), 0),
      },
      cantieri: {
        total: cantieri.length,
        inCorso: cantieri.filter((c) => c.status === "in_corso").length,
        completati: cantieri.filter((c) => c.status === "completato").length,
      },
      payments: {
        totalIncoming: incoming.reduce((sum, p) => sum + p.amount, 0),
        totalOutgoing: outgoing.reduce((sum, p) => sum + p.amount, 0),
        pending: payments.filter((p) => p.status === "in_attesa").reduce((sum, p) => sum + p.amount, 0),
        overdue: payments.filter((p) => p.status === "in_ritardo").reduce((sum, p) => sum + p.amount, 0),
      },
      suppliers: {
        total: suppliers.length,
        active: suppliers.filter((s) => s.status === "active").length,
      },
      collaborators: {
        total: collaborators.length,
        active: collaborators.filter((c) => c.status === "active").length,
      },
      certificates: {
        total: certificates.length,
        expiringSoon: certificates.filter((c) => c.expiryDate && c.expiryDate <= thirtyDays && c.expiryDate >= today).length,
        expired: certificates.filter((c) => c.expiryDate && c.expiryDate < today).length,
      },
    }
  },
})

export const revenueTrend = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const paid = payments.filter((p) => p.status === "pagato")

    // Group by month
    const monthly: Record<string, { incoming: number; outgoing: number }> = {}

    for (const p of paid) {
      let date = p.paidDate || p.dueDate
      if (!date) {
        const ts = p._creationTime
        const d = new Date(ts)
        date = d.toISOString().slice(0, 7)
      }
      const key = date.slice(0, 7) // YYYY-MM
      if (!monthly[key]) monthly[key] = { incoming: 0, outgoing: 0 }

      if (p.type === "client") monthly[key].incoming += p.amount
      else monthly[key].outgoing += p.amount
    }

    const sorted = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)

    return sorted.map(([month, data]) => ({ month, ...data }))
  },
})

export const clientDistribution = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return [
      { name: "B2B", value: clients.filter((c) => c.clientType === "b2b").length },
      { name: "B2C", value: clients.filter((c) => c.clientType === "b2c").length },
    ]
  },
})

export const cantiereStatus = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const cantieri = await ctx.db
      .query("cantieri")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return [
      { name: "Pianificati", value: cantieri.filter((c) => c.status === "pianificato").length },
      { name: "In Corso", value: cantieri.filter((c) => c.status === "in_corso").length },
      { name: "Completati", value: cantieri.filter((c) => c.status === "completato").length },
      { name: "Sospesi", value: cantieri.filter((c) => c.status === "sospeso").length },
    ]
  },
})

export const quoteStatus = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return [
      { name: "Draft", value: quotes.filter((q) => q.status === "draft").length },
      { name: "Sent", value: quotes.filter((q) => q.status === "sent").length },
      { name: "Accepted", value: quotes.filter((q) => q.status === "accepted").length },
      { name: "Rejected", value: quotes.filter((q) => q.status === "rejected").length },
    ]
  },
})

export const recentActivity = query({
  args: { organizationId: v.id("organizations"), limit: v.optional(v.number()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const limit = args.limit || 20
    const logs = await ctx.db
      .query("activityLog")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(limit)

    return logs
  },
})

export const budgetReconciliation = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)

    const cantieri = await ctx.db
      .query("cantieri")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const cantiereBudgets = cantieri
      .filter((c) => c.totalBudget && c.totalBudget > 0)
      .map((c) => {
        const cantierePayments = payments.filter((p) => p.cantiereId === c._id && p.type === "client")
        const spent = cantierePayments.filter((p) => p.status === "pagato").reduce((s, p) => s + p.amount, 0)
        const pending = cantierePayments.filter((p) => p.status === "in_attesa" || p.status === "in_ritardo").reduce((s, p) => s + p.amount, 0)
        return {
          cantiereId: c._id,
          cantiereName: c.name,
          budget: c.totalBudget!,
          spent,
          pending,
          remaining: Math.max(0, c.totalBudget! - spent),
          usagePercent: Math.round((spent / c.totalBudget!) * 100),
          status: spent > c.totalBudget! ? "over" : spent / c.totalBudget! > 0.8 ? "warning" : spent === 0 ? "unused" : "on_track",
        }
      })

    const totalBudget = cantieri.reduce((s, c) => s + (c.totalBudget || 0), 0)
    const totalSpent = cantiereBudgets.reduce((s, c) => s + c.spent, 0)
    const totalPending = cantiereBudgets.reduce((s, c) => s + c.pending, 0)

    return {
      cantieri: cantiereBudgets.sort((a, b) => b.budget - a.budget),
      totals: {
        budget: totalBudget,
        spent: totalSpent,
        pending: totalPending,
        remaining: Math.max(0, totalBudget - totalSpent),
        usagePercent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      },
      overBudget: cantiereBudgets.filter((c) => c.status === "over").length,
      onTrack: cantiereBudgets.filter((c) => c.status === "on_track").length,
      warning: cantiereBudgets.filter((c) => c.status === "warning").length,
      unused: cantiereBudgets.filter((c) => c.status === "unused").length,
    }
  },
})
