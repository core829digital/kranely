import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: { conversationId: v.id("conversations"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId)
    if (!conv || conv.organizationId !== args.organizationId) throw new Error("Not found")
    const messages = await ctx.db
      .query("conversationMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()
    return messages.sort((a, b) => a._creationTime - b._creationTime)
  },
})

export const send = mutation({
  args: {
    organizationId: v.id("organizations"),
    conversationId: v.id("conversations"),
    senderEmail: v.string(),
    senderName: v.string(),
    content: v.string(),
    attachments: v.optional(v.any()),
    pollId: v.optional(v.id("quotePolls")),
  },
  handler: async (ctx, args) => {
    const { conversationId, organizationId, ...rest } = args
    const conv = await ctx.db.get(conversationId)
    if (!conv || conv.organizationId !== organizationId) throw new Error("Not found")
    const id = await ctx.db.insert("conversationMessages", {
      conversationId,
      organizationId,
      ...rest,
      read: false,
    })
    await ctx.db.patch(conversationId, {
      lastMessage: rest.content.substring(0, 100),
      lastMessageDate: new Date().toISOString(),
    })
    return id
  },
})

export const markRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    organizationId: v.id("organizations"),
    readerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId)
    if (!conv || conv.organizationId !== args.organizationId) throw new Error("Not found")
    const messages = await ctx.db
      .query("conversationMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()
    for (const msg of messages) {
      if (!msg.read) {
        await ctx.db.patch(msg._id, { read: true })
      }
    }
    const isAdmin = args.readerEmail === conv.adminEmail
    await ctx.db.patch(args.conversationId, {
      [isAdmin ? "unreadAdmin" : "unreadClient"]: 0,
    })
  },
})

export const remove = mutation({
  args: { id: v.id("conversationMessages"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (!doc || doc.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})
