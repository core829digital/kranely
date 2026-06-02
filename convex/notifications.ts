import { internalMutation, mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { assertOrgAccess } from "./auth"

async function getAdminEmails(ctx: { db: any }, organizationId: Id<"organizations">): Promise<string[]> {
  const all = await ctx.db.query("users").withIndex("by_organization", (q: any) => q.eq("organizationId", organizationId)).collect()
  return Array.from(
    new Set(
      all
        .filter((u: any) => u.role === "admin" || u.role === "superadmin")
        .map((u: any) => u.email as string)
    )
  )
}

export const checkCertificateExpiry = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0]
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const certs = await ctx.db.query("certificates").collect()

    for (const cert of certs) {
      if (!cert.expiryDate || cert.alertSent) continue

      if (cert.expiryDate <= thirtyDays && cert.expiryDate >= today) {
        const org = await ctx.db.query("organizations").filter((q) => q.eq(q.field("_id"), cert.organizationId)).first()
        if (!org) continue

        const adminEmails = await getAdminEmails(ctx, cert.organizationId)
        if (adminEmails.length === 0) adminEmails.push(org.ownerEmail)
        for (const email of adminEmails) {
          await ctx.db.insert("notifications", {
            organizationId: cert.organizationId,
            userEmail: email,
            title: "Certificato in scadenza",
            message: `Il certificato "${cert.name}" scadrà il ${new Date(cert.expiryDate).toLocaleDateString("it-IT")}`,
            type: "certificate_expiry",
            priority: "high",
            isRead: false,
            link: `/certificates`,
          })
        }

        await ctx.db.patch(cert._id, { alertSent: true })
      }
    }
  },
})

export const checkPaymentDue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const payments = await ctx.db.query("payments").collect()

    for (const payment of payments) {
      if (!payment.dueDate || payment.status === "pagato" || payment.status === "in_verifica") continue

      if (payment.dueDate === today || payment.dueDate === tomorrow) {
        const org = await ctx.db.query("organizations").filter((q) => q.eq(q.field("_id"), payment.organizationId)).first()
        if (!org) continue

        const adminEmails = await getAdminEmails(ctx, payment.organizationId)
        if (adminEmails.length === 0) adminEmails.push(org.ownerEmail)
        for (const email of adminEmails) {
          await ctx.db.insert("notifications", {
            organizationId: payment.organizationId,
            userEmail: email,
            title: "Pagamento in scadenza",
            message: `Il pagamento di EUR${payment.amount.toLocaleString("it-IT")} "${payment.description}" è in scadenza il ${new Date(payment.dueDate).toLocaleDateString("it-IT")}`,
            type: "payment_due",
            priority: "high",
            isRead: false,
            link: `/payments`,
          })
        }
      }
    }
  },
})

export const checkOverduePayments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0]

    const payments = await ctx.db.query("payments").collect()

    for (const payment of payments) {
      if (!payment.dueDate || payment.status === "pagato" || payment.status === "in_verifica" || payment.status === "in_ritardo") continue

      if (payment.dueDate < today) {
        await ctx.db.patch(payment._id, { status: "in_ritardo" })

        const org = await ctx.db.query("organizations").filter((q) => q.eq(q.field("_id"), payment.organizationId)).first()
        if (!org) continue

        const adminEmails = await getAdminEmails(ctx, payment.organizationId)
        if (adminEmails.length === 0) adminEmails.push(org.ownerEmail)
        for (const email of adminEmails) {
          await ctx.db.insert("notifications", {
            organizationId: payment.organizationId,
            userEmail: email,
            title: "Pagamento scaduto",
            message: `Il pagamento di EUR${payment.amount.toLocaleString("it-IT")} "${payment.description}" è scaduto dal ${new Date(payment.dueDate).toLocaleDateString("it-IT")}`,
            type: "payment_due",
            priority: "urgent",
            isRead: false,
            link: `/payments`,
          })
        }
      }
    }
  },
})

export const createNotification = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent")),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
    })
  },
})

export const list = query({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let q = ctx.db.query("notifications")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))

    if (args.userEmail) {
      q = q.filter((q) => q.eq(q.field("userEmail"), args.userEmail!))
    }
    if (args.isRead !== undefined) {
      q = q.filter((q) => q.eq(q.field("isRead"), args.isRead!))
    }

    return await q.collect().then((items) => items.sort((a, b) => b._creationTime - a._creationTime))
  },
})

export const getUnreadCount = query({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const notifications = await ctx.db.query("notifications")
      .filter((q) => q.and(
        q.eq(q.field("organizationId"), args.organizationId),
        q.eq(q.field("userEmail"), args.userEmail),
        q.eq(q.field("isRead"), false)
      ))
      .collect()
    return notifications.length
  },
})

export const markAsRead = mutation({
  args: { id: v.id("notifications"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const notif = await ctx.db.get(args.id)
    if (!notif || notif.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.patch(args.id, { isRead: true, readAt: new Date().toISOString() })
  },
})

export const markAllAsRead = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const notifications = await ctx.db.query("notifications")
      .filter((q) => q.and(
        q.eq(q.field("organizationId"), args.organizationId),
        q.eq(q.field("userEmail"), args.userEmail),
        q.eq(q.field("isRead"), false)
      ))
      .collect()

    for (const n of notifications) {
      await ctx.db.patch(n._id, { isRead: true, readAt: new Date().toISOString() })
    }
  },
})

export const remove = mutation({
  args: { id: v.id("notifications"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const notif = await ctx.db.get(args.id)
    if (!notif || notif.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
  },
})

export const stats = query({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const all = await ctx.db.query("notifications")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .collect()

    const unread = all.filter((n) => !n.isRead).length
    const byType: Record<string, number> = {}
    for (const n of all) {
      byType[n.type] = (byType[n.type] || 0) + 1
    }

    return {
      unread,
      byType,
    }
  },
})
