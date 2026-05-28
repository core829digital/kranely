import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { resolveNotifTarget } from "./lib/helpers"
import { assertOrgAccess } from "./auth"

// ═══════════════════════════════════════════════════════
// APPOINTMENTS (Appuntamenti)
// ═══════════════════════════════════════════════════════

export const list = query({
  args: { organizationId: v.id("organizations"), date: v.optional(v.string()), email: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("appointments").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.date) filtered = filtered.filter((a) => a.appointmentDate === args.date)
    if (args.email) filtered = filtered.filter((a) => a.email === args.email)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("appointments"), organizationId: v.id("organizations") },
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
    email: v.string(),
    appointmentDate: v.string(),
    appointmentTime: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("scheduled"), v.literal("confirmed"), v.literal("completed"), v.literal("cancelled"), v.literal("no_show"))),
    clientId: v.optional(v.id("clients")),
    cantiereId: v.optional(v.id("cantieri")),
    collaboratorId: v.optional(v.id("collaborators")),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { ...rest } = args
    const id = await ctx.db.insert("appointments", { ...rest, status: args.status || "scheduled" })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: "system",
      action: "created",
      entityType: "appointment",
      entityId: id,
      entityName: args.title,
      details: `Appuntamento "${args.title}" fissato per ${args.appointmentDate}`,
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: await resolveNotifTarget(ctx, args.organizationId),
      title: "Nuovo appuntamento",
      message: `Appuntamento "${args.title}" il ${new Date(args.appointmentDate).toLocaleDateString("it-IT")}${args.appointmentTime ? " alle " + args.appointmentTime : ""}`,
      type: "appointment_created",
      priority: "normal",
      link: "/appointments",
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("appointments"),
    organizationId: v.id("organizations"),
    title: v.optional(v.string()),
    appointmentDate: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("scheduled"), v.literal("confirmed"), v.literal("completed"), v.literal("cancelled"), v.literal("no_show"))),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (data.status && data.status !== prev.status) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: prev.organizationId,
        userEmail: await resolveNotifTarget(ctx, prev.organizationId, userEmail),
        title: `Appuntamento ${data.status === "confirmed" ? "confermato" : data.status === "completed" ? "completato" : data.status === "cancelled" ? "cancellato" : "aggiornato"}`,
        message: `Appuntamento "${prev.title}" del ${new Date(prev.appointmentDate).toLocaleDateString("it-IT")} è ora ${data.status}`,
        type: "appointment_status_change",
        priority: data.status === "cancelled" || data.status === "no_show" ? "high" : "normal",
        link: "/appointments",
      })
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("appointments"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const appt = await ctx.db.get(args.id)
    if (!appt || appt.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const appts = await ctx.db
      .query("appointments")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const today = new Date().toISOString().split("T")[0]

    return {
      total: appts.length,
      scheduled: appts.filter((a) => a.status === "scheduled").length,
      completed: appts.filter((a) => a.status === "completed").length,
      cancelled: appts.filter((a) => a.status === "cancelled").length,
      upcoming: appts.filter((a) => a.status === "scheduled" && a.appointmentDate >= today).length,
      today: appts.filter((a) => a.appointmentDate === today).length,
    }
  },
})
