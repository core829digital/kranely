import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const items = await ctx.db
      .query("users")
      .filter((q) => q.and(
        q.eq(q.field("organizationId"), args.organizationId),
        q.eq(q.field("role"), "driver")
      ))
      .collect()

    return items.sort((a, b) => b._creationTime - a._creationTime).map((d) => ({
      _id: d._id,
      email: d.email,
      fullName: d.fullName || "",
      role: d.role,
      phone: "",
      vehicle: "",
      licensePlate: "",
      isAvailable: true,
    }))
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    email: v.string(),
    fullName: v.string(),
    phone: v.optional(v.string()),
    vehicle: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { role: "driver" })
      return existing._id
    }

    const id = await ctx.db.insert("users", {
      email: args.email,
      fullName: args.fullName,
      role: "driver",
      organizationId: args.organizationId,
    })

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      organizationId: args.organizationId,
      userEmail: args.email,
      title: "Account autista creato",
      message: `Benvenuto ${args.fullName}! Sei stato registrato come autista.`,
      type: "driver_created",
      priority: "normal",
      link: "/suppliers",
    })

    return id
  },
})

export const remove = mutation({
  args: { id: v.id("users"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (user.role !== "admin" && user.role !== "superadmin") throw new Error("Not authorized")
    const driver = await ctx.db.get(args.id)
    if (!driver || driver.organizationId !== args.organizationId) throw new Error("Driver not found")
    if (driver.role !== "driver") throw new Error("Can only remove drivers")
    await ctx.db.delete(args.id)
    return args.id
  },
})
