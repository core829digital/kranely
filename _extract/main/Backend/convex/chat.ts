import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Channels - list user's channels AND admin conversations (unified)
export const listChannels = query({
    args: {
        email: v.string(),
        filter: v.optional(v.string()) // 'all', 'company', 'client'
    },
    handler: async (ctx, args) => {
        // Security: verify caller is requesting their own data (unless admin)
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const callerUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        const isCallerAdmin = callerUser?.role === "admin" || callerUser?.role === "superadmin";
        // Non-admins can only request their own channels
        if (!isCallerAdmin && identity.email !== args.email) return [];

        // Get regular chat channels where user is a member
        const chatChannels = await ctx.db.query("chat_channels").collect();
        const userChannels = chatChannels.filter(c => c.members.includes(args.email));

        // Get admin↔client conversations where user is the client or admin
        // IF ADMIN: Fetch ALL conversations
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        const isAdmin = user?.role === 'admin';

        let adminConversationsAsClient = [];
        let adminConversationsAsAdmin = [];
        let allConversations = [];

        if (isAdmin) {
            allConversations = await ctx.db
                .query("conversations")
                .order("desc")
                .collect();
        } else {
            adminConversationsAsClient = await ctx.db
                .query("conversations")
                .withIndex("by_client", (q) => q.eq("client_email", args.email))
                .collect();

            adminConversationsAsAdmin = await ctx.db
                .query("conversations")
                .withIndex("by_admin", (q) => q.eq("admin_email", args.email))
                .collect();

            allConversations = [...adminConversationsAsClient, ...adminConversationsAsAdmin];
        }

        const allAdminConversations = allConversations;



        // Convert admin conversations to channel-like format
        const conversationsAsChannels = allAdminConversations.map(conv => ({
            _id: conv._id,
            _creationTime: conv._creationTime,
            name: conv.client_email === args.email ? (conv.admin_name || "Amministrazione") : (conv.client_name || conv.client_email),
            type: "admin_conversation",
            members: [conv.client_email, conv.admin_email],
            last_message: conv.last_message,
            last_message_date: conv.last_message_date,
            unread_count: conv.client_email === args.email ? (conv.unread_client || 0) : (conv.unread_admin || 0),
            is_admin_chat: true,
            admin_email: conv.admin_email,
            admin_name: conv.admin_name,
            client_email: conv.client_email, // Add this to distinguish
            is_client_chat: true // Helper
        }));

        // Filter based on args.filter
        // - 'client': Show ONLY conversations with clients (admin_conversation where I am admin) OR direct client chats
        // - 'company': Show internal team chats (chat_channels)
        // - 'all': Show everything

        // Convert regular channels to include type meta
        const regularChannels = userChannels.map(c => ({
            ...c,
            is_admin_chat: false
        }));

        // Filter based on args.filter
        // - 'client': Show ONLY conversations with clients (admin_conversation where I am admin) OR direct client chats
        // - 'company': Show internal team chats (chat_channels)
        // - 'all': Show everything

        // Create virtual channels for internal_messages if needed, or just let chat_channels handle it
        // The frontend uses specific suffixes now. We should ensure they appear in the list.
        let result = [...conversationsAsChannels, ...regularChannels];

        // Ensure Admin sees all _admin_supplier channels even if not explicitly in chat_channels
        // Actually, they should be in chat_channels. Let's make sure listChannels is robust.
        
        if (args.filter === 'client') {
            result = result.filter(c => c.type === 'admin_conversation' || (c as any)._id?.toString().includes('_client'));
        } else if (args.filter === 'company') {
            result = result.filter(c => c.type !== 'admin_conversation');
        }

        return result.sort((a, b) => {
            const dateA = a.last_message_date ? new Date(a.last_message_date).getTime() : 0;
            const dateB = b.last_message_date ? new Date(b.last_message_date).getTime() : 0;
            return dateB - dateA;
        });
    },
});

export const createChannel = mutation({
    args: {
        company_email: v.optional(v.string()), // Optional now
        name: v.string(),
        type: v.string(),
        linked_id: v.optional(v.string()),
        members: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");
        return await ctx.db.insert("chat_channels", args);
    },
});

export const updateChannelLastMessage = mutation({
    args: {
        id: v.id("chat_channels"),
        last_message: v.string(),
        last_message_date: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            last_message: args.last_message,
            last_message_date: args.last_message_date,
        });
    },
});

// Messages - unified query that handles both chat_channels and admin conversations
export const listMessages = query({
    args: {
        channel_id: v.string(), // Accept string to support both types
        is_admin_chat: v.optional(v.boolean()), // Flag to indicate admin conversation
    },
    handler: async (ctx, args) => {
        // If it's an admin conversation, fetch from conversation_messages
        if (args.is_admin_chat) {
            const messages = await ctx.db
                .query("conversation_messages")
                .withIndex("by_conversation", (q) => q.eq("conversation_id", args.channel_id as any))
                .collect();

            return messages.sort((a, b) =>
                new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
            );
        }

        // Regular chat channel - fetch from channel_messages
        const messages = await ctx.db
            .query("channel_messages")
            .withIndex("by_channel", (q) => q.eq("channel_id", args.channel_id as any))
            .collect();

        return messages.sort((a, b) =>
            new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
        );
    },
});

// Alias for getChannelMessages - accepts string channel_id for cantiere messaging
export const getChannelMessages = query({
    args: { channel_id: v.string() },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("channel_messages")
            .filter((q) => q.eq(q.field("channel_id"), args.channel_id))
            .collect();

        return messages.sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
    },
});

import { checkRateLimit, RATE_LIMITS } from "./util/rateLimit";

// ... (imports)

// ... (existing code)

export const sendMessage = mutation({
    args: {
        channel_id: v.string(), // Accept string to support both channel types
        sender_email: v.string(),
        sender_name: v.string(),
        content: v.string(),
        is_admin_chat: v.optional(v.boolean()), // Flag for admin conversations
        // Support ephemeral
        is_ephemeral: v.optional(v.boolean()),
        ephemeral_expires_at: v.optional(v.string()),
        message_type: v.optional(v.string()),
        file_url: v.optional(v.string()),
        file_name: v.optional(v.string()),
        attachments: v.optional(v.array(v.object({
            file_url: v.string(),
            file_name: v.string(),
            file_type: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        await checkRateLimit(ctx, "send_message", identity.subject, RATE_LIMITS.SEND_MESSAGE);

        // Handle admin conversation
        if (args.is_admin_chat) {
            // Insert into conversation_messages
            const messageId = await ctx.db.insert("conversation_messages", {
                conversation_id: args.channel_id as any,
                sender_email: args.sender_email,
                sender_name: args.sender_name,
                content: args.content,
                attachments: args.attachments,
                created_date: new Date().toISOString(),
                read: false,
            });

            // Update conversation with last message
            const conversation = await ctx.db.get(args.channel_id as any);
            if (conversation) {
                const isClient = args.sender_email === (conversation as any).client_email;
                await ctx.db.patch(args.channel_id as any, {
                    last_message: args.content,
                    last_message_date: new Date().toISOString(),
                    unread_admin: isClient ? ((conversation as any).unread_admin || 0) + 1 : (conversation as any).unread_admin,
                    unread_client: !isClient ? ((conversation as any).unread_client || 0) + 1 : (conversation as any).unread_client,
                });
            }

            // Task 12.2: Auto-save attachments to documents
            if (args.attachments && args.attachments.length > 0) {
                for (const att of args.attachments) {
                    await ctx.db.insert("documents", {
                        title: att.file_name,
                        category: "Chat",
                        file_url: att.file_url,
                        file_name: att.file_name,
                        file_type: att.file_type || "file",
                        file_size: 0,
                        created_by: args.sender_email,
                        created_date: new Date().toISOString(),
                    });
                }
            } else if (args.file_url) {
                await ctx.db.insert("documents", {
                    title: args.file_name || "Allegato Chat",
                    category: "Chat",
                    file_url: args.file_url,
                    file_name: args.file_name || "allegato",
                    file_type: args.message_type || "file",
                    file_size: 0,
                    created_by: args.sender_email,
                    created_date: new Date().toISOString(),
                });
            }

            return messageId;
        }

        // Regular chat channel - insert into channel_messages
        const messageId = await ctx.db.insert("channel_messages", {
            channel_id: args.channel_id as any,
            sender_email: args.sender_email,
            sender_name: args.sender_name,
            content: args.content,
            is_ephemeral: args.is_ephemeral,
            ephemeral_expires_at: args.ephemeral_expires_at,
            message_type: args.message_type,
            file_url: args.file_url,
            file_name: args.file_name,
            attachments: args.attachments,
            created_date: new Date().toISOString(),
        });

        // Update channel last message (best-effort — channel may not exist for cantiere chats)
        try {
            await ctx.db.patch(args.channel_id as any, {
                last_message: args.content || (args.file_url ? 'File allegato' : 'Nuovo messaggio'),
                last_message_date: new Date().toISOString(),
            });
        } catch {
            // Channel document may not exist (e.g. cantiere channel IDs) — non-fatal
        }

        // Task 12.2: Auto-save attachments to documents (for regular channels)
        if (args.attachments && args.attachments.length > 0) {
            for (const att of args.attachments) {
                await ctx.db.insert("documents", {
                    title: att.file_name,
                    category: "Chat",
                    file_url: att.file_url,
                    file_name: att.file_name,
                    file_type: att.file_type || "file",
                    file_size: 0,
                    created_by: args.sender_email,
                    created_date: new Date().toISOString(),
                });
            }
        } else if (args.file_url) {
            await ctx.db.insert("documents", {
                title: args.file_name || "Allegato Chat",
                category: "Chat",
                file_url: args.file_url,
                file_name: args.file_name || "allegato",
                file_type: args.message_type || "file",
                file_size: 0,
                created_by: args.sender_email,
                created_date: new Date().toISOString(),
            });
        }

        await ctx.scheduler.runAfter(0, internal.notifications.triggerMessage, {
            channel_id: args.channel_id,
            sender_email: args.sender_email,
            sender_name: args.sender_name,
            content: args.content,
            is_admin_chat: args.is_admin_chat
        });

        return messageId;
    },
});

export const likeMessage = mutation({
    args: {
        messageId: v.string(), // Accept string to support both message types
        likes: v.array(v.string()), // Array of emails
        is_admin_chat: v.optional(v.boolean()), // Flag for conversation messages
    },
    handler: async (ctx, args) => {
        // Try to patch the message in the appropriate table
        // Convex IDs are strings, so we can try both tables
        try {
            if (args.is_admin_chat) {
                await ctx.db.patch(args.messageId as any, { likes: args.likes });
            } else {
                await ctx.db.patch(args.messageId as any, { likes: args.likes });
            }
        } catch (e) {
            // If first attempt fails, the message might be from the other table
            console.error("Like message error:", e);
        }
    }
});

// Send message for cantiere - accepts string channel_id (cantiere _id)
export const sendCantiereMessage = mutation({
    args: {
        channel_id: v.string(), // Can be cantiere ID
        sender_email: v.string(),
        sender_name: v.string(),
        content: v.string(),
        file_url: v.optional(v.string()),
        file_name: v.optional(v.string()),
        message_type: v.optional(v.string()), // text, voice, image, file
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        await checkRateLimit(ctx, "send_message", identity.subject, RATE_LIMITS.SEND_MESSAGE);

        const messageId = await ctx.db.insert("channel_messages", {
            channel_id: args.channel_id,
            sender_email: args.sender_email,
            sender_name: args.sender_name,
            content: args.content,
            file_url: args.file_url,
            file_name: args.file_name,
            message_type: args.message_type || 'text',
            created_date: new Date().toISOString(),
        });

        // Task 12.2: Auto-save attachments
        if (args.file_url) {
            await ctx.db.insert("documents", {
                title: args.file_name || "Allegato Cantiere",
                category: "Chat",
                file_url: args.file_url,
                file_name: args.file_name || "allegato",
                file_type: args.message_type || "file",
                file_size: 0,
                created_by: args.sender_email,
                created_date: new Date().toISOString(),
            });
        }

        return messageId;
    },
});

// Delete Channel (Admin only)
export const deleteChannel = mutation({
    args: { channel_id: v.id("chat_channels") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (user?.role !== "admin") {
            throw new Error("Unauthorized: Admin only");
        }

        const channel = await ctx.db.get(args.channel_id);
        if (!channel) throw new Error("Channel not found");

        // Delete all messages in channel
        const messages = await ctx.db
            .query("channel_messages")
            .withIndex("by_channel", (q) => q.eq("channel_id", args.channel_id as any))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }

        await ctx.db.delete(args.channel_id);

        // Log activity
        await ctx.db.insert("activity_log", {
            action: "deleted",
            entity_type: "channel",
            entity_id: args.channel_id,
            entity_name: channel.name,
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Canale chat "${channel.name}" eliminato`,
            created_date: new Date().toISOString(),
        });
    },
});

// Delete Channel Message (Admin or Sender)
export const deleteChannelMessage = mutation({
    args: { message_id: v.id("channel_messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const msg = await ctx.db.get(args.message_id);
        if (!msg) throw new Error("Message not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        const isAdmin = user?.role === "admin" || user?.role === "superadmin";
        const isSender = msg.sender_email === identity.email;

        if (!isAdmin && !isSender) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.message_id);

        // Log activity (optional for single messages, but for consistency)
        await ctx.db.insert("activity_log", {
            action: "deleted",
            entity_type: "channel_message",
            entity_id: args.message_id,
            entity_name: "Messaggio Canale",
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Messaggio rimosso da ${identity.email}`,
            created_date: new Date().toISOString(),
        });
    },
});
