import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { resolveNotifTarget } from "./lib/helpers"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), cantiereId: v.optional(v.id("cantieri")), assignedTo: v.optional(v.string()), phase: v.optional(v.union(v.literal("in_lavorazione"), v.literal("posa_in_opera"), v.literal("completato"))), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const requestingUser = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let items = await ctx.db
      .query("phaseTasks")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
    if (args.cantiereId) items = items.filter((t) => t.cantiereId === args.cantiereId)
    let filtered = items.sort((a, b) => b._creationTime - a._creationTime)
    if (args.assignedTo) filtered = filtered.filter((t) => t.assignedTo === args.assignedTo)
    if (args.phase) filtered = filtered.filter((t) => t.phase === args.phase)

    const isAdmin = requestingUser.role === "admin" || requestingUser.role === "superadmin"
    if (!isAdmin && requestingUser.role !== "anonymous" && requestingUser.role !== "blocked") {
      filtered = filtered.filter((t) => t.assignedTo === requestingUser.email)
    }

    return filtered
  },
})

export const get = query({
  args: { id: v.id("phaseTasks"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin && user.role !== "anonymous") {
      if (user.role === "collaborator" && doc.assignedTo !== user.email && doc.createdById !== user.userId) {
        throw new Error("Not found")
      } else if (user.role !== "collaborator" && user.role !== "anonymous") {
        if (user.role === "client" || user.role === "supplier" || user.role === "driver") {
          const cantiere = await ctx.db.get(doc.cantiereId)
          if (cantiere) {
            if (user.role === "client") {
              const clientDoc = await ctx.db.query("clients").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).filter((q: any) => q.eq(q.field("email"), user.email)).first()
              if (!clientDoc || cantiere.clientId !== clientDoc._id) throw new Error("Not found")
            } else {
              throw new Error("Not found")
            }
          }
        }
      }
    }
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
    const user = await assertOrgAccess(ctx, userEmail, organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    const existing = await ctx.db.get(id)
    if (!existing || existing.organizationId !== organizationId) throw new Error("Not found")
    if (!isAdmin) {
      const isOwner = existing.createdById === user.userId || existing.assignedTo === user.email
      if (!isOwner) throw new Error("Not authorized: only the creator, assignee, or admin can update this task")
    }
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

      if (data.status === "completato" && existing.cantiereId) {
        const allTasks = await ctx.db
          .query("phaseTasks")
          .withIndex("by_cantiere", (q) => q.eq("cantiereId", existing.cantiereId))
          .collect()
        const completed = allTasks.filter((t) => t.status === "completato").length
        const total = allTasks.length
        const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0
        const cantiere = await ctx.db.get(existing.cantiereId)
        if (cantiere && cantiere.organizationId === existing.organizationId) {
          const newStatus = newProgress === 100 ? "completato" : "in_corso"
          await ctx.db.patch(existing.cantiereId, {
            progressPercentage: newProgress,
            ...(newStatus === "completato" && cantiere.status !== "completato" ? { status: newStatus, endDate: new Date().toISOString() } : {}),
          })
        }
      }
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("phaseTasks"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    const existing = await ctx.db.get(args.id)
    if (!existing || existing.organizationId !== args.organizationId) throw new Error("Not found")
    if (!isAdmin && existing.createdById !== user.userId) throw new Error("Not authorized: only the creator or admin can delete this task")
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
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      total: tasks.length,
      daFare: tasks.filter((t) => t.status === "da_fare").length,
      inCorso: tasks.filter((t) => t.status === "in_corso").length,
      completato: tasks.filter((t) => t.status === "completato").length,
      altaPriorita: tasks.filter((t) => t.priority === "alta" && t.status !== "completato").length,
    }
  },
})
