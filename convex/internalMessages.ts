import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const list = query({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    channelType: v.string(),
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let filtered = await ctx.db
      .query("internalMessages")
      .withIndex("by_channel", (q) => q.eq("channelType", args.channelType).eq("channelId", args.channelId))
      .collect()
    filtered = filtered.sort((a, b) => b._creationTime - a._creationTime)
    filtered = filtered.filter((m) => m.organizationId === args.organizationId)
    return filtered
  },
})

export const send = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    channelType: v.string(),
    channelId: v.string(),
    channelName: v.optional(v.string()),
    senderEmail: v.string(),
    senderName: v.optional(v.string()),
    senderRole: v.optional(v.string()),
    message: v.string(),
    messageType: v.optional(v.union(v.literal("text"), v.literal("system"), v.literal("alert"), v.literal("file"), v.literal("voice"))),
    attachments: v.optional(v.array(v.string())),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("voice"), v.literal("document"))),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const id = await ctx.db.insert("internalMessages", {
      ...args,
      read: false,
    })
    return id
  },
})

export const markRead = mutation({
  args: {
    organizationId: v.id("organizations"),
    channelType: v.string(),
    channelId: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const allMsgs = await ctx.db
      .query("internalMessages")
      .withIndex("by_channel", (q) => q.eq("channelType", args.channelType).eq("channelId", args.channelId))
      .collect()
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    const isParticipant = allMsgs.some((m) => m.senderEmail === user.email)
    if (!isAdmin && !isParticipant) {
      throw new Error("markRead: caller is not a participant of this channel")
    }
    for (const msg of allMsgs) {
      if (!msg.read && msg.senderEmail !== args.userEmail && msg.organizationId === args.organizationId) {
        await ctx.db.patch(msg._id, { read: true, readDate: new Date().toISOString() })
      }
    }
  },
})

export const remove = mutation({
  args: { id: v.id("internalMessages"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    if (!isAdmin && doc.senderEmail !== user.email) {
      throw new Error("Not authorized: only sender or admin can delete")
    }
    await ctx.db.delete(args.id)
    return args.id
  },
})
