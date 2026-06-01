import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { resolveNotifTarget } from "./lib/helpers"
import { assertOrgAccess } from "./auth"

// ═══════════════════════════════════════════════════════
// QUOTES (Preventivi)
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), clientId: v.optional(v.id("clients")), search: v.optional(v.string()), status: v.optional(v.string()), type: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("quotes").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.clientId) filtered = filtered.filter((q) => q.clientId === args.clientId)
    if (args.search) {
      const s = args.search.toLowerCase()
      filtered = filtered.filter((q) => (q.title || "").toLowerCase().includes(s) || (q.description && q.description.toLowerCase().includes(s)))
    }
    if (args.status && args.status !== "all") filtered = filtered.filter((q) => q.status === args.status)
    if (args.type && args.type !== "all") filtered = filtered.filter((q) => q.quoteType === args.type)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("quotes"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const getWithDocuments = query({
  args: { id: v.id("quotes"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const quote = await ctx.db.get(args.id)
    if (!quote || quote.organizationId !== args.organizationId) throw new Error("Not found")
    if (user.role === "client" && quote.clientId !== user.userId) {
      const client = user.userId ? await ctx.db.get(user.userId) : null
      if (!client) throw new Error("Not found")
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
      .then((docs) => docs.filter((d) => d.quoteId === args.id))

    let selectedVersionDoc = null
    if (quote.clientSelectedVersionDocId) {
      selectedVersionDoc = await ctx.db.get(quote.clientSelectedVersionDocId)
    }

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
      .then((ps) => ps.filter((p) =>
        p.quoteId === args.id ||
        (p.cantiereId && quote.cantiereId && p.cantiereId === quote.cantiereId)
      ))

    return { quote, documents, selectedVersionDoc, payments }
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    clientId: v.optional(v.id("clients")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    quoteType: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("accepted"), v.literal("rejected"), v.literal("in_lavorazione"))),
    estimatedPrice: v.optional(v.number()),
    validUntil: v.optional(v.string()),
    clientQuoteExpiresAt: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    email: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { createdBy, userEmail, ...rest } = args
    const user = await assertOrgAccess(ctx, userEmail, args.organizationId)
    const id = await ctx.db.insert("quotes", { ...rest, status: args.status || "draft", quoteType: args.quoteType || "preventivo", createdBy })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      action: "created",
      entityType: "quote",
      entityId: id,
      entityName: args.title,
      details: `Preventivo "${args.title}" creato`,
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("quotes"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    quoteType: v.optional(v.union(v.literal("preventivo"), v.literal("sopralluogo"), v.literal("assistenza"))),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("accepted"), v.literal("rejected"), v.literal("in_lavorazione"))),
    estimatedPrice: v.optional(v.number()),
    validUntil: v.optional(v.string()),
    clientQuoteExpiresAt: v.optional(v.string()),
    clientSelectedVersionDocId: v.optional(v.id("documents")),
    files: v.optional(v.array(v.string())),
    attachmentPhotos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, userEmail, ...data } = args
    const user = await assertOrgAccess(ctx, userEmail, organizationId)
    const existing = await ctx.db.get(id)
    if (!existing || existing.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: userEmail || "system",
      action: "updated",
      entityType: "quote",
      entityId: id,
      entityName: existing.title,
      details: `Preventivo "${existing.title}" aggiornato`,
    })

    if (existing && data.status && data.status !== existing.status) {
      const statusLabels: Record<string, string> = {
        draft: "Bozza", sent: "Inviato", accepted: "Accettato", rejected: "Rifiutato", in_lavorazione: "In lavorazione",
      }
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: existing.organizationId,
        userEmail: await resolveNotifTarget(ctx, existing.organizationId),
        title: "Stato preventivo aggiornato",
        message: `Il preventivo "${existing.title || "senza nome"}" è ora "${statusLabels[data.status] || data.status}"`,
        type: "quote_status_change",
        priority: data.status === "accepted" ? "high" : data.status === "rejected" ? "urgent" : "normal",
        link: "/quotes",
      })

      if (data.status === "accepted" && existing.clientId) {
        const existingCantieri = await ctx.db
          .query("cantieri")
          .withIndex("by_organization", (q) => q.eq("organizationId", existing.organizationId))
          .collect()
          .then((cs) => cs.filter((c) => c.quoteId === id))

        if (!existingCantieri.length) {
          const cantiereName = existing.title || `Cantiere da preventivo ${id.slice(0, 8)}`
          await ctx.db.insert("cantieri", {
            organizationId: existing.organizationId,
            clientId: existing.clientId,
            name: cantiereName,
            quoteId: id,
            totalBudget: existing.estimatedPrice || 0,
            status: "pianificato",
          })
        }
      }
    }

    return id
  },
})

export const linkDocument = mutation({
  args: {
    quoteId: v.id("quotes"),
    documentId: v.id("documents"),
    organizationId: v.id("organizations"),
    setAsSelectedVersion: v.optional(v.boolean()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const quote = await ctx.db.get(args.quoteId)
    if (!quote || quote.organizationId !== args.organizationId) throw new Error("Quote not found")
    const doc = await ctx.db.get(args.documentId)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Document not found")

    await ctx.db.patch(args.documentId, { quoteId: args.quoteId } as any)

    if (args.setAsSelectedVersion) {
      await ctx.db.patch(args.quoteId, { clientSelectedVersionDocId: args.documentId })
    }

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "linked_document",
      entityType: "quote",
      entityId: args.quoteId,
      entityName: quote.title,
      details: `Documento "${doc.title}" collegato al preventivo "${quote.title}"`,
    })

    return args.documentId
  },
})

export const setSelectedVersionDoc = mutation({
  args: {
    quoteId: v.id("quotes"),
    documentId: v.id("documents"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const quote = await ctx.db.get(args.quoteId)
    if (!quote || quote.organizationId !== args.organizationId) throw new Error("Quote not found")

    await ctx.db.patch(args.quoteId, { clientSelectedVersionDocId: args.documentId } as any)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "selected_version",
      entityType: "quote",
      entityId: args.quoteId,
      entityName: quote.title,
      details: `Versione documento selezionata per il preventivo "${quote.title}"`,
    })

    return args.quoteId
  },
})

export const remove = mutation({
  args: { id: v.id("quotes"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const quote = await ctx.db.get(args.id)
    if (!quote || quote.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "quote",
      entityId: args.id,
      entityName: quote.title,
      details: `Preventivo "${quote.title}" eliminato`,
    })

    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      total: quotes.length,
      draft: quotes.filter((q) => q.status === "draft").length,
      sent: quotes.filter((q) => q.status === "sent").length,
      accepted: quotes.filter((q) => q.status === "accepted").length,
      rejected: quotes.filter((q) => q.status === "rejected").length,
      inCorso: quotes.filter((q) => q.status === "in_lavorazione").length,
      totalValue: quotes.reduce((sum, q) => sum + (q.estimatedPrice || 0), 0),
      acceptedValue: quotes.filter((q) => q.status === "accepted").reduce((sum, q) => sum + (q.estimatedPrice || 0), 0),
    }
  },
})
