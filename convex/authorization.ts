import { v } from "convex/values"
import { query } from "./_generated/server"

export const verifyOrgMembership = query({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.userEmail))
      .first()

    if (!user) return { authorized: false, role: "unauthorized", reason: "User not found" }
    if (user.organizationId && user.organizationId !== args.organizationId) {
      return { authorized: false, role: user.role, reason: "Wrong organization" }
    }

    const isAdmin = user.role === "admin" || user.role === "superadmin"
    return { authorized: true, role: user.role, isAdmin, userId: user._id }
  },
})

export const canAccessEntity = query({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    entity: v.string(),
    action: v.union(v.literal("view"), v.literal("create"), v.literal("edit"), v.literal("delete")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.userEmail))
      .first()

    if (!user) return { allowed: false, reason: "User not found" }

    const role = user.role
    if (role === "superadmin") return { allowed: true }

    const ADMINS = new Set(["superadmin", "admin"])
    if (ADMINS.has(role)) return { allowed: true }

    const PERMISSIONS: Record<string, Record<string, Set<string>>> = {
      collaborator: {
        view: new Set(["cantieri", "certificates", "tasks", "messages", "documents", "appointments"]),
        create: new Set(["tasks", "messages"]),
        edit: new Set(["cantieri", "tasks"]),
      },
      supplier: {
        view: new Set(["orders", "production", "messages", "documents"]),
        edit: new Set(["orders", "production"]),
        create: new Set(["messages"]),
      },
      driver: {
        view: new Set(["deliveries", "messages"]),
        edit: new Set(["deliveries"]),
        create: new Set(["messages"]),
      },
      client: {
        view: new Set(["quotes", "cantieri", "payments", "messages", "documents", "appointments"]),
        create: new Set(["messages"]),
      },
    }

    const rolePerms = PERMISSIONS[role]
    if (!rolePerms) return { allowed: false, reason: "No permissions for role" }

    const actionPerms = rolePerms[args.action]
    if (!actionPerms) return { allowed: false, reason: "Action not permitted" }

    return { allowed: actionPerms.has(args.entity), reason: actionPerms.has(args.entity) ? "ok" : "Entity not permitted" }
  },
})

export const canChatWith = query({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.userEmail))
      .first()

    if (!user) return { allowed: false, channels: [] as string[] }

    const isAdmin = user.role === "admin" || user.role === "superadmin"

    if (isAdmin) {
      return { allowed: true, channels: ["general", "announcement"] }
    }

    if (user.role === "collaborator") {
      return { allowed: true, channels: ["general", "project", "announcement"] }
    }

    if (user.role === "supplier" || user.role === "driver" || user.role === "client") {
      const channels = await ctx.db
        .query("chatChannels")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .filter((q) => q.or(
          q.eq(q.field("type"), "general"),
          q.eq(q.field("type"), "announcement"),
        ))
        .collect()
      return { allowed: true, channels: channels.map((c) => c._id.toString()) }
    }

    return { allowed: false, channels: [] as string[] }
  },
})
