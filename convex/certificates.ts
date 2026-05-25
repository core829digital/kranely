import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"

// ═══════════════════════════════════════════════════════
// CERTIFICATES (Certificazioni)
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), cantiereId: v.optional(v.id("cantieri")), collaboratorId: v.optional(v.id("collaborators")), category: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("certificates").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    const certs = await q.collect()

    let filtered = certs
    if (args.cantiereId) filtered = filtered.filter((c) => c.cantiereId === args.cantiereId)
    if (args.collaboratorId) filtered = filtered.filter((c) => c.collaboratorId === args.collaboratorId)
    if (args.category && args.category !== "all") filtered = filtered.filter((c) => c.category === args.category)
    if (args.status && args.status !== "all") filtered = filtered.filter((c) => c.status === args.status)

    return filtered.sort((a, b) => (b.expiryDate || "").localeCompare(a.expiryDate || ""))
  },
})

export const get = query({
  args: { id: v.id("certificates"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    category: v.union(v.literal("sicurezza"), v.literal("qualifica"), v.literal("conformita"), v.literal("ambientale"), v.literal("altro")),
    status: v.optional(v.union(v.literal("valido"), v.literal("in_scadenza"), v.literal("scaduto"), v.literal("in_rinnovo"))),
    issueDate: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    issuedBy: v.optional(v.string()),
    description: v.optional(v.string()),
    collaboratorId: v.optional(v.id("collaborators")),
    cantiereId: v.optional(v.id("cantieri")),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ...rest } = args
    const id = await ctx.db.insert("certificates", { ...rest, status: args.status || "valido" })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: "system",
      action: "created",
      entityType: "certificate",
      entityId: id,
      entityName: args.name,
      details: `Certificazione "${args.name}" aggiunta`,
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: "admin@kranely.demo",
      title: "Nuovo certificato",
      message: `Certificato "${args.name}" aggiunto (${args.expiryDate ? "scade: " + new Date(args.expiryDate).toLocaleDateString("it-IT") : "nessuna scadenza"})`,
      type: "certificate_created",
      priority: "normal",
      link: "/certificates",
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("certificates"),
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    category: v.optional(v.union(v.literal("sicurezza"), v.literal("qualifica"), v.literal("conformita"), v.literal("ambientale"), v.literal("altro"))),
    status: v.optional(v.union(v.literal("valido"), v.literal("in_scadenza"), v.literal("scaduto"), v.literal("in_rinnovo"))),
    issueDate: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    issuedBy: v.optional(v.string()),
    description: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (data.status && data.status !== prev.status) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: prev.organizationId,
        userEmail: userEmail || "admin@kranely.demo",
        title: `Certificato ${data.status === "scaduto" ? "scaduto" : "aggiornato"}`,
        message: `Il certificato "${prev.name}" è ora "${data.status}"`,
        type: "certificate_status_change",
        priority: data.status === "scaduto" ? "urgent" : data.status === "in_scadenza" ? "high" : "normal",
        link: "/certificates",
      })
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("certificates"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const cert = await ctx.db.get(args.id)
    if (!cert || cert.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const certs = await ctx.db
      .query("certificates")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const today = new Date().toISOString().split("T")[0]
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    return {
      total: certs.length,
      validi: certs.filter((c) => c.status === "valido").length,
      inScadenza: certs.filter((c) => c.status === "in_scadenza").length,
      scaduti: certs.filter((c) => c.status === "scaduto").length,
      inRinnovo: certs.filter((c) => c.status === "in_rinnovo").length,
      expiringSoon: certs.filter((c) => c.expiryDate && c.expiryDate <= thirtyDays && c.expiryDate >= today).length,
      expired: certs.filter((c) => c.expiryDate && c.expiryDate < today).length,
    }
  },
})
