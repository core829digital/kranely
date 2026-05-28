import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { assertOrgAccess } from "./auth"

// ═══════════════════════════════════════════════════════
// CHAT - Internal Messages
// ═══════════════════════════════════════════════════════

export const listChannels = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userAuth = await assertOrgAccess(ctx, args.userEmail, args.organizationId)

    const isAdmin = userAuth && (userAuth.role === "admin" || userAuth.role === "superadmin")
    const isCollaborator = userAuth?.role === "collaborator"

    const items = await ctx.db
      .query("chatChannels")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const filtered = items.filter((ch) => {
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
  args: { id: v.id("chatChannels"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const channel = await ctx.db.get(args.id)
    if (!channel || channel.organizationId !== args.organizationId) throw new Error("Channel not found")
    return channel
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
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { createdById, ...rest } = args
    const id = await ctx.db.insert("chatChannels", { ...rest, createdById })
    return id
  },
})

export const listMessages = query({
  args: { channelId: v.id("chatChannels"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const channel = await ctx.db.get(args.channelId)
    if (!channel || channel.organizationId !== args.organizationId) throw new Error("Channel not found")
    return await ctx.db
      .query("channelMessages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect()
      .then((items) => items.sort((a, b) => b._creationTime - a._creationTime))
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
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
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
  args: { id: v.id("channelMessages"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
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
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
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
