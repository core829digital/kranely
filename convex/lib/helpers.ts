import { v } from "convex/values"
import { internalMutation, MutationCtx } from "../_generated/server"
import { Id } from "../_generated/dataModel"

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

export async function resolveNotifTarget(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  userEmail?: string,
): Promise<string> {
  if (userEmail) return userEmail
  const org = await ctx.db.get(organizationId)
  return org?.ownerEmail || "system"
}
