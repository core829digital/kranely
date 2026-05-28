import { v } from "convex/values"
import { internalAction, internalMutation, QueryCtx, MutationCtx } from "../_generated/server"
import { internal } from "../_generated/api"
import { Doc, Id, TableNames } from "../_generated/dataModel"

export async function getDocOrThrow<T extends Doc<TableNames>>(
  ctx: QueryCtx | MutationCtx,
  id: Id<any>,
  organizationId: Id<"organizations">,
): Promise<T & { organizationId: Id<"organizations"> }> {
  const doc = await (ctx.db as any).get(id) as T | null
  if (!doc || (doc as any).organizationId !== organizationId) throw new Error("Not found")
  return doc as T & { organizationId: Id<"organizations"> }
}

export const logActivity = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    entityName: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      entityName: args.entityName,
      details: args.details,
    })
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
    await ctx.db.insert("notifications", {
      organizationId: args.organizationId,
      userEmail: args.userEmail,
      title: args.title,
      message: args.message,
      type: args.type,
      priority: args.priority,
      link: args.link,
      isRead: false,
    })
  },
})

export async function resolveNotifTarget(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  userEmail?: string,
): Promise<string> {
  if (userEmail) return userEmail
  const org = await ctx.db.get(organizationId)
  return org?.ownerEmail || "system"
}

export async function notifyAndLog(
  ctx: any,
  orgId: string,
  userEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  entityName: string | undefined,
  logDetails: string,
  notifTitle: string,
  notifMessage: string,
  notifType: string,
  notifPriority: "low" | "normal" | "high" | "urgent",
  notifLink?: string,
) {
  await ctx.scheduler.runAfter(0, internal.lib.helpers.logActivity, {
    organizationId: orgId,
    userEmail,
    action,
    entityType,
    entityId,
    entityName,
    details: logDetails,
  })

  await ctx.scheduler.runAfter(0, internal.lib.helpers.createNotification, {
    organizationId: orgId,
    userEmail,
    title: notifTitle,
    message: notifMessage,
    type: notifType,
    priority: notifPriority,
    link: notifLink,
  })
}
