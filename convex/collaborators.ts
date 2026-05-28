import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { hashPassword, assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), search: v.optional(v.string()), type: v.optional(v.string()), status: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("collaborators").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.search) {
      const s = args.search.toLowerCase()
      filtered = filtered.filter((c) => c.fullName.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || (c.specialization && c.specialization.toLowerCase().includes(s)))
    }
    if (args.type && args.type !== "all") filtered = filtered.filter((c) => c.type === args.type)
    if (args.status && args.status !== "all") filtered = filtered.filter((c) => c.status === args.status)

    return filtered
  },
})

export const get = query({
  args: { id: v.id("collaborators"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    return doc
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    type: v.optional(v.union(v.literal("employee"), v.literal("contractor"), v.literal("subcontractor"), v.literal("freelancer"))),
    jobTitle: v.optional(v.string()),
    specialization: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("on_leave"))),
    contractType: v.optional(v.union(v.literal("tempo_pieno"), v.literal("tempo_parziale"), v.literal("freelance"), v.literal("subappalto"))),
    hourlyRate: v.optional(v.number()),
    dailyRate: v.optional(v.number()),
    salary: v.optional(v.number()),
    fiscalCode: v.optional(v.string()),
    iban: v.optional(v.string()),
    notes: v.optional(v.string()),
    liveStatus: v.optional(v.union(v.literal("in_cantiere"), v.literal("in_ufficio"), v.literal("disponibile"), v.literal("non_disponibile"))),
    contractStartDate: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { userEmail, ...rest } = args
    const id = await ctx.db.insert("collaborators", { ...rest, status: args.status || "active", liveStatus: args.liveStatus || "disponibile", type: args.type || "employee" })

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      action: "created",
      entityType: "collaborator",
      entityId: id,
      entityName: args.fullName,
      details: `Collaboratore "${args.fullName}" aggiunto`,
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      title: "Nuovo collaboratore",
      message: `Collaboratore "${args.fullName}" aggiunto come ${args.type || "employee"}`,
      type: "collaborator_created",
      priority: "normal",
      link: "/collaborators",
    })

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("collaborators"),
    organizationId: v.id("organizations"),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    type: v.optional(v.union(v.literal("employee"), v.literal("contractor"), v.literal("subcontractor"), v.literal("freelancer"))),
    jobTitle: v.optional(v.string()),
    specialization: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("on_leave"))),
    contractType: v.optional(v.union(v.literal("tempo_pieno"), v.literal("tempo_parziale"), v.literal("freelance"), v.literal("subappalto"))),
    hourlyRate: v.optional(v.number()),
    dailyRate: v.optional(v.number()),
    salary: v.optional(v.number()),
    fiscalCode: v.optional(v.string()),
    iban: v.optional(v.string()),
    notes: v.optional(v.string()),
    liveStatus: v.optional(v.union(v.literal("in_cantiere"), v.literal("in_ufficio"), v.literal("disponibile"), v.literal("non_disponibile"))),
    contractStartDate: v.optional(v.string()),
    contractEndDate: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: userEmail || "system",
      action: "updated",
      entityType: "collaborator",
      entityId: id,
      entityName: prev.fullName,
      details: `Collaboratore "${prev.fullName}" aggiornato`,
    })

    if (data.status && data.status !== prev.status) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        organizationId: prev.organizationId,
        userEmail: userEmail || "system",
        title: "Stato collaboratore aggiornato",
        message: `Il collaboratore "${prev.fullName}" è ora "${data.status === "active" ? "Attivo" : data.status === "inactive" ? "Inattivo" : "In ferie"}"`,
        type: "collaborator_status_change",
        priority: "normal",
        link: "/collaborators",
      })
    }

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("collaborators"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const collab = await ctx.db.get(args.id)
    if (!collab || collab.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "collaborator",
      entityId: args.id,
      entityName: collab.fullName,
      details: `Collaboratore "${collab.fullName}" rimosso`,
    })

    return args.id
  },
})

export const addHours = mutation({
  args: {
    organizationId: v.id("organizations"),
    collaboratorId: v.id("collaborators"),
    cantiereId: v.optional(v.id("cantieri")),
    date: v.string(),
    hours: v.number(),
    description: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { userEmail, ...rest } = args
    const id = await ctx.db.insert("collaboratorHours", { ...rest, approved: false })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: userEmail || "system",
      title: "Ore registrate",
      message: `Ore registrate: ${args.hours}h per collaboratore il ${args.date}`,
      type: "hours_logged",
      priority: "normal",
      link: "/collaborators",
    })

    return id
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const collabs = await ctx.db
      .query("collaborators")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const employeeCount = collabs.filter((c) => c.type === "employee").length
    const contractorCount = collabs.filter((c) => c.type === "contractor" || c.type === "freelancer" || c.type === "subcontractor").length

    return {
      total: collabs.length,
      active: collabs.filter((c) => c.status === "active").length,
      inactive: collabs.filter((c) => c.status === "inactive").length,
      onLeave: collabs.filter((c) => c.status === "on_leave").length,
      inCantiere: collabs.filter((c) => c.liveStatus === "in_cantiere").length,
      disponibile: collabs.filter((c) => c.liveStatus === "disponibile").length,
      employees: employeeCount,
      contractors: contractorCount,
    }
  },
})

export const listHours = query({
  args: { organizationId: v.id("organizations"), collaboratorId: v.optional(v.id("collaborators")), cantiereId: v.optional(v.id("cantieri")), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db.query("collaboratorHours").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    if (args.collaboratorId) filtered = filtered.filter((h) => h.collaboratorId === args.collaboratorId)
    if (args.cantiereId) filtered = filtered.filter((h) => h.cantiereId === args.cantiereId)
    return filtered
  },
})

export const updateHours = mutation({
  args: {
    id: v.id("collaboratorHours"),
    organizationId: v.id("organizations"),
    hours: v.optional(v.number()),
    description: v.optional(v.string()),
    approved: v.optional(v.boolean()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { id, organizationId, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: args.userEmail || "system",
      action: "updated",
      entityType: "collaboratorHours",
      entityId: id,
      details: `Ore collaboratore aggiornate`,
    })

    return id
  },
})

export const removeHours = mutation({
  args: { id: v.id("collaboratorHours"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: "deleted",
      entityType: "collaboratorHours",
      entityId: args.id,
      details: `Ore collaboratore rimosse`,
    })

    return args.id
  },
})

export const generateOnboardingLink = mutation({
  args: {
    collaboratorId: v.id("collaborators"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const collab = await ctx.db.get(args.collaboratorId)
    if (!collab) throw new Error("Collaboratore non trovato")

    const tokenBytes = crypto.getRandomValues(new Uint8Array(24))
    const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("")
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await ctx.db.patch(args.collaboratorId, {
      onboardingToken: token,
      onboardingExpires: expires,
    })

    return { token, expires }
  },
})

export const getByOnboardingToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("collaborators").collect()
    const collab = all.find((c) => c.onboardingToken === args.token)
    if (!collab) return null
    if (collab.onboardingExpires && new Date(collab.onboardingExpires) < new Date()) {
      return { expired: true, fullName: collab.fullName }
    }
    return {
      _id: collab._id,
      fullName: collab.fullName,
      email: collab.email,
      phone: collab.phone,
      userId: collab.userId,
      expired: false,
    }
  },
})

export const completeOnboarding = mutation({
  args: {
    token: v.string(),
    fullName: v.string(),
    phone: v.optional(v.string()),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("collaborators").collect()
    const collab = all.find((c) => c.onboardingToken === args.token)
    if (!collab) throw new Error("Token non valido")
    if (collab.onboardingExpires && new Date(collab.onboardingExpires) < new Date()) {
      throw new Error("Token scaduto")
    }
    if (args.newPassword.length < 8) throw new Error("Password troppo corta (min 8 caratteri)")

    let userId = collab.userId

    if (userId) {
      await ctx.db.patch(userId, {
        fullName: args.fullName,
        phone: args.phone || collab.phone,
      })
      const passwordHash = await hashPassword(args.newPassword)
      await ctx.db.patch(userId, { passwordHash })
    } else {
      const passwordHash = await hashPassword(args.newPassword)
      userId = await ctx.db.insert("users", {
        email: collab.email,
        fullName: args.fullName,
        role: "collaborator",
        phone: args.phone || collab.phone,
        passwordHash,
        organizationId: collab.organizationId,
      })
      await ctx.db.patch(collab._id, { userId })
    }

    await ctx.db.patch(collab._id, {
      onboardingToken: undefined,
      onboardingExpires: undefined,
      temporaryPassword: undefined,
    })

    await ctx.db.insert("activityLog", {
      organizationId: collab.organizationId,
      userEmail: collab.email,
      action: "onboarding_completed",
      entityType: "collaborator",
      entityId: collab._id,
      entityName: args.fullName,
      details: `Collaboratore "${args.fullName}" ha completato l'onboarding`,
    })

    return true
  },
})
