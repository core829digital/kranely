import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const ADMIN_EMAIL = "contact.core829@gmail.com"

function assertAdmin(email: string | null | undefined): void {
  if (!email || email.toLowerCase().trim() !== ADMIN_EMAIL) {
    throw new Error("Accesso negato — solo l'amministratore può visualizzare queste informazioni")
  }
}

// ═══════════════════════════════════════════════════════
// TRACKING
// ═══════════════════════════════════════════════════════

export const trackPageView = mutation({
  args: {
    path: v.string(),
    title: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    isAuthenticated: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pageViews", {
      path: args.path,
      title: args.title,
      referrer: args.referrer,
      userAgent: args.userAgent,
      sessionId: args.sessionId,
      userEmail: args.userEmail,
      isAuthenticated: args.isAuthenticated,
    })
  },
})

export const trackFeatureEvent = mutation({
  args: {
    eventName: v.string(),
    eventData: v.optional(v.any()),
    page: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    isAuthenticated: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("featureEvents", {
      eventName: args.eventName,
      eventData: args.eventData,
      page: args.page,
      sessionId: args.sessionId,
      userEmail: args.userEmail,
      isAuthenticated: args.isAuthenticated,
    })
  },
})

export const trackSessionEvent = mutation({
  args: {
    userEmail: v.string(),
    sessionId: v.string(),
    event: v.union(v.literal("sign_in"), v.literal("sign_out"), v.literal("heartbeat")),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first()

    if (args.event === "sign_in") {
      if (existing) {
        await ctx.db.patch(existing._id, {
          signedInAt: Date.now(),
          signedOutAt: undefined,
          lastActiveAt: Date.now(),
          ip: args.ip,
          userAgent: args.userAgent,
        })
      } else {
        await ctx.db.insert("userSessions", {
          userEmail: args.userEmail,
          sessionId: args.sessionId,
          signedInAt: Date.now(),
          lastActiveAt: Date.now(),
          ip: args.ip,
          userAgent: args.userAgent,
        })
      }
    } else if (args.event === "sign_out" && existing) {
      await ctx.db.patch(existing._id, { signedOutAt: Date.now() })
    } else if (args.event === "heartbeat" && existing) {
      await ctx.db.patch(existing._id, { lastActiveAt: Date.now() })
    }
  },
})

// ═══════════════════════════════════════════════════════
// ADMIN QUERIES
// ═══════════════════════════════════════════════════════

export const getAdminDashboard = query({
  args: {
    adminEmail: v.string(),
    days: v.optional(v.number()),
    pageLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminEmail)

    const days = Math.min(args.days ?? 30, 90)
    const limit = Math.min(args.pageLimit ?? 100, 500)
    const now = Date.now()
    const cutoff = now - days * 24 * 60 * 60 * 1000

    const recentViews = await ctx.db.query("pageViews").take(limit)
    const recentEvents = await ctx.db.query("featureEvents").take(limit)

    const allSessions = await ctx.db.query("userSessions").collect()
    const allUsers = await ctx.db.query("users").collect()
    const allPayments = await ctx.db.query("payments").collect()
    const allOrganizations = await ctx.db.query("organizations").collect()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTs = todayStart.getTime()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const viewsToday = recentViews.filter((v) => v._creationTime >= todayTs / 1000).length
    const views7d = recentViews.filter((v) => v._creationTime >= sevenDaysAgo / 1000)

    const pageCounts: Record<string, number> = {}
    for (const view of recentViews) {
      pageCounts[view.path] = (pageCounts[view.path] || 0) + 1
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([path, count]) => ({ path, count }))

    const uniqueUsers7d = new Set(views7d.filter((v) => v.userEmail).map((v) => v.userEmail)).size
    const uniqueSessions7d = new Set(views7d.map((v) => v.sessionId).filter(Boolean)).size

    const eventCounts: Record<string, number> = {}
    for (const evt of recentEvents) {
      eventCounts[evt.eventName] = (eventCounts[evt.eventName] || 0) + 1
    }
    const topFeatures = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([eventName, count]) => ({ eventName, count }))

    const eventsToday = recentEvents.filter((e) => e._creationTime >= todayTs / 1000).length

    const activeSessions = allSessions.filter((s) => s.signedOutAt === undefined || !s.signedOutAt)
    const sessionsToday = allSessions.filter((s) => s.signedInAt >= todayTs)
    const sessions7d = allSessions.filter((s) => s.signedInAt >= sevenDaysAgo)

    const uniqueSignInsToday = new Set(sessionsToday.map((s) => s.userEmail)).size

    const dailyViews: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      const count = recentViews.filter(
        (v) => v._creationTime >= dayStart / 1000 && v._creationTime < dayEnd / 1000,
      ).length
      dailyViews.push({
        date: day.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" }),
        count,
      })
    }

    const dailySignIns: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      const unique = new Set(
        allSessions
          .filter((s) => s.signedInAt >= dayStart && s.signedInAt < dayEnd)
          .map((s) => s.userEmail),
      )
      dailySignIns.push({
        date: day.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" }),
        count: unique.size,
      })
    }

    const paidPayments = allPayments.filter((p) => p.status === "pagato")
    const pendingPayments = allPayments.filter((p) => p.status === "in_attesa")
    const overduePayments = allPayments.filter((p) => p.status === "in_ritardo")

    const totalRevenue = paidPayments
      .filter((p) => p.type === "client")
      .reduce((s, p) => s + p.amount, 0)
    const totalOutgoing = paidPayments
      .filter((p) => p.type === "supplier" || p.type === "collaborator")
      .reduce((s, p) => s + p.amount, 0)

    const monthlyRevenue: Record<string, { incoming: number; outgoing: number }> = {}
    for (const p of paidPayments) {
      const date = p.paidDate || p.dueDate
      if (!date) continue
      const key = date.slice(0, 7)
      if (!monthlyRevenue[key]) monthlyRevenue[key] = { incoming: 0, outgoing: 0 }
      if (p.type === "client") monthlyRevenue[key].incoming += p.amount
      else monthlyRevenue[key].outgoing += p.amount
    }
    const revenueTrend = Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({ month, ...data }))

    const paymentStatusDist = {
      pagato: paidPayments.length,
      in_attesa: pendingPayments.length,
      in_ritardo: overduePayments.length,
      in_verifica: allPayments.filter((p) => p.status === "in_verifica").length,
      parziale: allPayments.filter((p) => p.status === "parziale").length,
    }

    const orgRevenue: Record<string, number> = {}
    for (const p of paidPayments.filter((p) => p.type === "client")) {
      orgRevenue[p.organizationId] = (orgRevenue[p.organizationId] || 0) + p.amount
    }
    const orgMap = new Map<string, string>(allOrganizations.map((o) => [o._id, o.name]))
    const topOrgsByRevenue = Object.entries(orgRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([orgId, amount]) => ({ name: orgMap.get(orgId as any) || "N/D", amount }))

    return {
      overview: {
        totalViews: recentViews.length,
        viewsToday,
        views7d: views7d.length,
        views30d: recentViews.length,
        uniqueUsers7d,
        uniqueSessions7d,
        totalEvents: recentEvents.length,
        eventsToday,
        totalSessions: allSessions.length,
        activeSessions: activeSessions.length,
        uniqueSignInsToday,
        totalUsers: allUsers.length,
      },
      payments: {
        totalPayments: allPayments.length,
        totalPaid: paidPayments.length,
        totalPending: pendingPayments.length,
        totalOverdue: overduePayments.length,
        totalRevenue,
        totalOutgoing,
        netRevenue: totalRevenue - totalOutgoing,
        totalPendingAmount: pendingPayments.reduce((s, p) => s + p.amount, 0),
        totalOverdueAmount: overduePayments.reduce((s, p) => s + p.amount, 0),
      },
      paymentStatusDist,
      revenueTrend,
      topOrgsByRevenue,
      topPages,
      topFeatures,
      dailyViews,
      dailySignIns,
      pagination: {
        days,
        pageLimit: limit,
        hasMoreViews: recentViews.length === limit,
        hasMoreEvents: recentEvents.length === limit,
      },
    }
  },
})

export const getAdminUsers = query({
  args: { adminEmail: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminEmail)

    const users = await ctx.db.query("users").collect()
    const sessions = await ctx.db.query("userSessions").collect()
    const views = await ctx.db.query("pageViews").collect()

    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    return users.map((u) => {
      const userSessions = sessions.filter((s) => s.userEmail === u.email)
      const lastSession = userSessions.sort((a, b) => b.signedInAt - a.signedInAt)[0]
      const sessionCount = userSessions.length
      const viewsByUser = views.filter((v) => v.userEmail === u.email)
      const pageViewsLast7d = viewsByUser.filter((v) => v._creationTime >= sevenDaysAgo / 1000).length
      const isOnline = lastSession && !lastSession.signedOutAt && lastSession.lastActiveAt && lastSession.lastActiveAt > now - 5 * 60 * 1000

      return {
        _id: u._id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        subrole: u.subrole,
        blocked: u.blocked ?? false,
        createdAt: u._creationTime,
        lastActive: lastSession?.lastActiveAt ?? null,
        sessionCount,
        pageViewsLast7d,
        isOnline: !!isOnline,
        phone: u.phone,
      }
    }).sort((a, b) => (b.lastActive ?? 0) - (a.lastActive ?? 0))
  },
})

export const getAdminRecentActivity = query({
  args: { adminEmail: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    assertAdmin(args.adminEmail)
    const limit = args.limit ?? 50

    const pageViews = await ctx.db.query("pageViews").collect()
    const featureEvents = await ctx.db.query("featureEvents").collect()
    const sessions = await ctx.db.query("userSessions").collect()

    const activities: {
      type: "page_view" | "feature_event" | "sign_in" | "sign_out"
      userEmail: string | undefined
      description: string
      timestamp: number
    }[] = []

    for (const v of pageViews) {
      activities.push({
        type: "page_view",
        userEmail: v.userEmail,
        description: `Visita ${v.path}${v.title ? ` (${v.title})` : ""}`,
        timestamp: v._creationTime * 1000,
      })
    }

    for (const e of featureEvents) {
      activities.push({
        type: "feature_event",
        userEmail: e.userEmail,
        description: `Evento: ${e.eventName}${e.page ? ` su ${e.page}` : ""}`,
        timestamp: e._creationTime * 1000,
      })
    }

    for (const s of sessions) {
      activities.push({
        type: "sign_in",
        userEmail: s.userEmail,
        description: `Accesso`,
        timestamp: s.signedInAt,
      })
      if (s.signedOutAt) {
        activities.push({
          type: "sign_out",
          userEmail: s.userEmail,
          description: `Uscita`,
          timestamp: s.signedOutAt,
        })
      }
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  },
})
