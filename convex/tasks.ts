import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"

export const list = query({
  args: { organizationId: v.id("organizations"), cantiereId: v.optional(v.id("cantieri")), assignedTo: v.optional(v.string()), phase: v.optional(v.union(v.literal("in_lavorazione"), v.literal("posa_in_opera"), v.literal("completato"))) },
  handler: async (ctx, args) => {
    let tasks
    const cantiereId = args.cantiereId
    if (cantiereId) {
      tasks = await ctx.db
        .query("phaseTasks")
        .withIndex("by_cantiere", (q) => q.eq("cantiereId", cantiereId))
        .collect()
    } else {
      tasks = await ctx.db
        .query("phaseTasks")
        .collect()
      tasks = tasks.filter((t) => t.organizationId === args.organizationId)
    }

    if (args.assignedTo) tasks = tasks.filter((t) => t.assignedTo === args.assignedTo)
    if (args.phase) tasks = tasks.filter((t) => t.phase === args.phase)

    return tasks.sort((a, b) => {
      const priorityOrder = { alta: 0, media: 1, bassa: 2 }
      return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1)
    })
  },
})

export const get = query({
  args: { id: v.id("phaseTasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
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
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("phaseTasks", {
      organizationId: args.organizationId,
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
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("da_fare"), v.literal("in_corso"), v.literal("completato"))),
    assignedTo: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("alta"), v.literal("media"), v.literal("bassa"))),
    dueDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args
    const existing = await ctx.db.get(id)
    await ctx.db.patch(id, data)

    if (existing && data.status && data.status !== existing.status) {
      const statusLabels: Record<string, string> = { da_fare: "Da fare", in_corso: "In corso", completato: "Completato" }
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: existing.organizationId,
        userEmail: existing.assignedTo || "admin@kranely.demo",
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
  args: { id: v.id("phaseTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
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
