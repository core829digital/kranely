import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: {
    organizationId: v.id("organizations"),
    channelType: v.string(),
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query("internalMessages")
      .withIndex("by_channel", (q) => q.eq("channelType", args.channelType).eq("channelId", args.channelId))
      .collect()
    return msgs
      .filter((m) => m.organizationId === args.organizationId)
      .sort((a, b) => a._creationTime - b._creationTime)
  },
})

export const send = mutation({
  args: {
    organizationId: v.id("organizations"),
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
    const msgs = await ctx.db
      .query("internalMessages")
      .withIndex("by_channel", (q) => q.eq("channelType", args.channelType).eq("channelId", args.channelId))
      .collect()
    for (const msg of msgs) {
      if (!msg.read && msg.senderEmail !== args.userEmail && msg.organizationId === args.organizationId) {
        await ctx.db.patch(msg._id, { read: true, readDate: new Date().toISOString() })
      }
    }
  },
})

export const remove = mutation({
  args: { id: v.id("internalMessages"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})
