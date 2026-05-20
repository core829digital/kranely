import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, requireAnyAuth, getCallerInfo } from "./rbac";
import { internal } from "./_generated/api";
import { checkRateLimit, RATE_LIMITS } from "./util/rateLimit";

// ═══════════════════════════════════════════
// INTERNAL MESSAGES — IWHome Communication System
// Supports channels: supplier, collaborator, delivery
// ═══════════════════════════════════════════

export const send = mutation({
    args: {
        channel_type: v.string(), // supplier | collaborator | delivery
        channel_id: v.string(),
        channel_name: v.optional(v.string()),
        message: v.string(),
        message_type: v.optional(v.string()),
        attachments: v.optional(v.array(v.string())),
        // Task 6: File/media support
        file_url: v.optional(v.string()),
        file_name: v.optional(v.string()),
        file_type: v.optional(v.string()), // image | video | voice | document
        file_size: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);

        // Rate limit: 10 messages per minute per user (same as chat)
        await checkRateLimit(ctx, "send_internal_message", caller.email, RATE_LIMITS.SEND_MESSAGE);

        const id = await ctx.db.insert("internal_messages", {
            channel_type: args.channel_type,
            channel_id: args.channel_id,
            channel_name: args.channel_name,
            sender_email: caller.email,
            sender_name: caller.email,
            sender_role: caller.role || "user",
            message: args.message,
            message_type: args.message_type || (args.file_type ? "file" : "text"),
            attachments: args.attachments,
            // Task 6: File/media
            file_url: args.file_url,
            file_name: args.file_name,
            file_type: args.file_type,
            file_size: args.file_size,
            read: false,
            created_date: new Date().toISOString(),
        });

        // Create notification for the recipient(s)
        if (args.channel_type === "supplier") {
            const rawId = args.channel_id.split('_')[0];
            const supplier = await ctx.db.get(rawId as any) as any;
            if (caller.role === "supplier") {
                // Supplier sent a message → notify ALL admins
                await ctx.scheduler.runAfter(0, internal.notifications.triggerInternalMessageFromSupplier, {
                    supplier_name: supplier?.name ?? caller.email,
                    supplier_email: caller.email,
                    message_preview: args.message,
                    channel_id: args.channel_id,
                });
            } else {
                // Admin/system sent a message → notify the supplier
                if (supplier?.email) {
                    await ctx.db.insert("notifications", {
                        user_email: supplier.email,
                        type: "internal_message",
                        title: "💬 Nuovo Messaggio da IWHome",
                        message: args.message.length > 80 ? args.message.substring(0, 80) + "..." : args.message,
                        link: "/Fornitori",
                        read: false,
                        priority: "high",
                        created_date: new Date().toISOString(),
                        sender_email: caller.email,
                    });
                }
            }
        } else if (args.channel_type === "collaborator") {
            const rawId = args.channel_id.split('_')[0];
            const collab = await ctx.db.get(rawId as any) as any;
            if (collab?.email) {
                await ctx.db.insert("notifications", {
                    user_email: collab.email,
                    type: "internal_message",
                    title: "Nuovo Messaggio",
                    message: `${caller.email}: ${args.message.substring(0, 80)}...`,
                    link: "/Collaboratori",
                    read: false,
                    created_date: new Date().toISOString(),
                    sender_email: caller.email,
                });
            }
        }

        // Task 12.2: Auto-save attachments to documents
        if (args.attachments && args.attachments.length > 0) {
            for (const att of args.attachments) {
                // If attachments were just strings (which the older definition `v.array(v.string())` supports)
                // handle string URLs
                if (typeof att === 'string') {
                    await ctx.db.insert("documents", {
                        title: "Allegato Messaggio Interno",
                        category: "Chat",
                        file_url: att,
                        file_name: "allegato",
                        file_type: "file",
                        file_size: 0,
                        created_by: caller.email,
                        created_date: new Date().toISOString(),
                    });
                }
            }
        } else if (args.file_url) {
            await ctx.db.insert("documents", {
                title: args.file_name || "Allegato Messaggio Interno",
                category: "Chat",
                file_url: args.file_url,
                file_name: args.file_name || "allegato",
                file_type: args.file_type || "file",
                file_size: args.file_size || 0,
                created_by: caller.email,
                created_date: new Date().toISOString(),
            });
        }

        return id;
    },
});

export const list = query({
    args: {
        channel_type: v.string(),
        channel_id: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        return await ctx.db
            .query("internal_messages")
            .withIndex("by_channel", (q: any) =>
                q.eq("channel_type", args.channel_type).eq("channel_id", args.channel_id)
            )
            .collect();
    },
});

export const markAsRead = mutation({
    args: {
        channel_type: v.string(),
        channel_id: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const messages = await ctx.db
            .query("internal_messages")
            .withIndex("by_channel", (q: any) =>
                q.eq("channel_type", args.channel_type).eq("channel_id", args.channel_id)
            )
            .collect();
        // Mark only messages NOT sent by this user as read
        for (const msg of messages) {
            if (msg.sender_email !== caller.email && !msg.read) {
                await ctx.db.patch(msg._id, {
                    read: true,
                    read_date: new Date().toISOString(),
                });
            }
        }
    },
});

export const getUnreadCount = query({
    args: {
        channel_type: v.string(),
        channel_id: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return 0;
        const messages = await ctx.db
            .query("internal_messages")
            .withIndex("by_channel", (q: any) =>
                q.eq("channel_type", args.channel_type).eq("channel_id", args.channel_id)
            )
            .collect();
        return messages.filter(m => m.sender_email !== caller.email && !m.read).length;
    },
});

// Get all channels with unread counts for a given type
export const getChannelSummaries = query({
    args: {
        channel_type: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];

        // Get all messages for this channel type
        const allMessages = await ctx.db
            .query("internal_messages")
            .withIndex("by_channel", (q: any) => q.eq("channel_type", args.channel_type))
            .collect();

        // Group by channel_id
        const channelMap = new Map<string, { channel_id: string; channel_name: string; lastMessage: string; lastDate: string; unread: number }>();

        for (const msg of allMessages) {
            const existing = channelMap.get(msg.channel_id);
            const isUnread = msg.sender_email !== caller.email && !msg.read;

            if (!existing || msg.created_date > existing.lastDate) {
                channelMap.set(msg.channel_id, {
                    channel_id: msg.channel_id,
                    channel_name: msg.channel_name || msg.channel_id,
                    lastMessage: msg.message,
                    lastDate: msg.created_date,
                    unread: (existing?.unread || 0) + (isUnread ? 1 : 0),
                });
            } else if (isUnread) {
                existing.unread += 1;
            }
        }

        return Array.from(channelMap.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
    },
});

// Task 6: Search messages by keyword within a channel
export const searchMessages = query({
    args: {
        channel_type: v.string(),
        channel_id: v.string(),
        keyword: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        const messages = await ctx.db
            .query("internal_messages")
            .withIndex("by_channel", (q: any) =>
                q.eq("channel_type", args.channel_type).eq("channel_id", args.channel_id)
            )
            .collect();
        const kw = args.keyword.toLowerCase();
        return messages.filter(m => m.message.toLowerCase().includes(kw));
    },
});
