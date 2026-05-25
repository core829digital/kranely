import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"

// ═══════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), cantiereId: v.optional(v.id("cantieri")), clientId: v.optional(v.id("clients")), quoteId: v.optional(v.id("quotes")), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("documents").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    const docs = await q.collect()

    let filtered = docs
    if (args.cantiereId) filtered = filtered.filter((d) => d.cantiereId === args.cantiereId)
    if (args.clientId) filtered = filtered.filter((d) => d.clientId === args.clientId)
    if (args.quoteId) filtered = filtered.filter((d) => d.quoteId === args.quoteId)
    if (args.status && args.status !== "all") filtered = filtered.filter((d) => d.status === args.status)

    return filtered.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const get = query({
  args: { id: v.id("documents"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    type: v.optional(v.union(v.literal("contract"), v.literal("quote"), v.literal("invoice"), v.literal("technical"), v.literal("certificate"), v.literal("photo"), v.literal("other"), v.literal("altro"), v.literal("documento"), v.literal("foto"), v.literal("preventivo"), v.literal("fattura"))),
    fileUrl: v.string(),
    fileName: v.string(),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("final"), v.literal("archived"))),
    description: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    cantiereId: v.optional(v.id("cantieri")),
    quoteId: v.optional(v.id("quotes")),
    createdById: v.optional(v.id("users")),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { createdById, userEmail, ...rest } = args
    const id = await ctx.db.insert("documents", { ...rest, status: args.status || "draft", createdById })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: "system",
      action: "uploaded",
      entityType: "document",
      entityId: id,
      entityName: args.title,
      details: `Documento "${args.title}" caricato`,
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      title: "Nuovo documento",
      message: `Documento "${args.title}" caricato${args.clientId ? " per cliente" : args.cantiereId ? " per cantiere" : args.quoteId ? " per preventivo" : ""}`,
      type: "document_uploaded",
      priority: "low",
      link: "/documents",
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("documents"),
    organizationId: v.id("organizations"),
    title: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("final"), v.literal("archived"))),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, ...data } = args
    const doc = await ctx.db.get(id)
    if (!doc || doc.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id("documents"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      total: docs.length,
      draft: docs.filter((d) => d.status === "draft").length,
      final: docs.filter((d) => d.status === "final").length,
      archived: docs.filter((d) => d.status === "archived").length,
      byType: {
        contract: docs.filter((d) => d.type === "contract").length,
        quote: docs.filter((d) => d.type === "quote").length,
        invoice: docs.filter((d) => d.type === "invoice").length,
        technical: docs.filter((d) => d.type === "technical").length,
        certificate: docs.filter((d) => d.type === "certificate").length,
        photo: docs.filter((d) => d.type === "photo").length,
        other: docs.filter((d) => d.type === "other").length,
      },
    }
  },
})
