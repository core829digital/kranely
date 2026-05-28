import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { resolveNotifTarget } from "./lib/helpers"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), cantiereId: v.optional(v.id("cantieri")), assignedTo: v.optional(v.string()), phase: v.optional(v.union(v.literal("in_lavorazione"), v.literal("posa_in_opera"), v.literal("completato"))), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let items
    const cantiereId = args.cantiereId
    if (cantiereId) {
      items = await ctx.db
        .query("phaseTasks")
        .withIndex("by_cantiere", (q) => q.eq("cantiereId", cantiereId))
        .collect()
    } else {
      items = await ctx.db
        .query("phaseTasks")
        .collect()
      items = items.filter((t) => t.organizationId === args.organizationId)
    }

    let filtered = items.sort((a, b) => b._creationTime - a._creationTime)
    if (args.assignedTo) filtered = filtered.filter((t) => t.assignedTo === args.assignedTo)
    if (args.phase) filtered = filtered.filter((t) => t.phase === args.phase)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("phaseTasks"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    cantiereId: v.id("cantieri"),
    phase: v.union(v.literal("in_lavorazione"), v.literal("posa_in_opera"), v.literal("completato")),
    title: v.string(),
    description: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("alta"), v.literal("media"), v.literal("bassa"))),
    dueDate: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userEmail, ...rest } = args
    const user = await assertOrgAccess(ctx, userEmail, rest.organizationId)
    const id = await ctx.db.insert("phaseTasks", {
      organizationId: rest.organizationId,
      cantiereId: args.cantiereId,
      phase: args.phase,
      title: args.title,
      description: args.description,
      status: "da_fare",
      assignedTo: args.assignedTo,
      priority: args.priority || "media",
      dueDate: args.dueDate,
    })

    if (args.assignedTo) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: args.organizationId,
        userEmail: args.assignedTo,
        title: "Nuova attività assegnata",
        message: `L'attività "${args.title}" ti è stata assegnata con priorità ${args.priority || "media"}`,
        type: "task_assigned",
        priority: args.priority === "alta" ? "high" : "normal",
        link: "/tasks",
      })
    }

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("phaseTasks"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("da_fare"), v.literal("in_corso"), v.literal("completato"))),
    assignedTo: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("alta"), v.literal("media"), v.literal("bassa"))),
    dueDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, organizationId, userEmail, ...data } = args
    await assertOrgAccess(ctx, userEmail, organizationId)
    const existing = await ctx.db.get(id)
    if (!existing || existing.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (existing) {
      await ctx.db.insert("activityLog", {
        organizationId,
        userEmail: userEmail || "system",
        action: "updated",
        entityType: "task",
        entityId: id,
        entityName: existing.title,
        details: `Attività "${existing.title}" aggiornata`,
      })
    }

    if (existing && data.status && data.status !== existing.status) {
      const statusLabels: Record<string, string> = { da_fare: "Da fare", in_corso: "In corso", completato: "Completato" }
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: existing.organizationId,
        userEmail: existing.assignedTo || await resolveNotifTarget(ctx, existing.organizationId, userEmail),
        title: "Attività aggiornata",
        message: `L'attività "${existing.title}" è passata a "${statusLabels[data.status] || data.status}"`,
        type: "task_updated",
        priority: "normal",
        link: "/tasks",
      })
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("phaseTasks"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const existing = await ctx.db.get(args.id)
    if (!existing || existing.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    if (existing) {
      await ctx.db.insert("activityLog", {
        organizationId: args.organizationId,
        userEmail: args.userEmail || "system",
        action: "deleted",
        entityType: "task",
        entityId: args.id,
        entityName: existing.title,
        details: `Attività "${existing.title}" eliminata`,
      })
    }

    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const tasks = await ctx.db
      .query("phaseTasks")
      .collect()
    const filtered = tasks.filter((t) => t.organizationId === args.organizationId)

    return {
      total: filtered.length,
      daFare: filtered.filter((t) => t.status === "da_fare").length,
      inCorso: filtered.filter((t) => t.status === "in_corso").length,
      completato: filtered.filter((t) => t.status === "completato").length,
      altaPriorita: filtered.filter((t) => t.priority === "alta" && t.status !== "completato").length,
    }
  },
})
