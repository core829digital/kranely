import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"

// ═══════════════════════════════════════════════════════
// CHAT - Internal Messages
// ═══════════════════════════════════════════════════════

export const listChannels = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const channels = await ctx.db
      .query("chatChannels")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const user = args.userEmail
      ? await ctx.db.query("users").withIndex("by_email", (q: any) => q.eq("email", args.userEmail!)).first()
      : null

    const isAdmin = user && (user.role === "admin" || user.role === "superadmin")
    const isCollaborator = user?.role === "collaborator"

    const filtered = channels.filter((ch) => {
      if (isAdmin) return true
      if (isCollaborator) return ch.type === "general" || ch.type === "project" || ch.type === "announcement"
      if (ch.type === "general" || ch.type === "announcement") return true
      if (ch.members?.includes(args.userEmail || "")) return true
      return false
    })

    return filtered.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const getChannel = query({
  args: { id: v.id("chatChannels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const createChannel = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    type: v.union(v.literal("general"), v.literal("project"), v.literal("private"), v.literal("announcement")),
    description: v.optional(v.string()),
    linkedId: v.optional(v.string()),
    members: v.optional(v.array(v.string())),
    createdById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args
    const id = await ctx.db.insert("chatChannels", { ...rest, createdById })
    return id
  },
})

export const listMessages = query({
  args: { channelId: v.id("chatChannels"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("channelMessages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))

    const messages = await q.collect()
    const sorted = messages.sort((a, b) => a._creationTime - b._creationTime)

    if (args.limit) return sorted.slice(-args.limit)
    return sorted
  },
})

export const sendMessage = mutation({
  args: {
    organizationId: v.id("organizations"),
    channelId: v.id("chatChannels"),
    senderEmail: v.string(),
    content: v.string(),
    replyTo: v.optional(v.id("channelMessages")),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { replyTo, ...rest } = args
    const id = await ctx.db.insert("channelMessages", {
      ...rest,
      replyTo,
      attachments: args.attachments || [],
    })

    const channel = await ctx.db.get(args.channelId)
    if (channel) {
      await ctx.db.patch(args.channelId, {
        lastActivity: new Date().toISOString(),
        lastMessage: args.content.slice(0, 100),
        lastMessageDate: new Date().toISOString(),
      })

      const otherMembers = (channel.members || []).filter((m) => m !== args.senderEmail)
      for (const memberEmail of otherMembers) {
        await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
          organizationId: args.organizationId,
          userEmail: memberEmail,
          title: `Nuovo messaggio in ${channel.name}`,
          message: args.content.slice(0, 150),
          type: "new_message",
          priority: "normal",
          link: "/messages",
        })
      }
    }

    return id
  },
})

export const deleteMessage = mutation({
  args: { id: v.id("channelMessages") },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.id)
    if (!msg) throw new Error("Message not found")
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const markRead = mutation({
  args: { channelId: v.id("chatChannels"), userEmail: v.string() },
  handler: async (ctx, args) => {
    // In a real app, you'd track read receipts per user
    return true
  },
})

export const stats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const channels = await ctx.db
      .query("chatChannels")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    return {
      totalChannels: channels.length,
      general: channels.filter((c) => c.type === "general").length,
      project: channels.filter((c) => c.type === "project").length,
      private: channels.filter((c) => c.type === "private").length,
    }
  },
})
