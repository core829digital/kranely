import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"

// ═══════════════════════════════════════════════════════
// CANTIERI (Construction Sites)
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), clientId: v.optional(v.id("clients")), search: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("cantieri").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    const cantieri = await q.collect()

    let filtered = cantieri
    if (args.clientId) filtered = filtered.filter((c) => c.clientId === args.clientId)
    if (args.search) {
      const s = args.search.toLowerCase()
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(s) || (c.address && c.address.toLowerCase().includes(s)))
    }
    if (args.status && args.status !== "all") filtered = filtered.filter((c) => c.status === args.status)

    return filtered.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const get = query({
  args: { id: v.id("cantieri"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    clientId: v.optional(v.id("clients")),
    name: v.string(),
    address: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pianificato"), v.literal("in_corso"), v.literal("completato"), v.literal("sospeso"))),
    description: v.optional(v.string()),
    quoteId: v.optional(v.id("quotes")),
    totalBudget: v.optional(v.number()),
    managerId: v.optional(v.id("users")),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { managerId, userEmail, ...rest } = args

    if (userEmail) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q: any) => q.eq("email", userEmail))
        .first()
      if (!user || user.organizationId !== args.organizationId) {
        throw new Error("Non autorizzato")
      }
    }

    const id = await ctx.db.insert("cantieri", { ...rest, status: args.status || "pianificato", managerId })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: "system",
      action: "created",
      entityType: "cantiere",
      entityId: id,
      entityName: args.name,
      details: `Cantiere "${args.name}" creato`,
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: userEmail || "admin@kranely.demo",
      title: "Nuovo cantiere",
      message: `Cantiere "${args.name}" creato${args.clientId ? " per cliente" : ""}`,
      type: "cantiere_created",
      priority: "normal",
      link: "/cantieri",
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("cantieri"),
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pianificato"), v.literal("in_corso"), v.literal("completato"), v.literal("sospeso"))),
    description: v.optional(v.string()),
    totalBudget: v.optional(v.number()),
    managerId: v.optional(v.id("users")),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (data.status && data.status !== prev.status) {
      const statusLabels: Record<string, string> = {
        pianificato: "Pianificato", in_corso: "In corso", completato: "Completato", sospeso: "Sospeso",
      }
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: prev.organizationId,
        userEmail: userEmail || "admin@kranely.demo",
        title: `Cantiere ${statusLabels[data.status] || data.status}`,
        message: `Il cantiere "${prev.name}" è ora "${statusLabels[data.status] || data.status}"`,
        type: "cantiere_status_change",
        priority: data.status === "completato" ? "high" : "normal",
        link: "/cantieri",
      })
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("cantieri"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const cantiere = await ctx.db.get(args.id)
    if (!cantiere || cantiere.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const addPhaseTask = mutation({
  args: {
    cantiereId: v.id("cantieri"),
    phase: v.union(v.literal("in_lavorazione"), v.literal("posa_in_opera"), v.literal("completato")),
    title: v.string(),
    description: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("da_fare"), v.literal("in_corso"), v.literal("completato"))),
    priority: v.optional(v.union(v.literal("bassa"), v.literal("media"), v.literal("alta"))),
  },
  handler: async (ctx, args) => {
    const cantiere = await ctx.db.get(args.cantiereId)
    if (!cantiere) throw new Error("Cantiere non trovato")
    const id = await ctx.db.insert("phaseTasks", {
      organizationId: cantiere.organizationId,
      cantiereId: args.cantiereId,
      phase: args.phase,
      title: args.title,
      description: args.description,
      assignedTo: args.assignedTo,
      dueDate: args.dueDate,
      status: args.status || "da_fare",
      priority: args.priority || "media",
    })
    return id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const cantieri = await ctx.db
      .query("cantieri")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      total: cantieri.length,
      pianificati: cantieri.filter((c) => c.status === "pianificato").length,
      inCorso: cantieri.filter((c) => c.status === "in_corso").length,
      completati: cantieri.filter((c) => c.status === "completato").length,
      sospesi: cantieri.filter((c) => c.status === "sospeso").length,
      totalBudget: cantieri.reduce((sum, c) => sum + (c.totalBudget || 0), 0),
    }
  },
})
