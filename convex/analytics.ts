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
  args: { adminEmail: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminEmail)

    const allViews = await ctx.db.query("pageViews").collect()
    const allEvents = await ctx.db.query("featureEvents").collect()
    const allSessions = await ctx.db.query("userSessions").collect()
    const allUsers = await ctx.db.query("users").collect()

    const now = Date.now()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTs = todayStart.getTime()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    // Page views stats
    const viewsToday = allViews.filter((v) => v._creationTime >= todayTs / 1000).length
    const views7d = allViews.filter((v) => v._creationTime >= sevenDaysAgo / 1000)
    const views30d = allViews.filter((v) => v._creationTime >= thirtyDaysAgo / 1000)

    // Most visited pages
    const pageCounts: Record<string, number> = {}
    for (const view of allViews) {
      pageCounts[view.path] = (pageCounts[view.path] || 0) + 1
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([path, count]) => ({ path, count }))

    // Unique visitors (by email or session)
    const uniqueUsers7d = new Set(views7d.filter((v) => v.userEmail).map((v) => v.userEmail)).size
    const uniqueSessions7d = new Set(views7d.map((v) => v.sessionId).filter(Boolean)).size

    // Feature usage
    const eventCounts: Record<string, number> = {}
    for (const evt of allEvents) {
      eventCounts[evt.eventName] = (eventCounts[evt.eventName] || 0) + 1
    }
    const topFeatures = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([eventName, count]) => ({ eventName, count }))

    // Feature events today
    const eventsToday = allEvents.filter((e) => e._creationTime >= todayTs / 1000).length

    // Sessions stats
    const activeSessions = allSessions.filter((s) => s.signedOutAt === undefined || !s.signedOutAt)
    const sessionsToday = allSessions.filter((s) => s.signedInAt >= todayTs)
    const sessions7d = allSessions.filter((s) => s.signedInAt >= sevenDaysAgo)

    // Sign-ins today (unique users)
    const uniqueSignInsToday = new Set(sessionsToday.map((s) => s.userEmail)).size

    // Daily page views for chart (last 7 days)
    const dailyViews: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      const count = allViews.filter(
        (v) => v._creationTime >= dayStart / 1000 && v._creationTime < dayEnd / 1000,
      ).length
      dailyViews.push({
        date: day.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" }),
        count,
      })
    }

    // Daily sign-ins for chart (last 7 days)
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

    return {
      overview: {
        totalViews: allViews.length,
        viewsToday,
        views7d: views7d.length,
        views30d: views30d.length,
        uniqueUsers7d,
        uniqueSessions7d,
        totalEvents: allEvents.length,
        eventsToday,
        totalSessions: allSessions.length,
        activeSessions: activeSessions.length,
        uniqueSignInsToday,
        totalUsers: allUsers.length,
      },
      topPages,
      topFeatures,
      dailyViews,
      dailySignIns,
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
