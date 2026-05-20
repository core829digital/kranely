import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCallerInfo } from "./rbac";

// CEO/Admin ↔ Client Conversations

// List conversations for CEO/Admin
export const listAdminConversations = query({
    args: {},
    handler: async (ctx) => {
        const caller = await getCallerInfo(ctx);
        if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) return [];

        return await ctx.db
            .query("conversations")
            .order("desc")
            .collect();
    },
});

// List conversations for a client
export const listClientConversations = query({
    args: { client_email: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("conversations")
            .withIndex("by_client", (q) => q.eq("client_email", args.client_email))
            .collect();
    },
});

// Get or create conversation between client and admin
export const getOrCreateConversation = mutation({
    args: {
        client_email: v.string(),
        client_name: v.optional(v.string()),
        admin_email: v.string(),
        admin_name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Check if conversation exists
        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_client", (q) => q.eq("client_email", args.client_email))
            .filter((q) => q.eq(q.field("admin_email"), args.admin_email))
            .first();

        if (existing) return existing._id;

        // Create new conversation
        return await ctx.db.insert("conversations", {
            client_email: args.client_email,
            admin_email: args.admin_email,
            client_name: args.client_name,
            admin_name: args.admin_name,
            unread_client: 0,
            unread_admin: 0,
            created_date: new Date().toISOString(),
        });
    },
});

// Get messages for a conversation
export const getMessages = query({
    args: { conversation_id: v.id("conversations") },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];

        const conversation = await ctx.db.get(args.conversation_id);
        if (!conversation) return [];

        // Only participants (client or admin in this conversation) or system admins can read messages
        const isParticipant = conversation.client_email === caller.email || conversation.admin_email === caller.email;
        const isAdmin = caller.role === "admin" || caller.role === "superadmin";
        if (!isParticipant && !isAdmin) return [];

        return await ctx.db
            .query("conversation_messages")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversation_id))
            .order("asc")
            .collect();
    },
});

// Send message in conversation
export const sendMessage = mutation({
    args: {
        conversation_id: v.id("conversations"),
        content: v.string(),
        attachments: v.optional(v.array(v.object({
            file_url: v.string(),
            file_name: v.string(),
            file_type: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const senderEmail = identity.email || "";
        const senderName = identity.name || senderEmail.split("@")[0];

        // Insert message
        const messageId = await ctx.db.insert("conversation_messages", {
            conversation_id: args.conversation_id,
            sender_email: senderEmail,
            sender_name: senderName,
            content: args.content,
            attachments: args.attachments,
            created_date: new Date().toISOString(),
            read: false,
        });

        // Update conversation with last message
        const conversation = await ctx.db.get(args.conversation_id);
        if (conversation) {
            const isClient = senderEmail === conversation.client_email;
            await ctx.db.patch(args.conversation_id, {
                last_message: args.content,
                last_message_date: new Date().toISOString(),
                unread_admin: isClient ? (conversation.unread_admin || 0) + 1 : conversation.unread_admin,
                unread_client: !isClient ? (conversation.unread_client || 0) + 1 : conversation.unread_client,
            });
        }

        return messageId;
    },
});

// Mark messages as read
export const markAsRead = mutation({
    args: {
        conversation_id: v.id("conversations"),
        reader_email: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const conversation = await ctx.db.get(args.conversation_id);
        if (!conversation) throw new Error("Conversation not found");

        const isClient = args.reader_email === conversation.client_email;

        // Update unread counter
        await ctx.db.patch(args.conversation_id, {
            [isClient ? "unread_client" : "unread_admin"]: 0,
        });

        // Mark all messages as read
        const messages = await ctx.db
            .query("conversation_messages")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversation_id))
            .filter((q) => q.neq(q.field("sender_email"), args.reader_email))
            .collect();

        for (const msg of messages) {
            if (!msg.read) {
                await ctx.db.patch(msg._id, { read: true });
            }
        }
    },
});

// Delete Conversation (Admin Only)
export const deleteConversation = mutation({
    args: { conversation_id: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Simple check: Only participants or Admin can delete? 
        // For "Global Delete", let's restrict to Admin/CEO for safety, or allow participants.
        // Let's allow if user is part of it OR admin.

        const conversation = await ctx.db.get(args.conversation_id);
        if (!conversation) throw new Error("Conversation not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        const isAdmin = user?.role === 'admin';
        const isParticipant = conversation.client_email === identity.email || conversation.admin_email === identity.email;

        if (!isAdmin && !isParticipant) {
            throw new Error("Unauthorized");
        }

        // Delete all messages
        const messages = await ctx.db
            .query("conversation_messages")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversation_id))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }

        // Delete conversation
        await ctx.db.delete(args.conversation_id);

        // Log activity
        await ctx.db.insert("activity_log", {
            action: "deleted",
            entity_type: "conversation",
            entity_id: args.conversation_id,
            entity_name: `Conversazione con ${conversation.client_email}`,
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Conversazione eliminata da ${identity.email}`,
            created_date: new Date().toISOString(),
        });
    },
});

export const deleteMessage = mutation({
    args: { message_id: v.id("conversation_messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const message = await ctx.db.get(args.message_id);
        if (!message) throw new Error("Message not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        // Allow deletion if Admin/CEO or if the user is the sender (optional, can restrict to just admin)
        const isAdmin = user?.role === 'admin';
        const isSender = message.sender_email === identity.email;

        if (!isAdmin && !isSender) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.message_id);

        // Log activity
        await ctx.db.insert("activity_log", {
            action: "deleted",
            entity_type: "message",
            entity_id: args.message_id,
            entity_name: "Messaggio Chat",
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Messaggio eliminato da ${identity.email}`,
            created_date: new Date().toISOString(),
        });
    },
});
// Cleanup: Remove all self-conversations (Admin matching Client email)
export const cleanupSelfConversations = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const selfConversations = await ctx.db
            .query("conversations")
            .filter((q) => q.eq(q.field("client_email"), q.field("admin_email")))
            .collect();

        let deletedCount = 0;
        for (const conv of selfConversations) {
            // Delete messages first
            const messages = await ctx.db
                .query("conversation_messages")
                .withIndex("by_conversation", (q) => q.eq("conversation_id", conv._id))
                .collect();

            for (const msg of messages) {
                await ctx.db.delete(msg._id);
            }

            // Delete conversation
            await ctx.db.delete(conv._id);
            deletedCount++;
        }

        return { success: true, deletedCount };
    },
});
