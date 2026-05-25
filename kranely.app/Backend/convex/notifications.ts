
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ... existing code ...

// Internal mutation to send a notification (triggered by other actions)
export const send = internalMutation({
    args: {
        user_email: v.string(),
        title: v.string(),
        message: v.string(),
        type: v.string(),
        priority: v.optional(v.string()),
        link: v.optional(v.string()),
        sender_email: v.optional(v.string()),
        metadata: v.optional(v.any()), // flexible for extra data
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("notifications", {
            user_email: args.user_email,
            title: args.title,
            message: args.message,
            type: args.type,
            priority: args.priority || "low",
            read: false,
            link: args.link,
            created_date: new Date().toISOString(),
            sender_email: args.sender_email,
        });
    },
});

// Trigger: Welcome Notification
export const triggerWelcome = internalMutation({
    args: { email: v.string(), name: v.string(), role: v.string() },
    handler: async (ctx, args) => {
        let message = `Welcome to Kranely, ${args.name}!`;
        if (args.role === 'admin' || args.role === 'superadmin') {
            message += " You have full access to the admin dashboard.";
        } else if (args.role === 'client') {
            message += " You can now access your quotes, projects, and documents.";
        }

        await ctx.scheduler.runAfter(0, internal.notifications.send, {
            user_email: args.email,
            title: "Welcome to Kranely! 🏠",
            message: message,
            type: "welcome",
            priority: "high",
            link: "/Dashboard"
        });
    }
});

// Trigger: Account Update Notification
export const triggerAccountUpdate = internalMutation({
    args: { email: v.string(), changes: v.any() },
    handler: async (ctx, args) => {
        const changes = args.changes;
        let message = "Your account has been updated.";
        let title = "Account Update";

        if (changes.role === 'client') {
            title = "You're now a Client! 🎉";
            message = "Your account has been upgraded to Client. You now have access to direct chat with the team and can view your projects.";
        } else if (changes.fullName) {
            title = "Profile Name Updated ✏️";
            message = `Your display name has been changed to: ${changes.fullName}`;
        }

        await ctx.scheduler.runAfter(0, internal.notifications.send, {
            user_email: args.email,
            title: title,
            message: message,
            type: "account_update",
            priority: "medium",
            link: "/Settings"
        });
    }
});

// Trigger: Message Notification
export const triggerMessage = internalMutation({
    args: {
        channel_id: v.string(),
        sender_email: v.string(),
        sender_name: v.string(),
        content: v.string(),
        is_admin_chat: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        // If admin chat, notify the other party
        if (args.is_admin_chat) {
            const conversation = await ctx.db.get(args.channel_id as any);
            if (!conversation) return;

            const isClientSender = args.sender_email === (conversation as any).client_email;
            const targetEmail = isClientSender ? (conversation as any).admin_email : (conversation as any).client_email;

            await ctx.scheduler.runAfter(0, internal.notifications.send, {
                user_email: targetEmail,
                title: `New message from ${args.sender_name}`,
                message: args.content.length > 50 ? args.content.substring(0, 50) + "..." : args.content,
                type: "message",
                priority: "high",
                link: "/Messages",
                sender_email: args.sender_email
            });
        }
    }
});

// Trigger: Appointment Notification
export const triggerAppointment = internalMutation({
    args: {
        appointment_id: v.string(),
        user_email: v.string(),
        date: v.string(),
        time: v.string(),
        status: v.string()
    },
    handler: async (ctx, args) => {
        let title = "Appointment Reminder 📅";
        let message = `You have an appointment on ${args.date} at ${args.time}.`;

        if (args.status === 'confirmed') {
            title = "Appointment Confirmed ✅";
            message = `Your appointment on ${args.date} has been confirmed.`;
        } else if (args.status === 'pending') {
            title = "Appointment Request Received ⏳";
            message = `We received your request for ${args.date}. We'll send you a confirmation shortly.`;
        }

        await ctx.scheduler.runAfter(0, internal.notifications.send, {
            user_email: args.user_email,
            title: title,
            message: message,
            type: "appointment",
            priority: "high",
            link: "/MyAppointments",
            metadata: { appointment_id: args.appointment_id }
        });

        // Notify Admins
        const admins = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "admin")).collect();
        for (const admin of admins) {
            await ctx.scheduler.runAfter(0, internal.notifications.send, {
                user_email: admin.email,
                title: "New Appointment",
                message: `New request from ${args.user_email} for ${args.date}`,
                type: "appointment",
                priority: "medium",
                link: "/MyAppointments"
            });
        }
    }
});

// Trigger: Blog Post Notification
export const triggerBlogPost = internalMutation({
    args: {
        title: v.string(),
        slug: v.string(),
        excerpt: v.string(),
        author: v.string()
    },
    handler: async (ctx, args) => {
        // Find all users interested in blogs (or all users for now)
        // Optimization: In a real app, maybe iterate in batches or use a subscription model
        // For now, let's limit to recent/active users to avoid exploding
        const users = await ctx.db.query("users").collect();

        for (const user of users) {
            await ctx.scheduler.runAfter(0, internal.notifications.send, {
                user_email: user.email,
                title: "New Blog Post! 📰",
                message: `Read "${args.title}" by ${args.author}`,
                type: "blog",
                priority: "low",
                link: `/BlogPost?slug=${args.slug}`,
            });
        }
    }
});
// ─── Helper interno: notifica tutti gli admin ──────────────────────────────
export const notifyAllAdmins = internalMutation({
    args: {
        title: v.string(),
        message: v.string(),
        type: v.string(),
        priority: v.optional(v.string()),
        link: v.optional(v.string()),
        sender_email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.db.insert("notifications", {
                user_email: admin.email,
                title: args.title,
                message: args.message,
                type: args.type,
                priority: args.priority || "high",
                read: false,
                link: args.link,
                created_date: new Date().toISOString(),
                sender_email: args.sender_email,
            });
        }
    },
});

// Trigger: Production Phase Update (supplier → admin)
export const triggerProductionPhaseUpdate = internalMutation({
    args: {
        order_id: v.string(),
        order_number: v.optional(v.string()),
        supplier_name: v.string(),
        supplier_email: v.string(),
        phase_index: v.number(),
    },
    handler: async (ctx, args) => {
        const phaseLabels = [
            "Materials Received",
            "Cutting",
            "Assembly",
            "Quality Control",
            "Ready for Delivery ✅",
        ];
        const phaseLabel = phaseLabels[args.phase_index] ?? `Phase ${args.phase_index}`;
        const orderRef = `Order #${args.order_number || args.order_id.slice(-6)}`;
        const isReady = args.phase_index === 4;

        const title = isReady
            ? `🎉 ${orderRef} — Production Completed!`
            : `🔧 ${orderRef} — Production: ${phaseLabel}`;
        const message = isReady
            ? `${args.supplier_name} has completed production. The order is ready for delivery.`
            : `${args.supplier_name} updated the production phase: ${phaseLabel}`;
        const priority = isReady ? "urgent" : "high";

        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.db.insert("notifications", {
                user_email: admin.email,
                title,
                message,
                type: "production_update",
                priority,
                read: false,
                link: "/Suppliers",
                created_date: new Date().toISOString(),
                sender_email: args.supplier_email,
            });
        }
    },
});

// Trigger: Delivery Status Updated (supplier → admin)
export const triggerDeliveryStatusUpdate = internalMutation({
    args: {
        delivery_id: v.string(),
        order_id: v.string(),
        order_number: v.optional(v.string()),
        supplier_name: v.string(),
        supplier_email: v.string(),
        new_status: v.string(), // in_transito | consegnato
        driver_name: v.optional(v.string()),
        estimated_arrival: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const orderRef = `Order #${args.order_number || args.order_id.slice(-6)}`;
        let title: string;
        let message: string;
        let priority = "high";

        if (args.new_status === "in_transito") {
            title = `🚚 ${orderRef} — Delivery In Transit`;
            message = `${args.supplier_name}: the delivery has started and is in transit${args.driver_name ? ` (Driver: ${args.driver_name})` : ""}${args.estimated_arrival ? `. Estimated arrival: ${args.estimated_arrival}` : ""}.`;
        } else if (args.new_status === "consegnato") {
            title = `📦 ${orderRef} — Delivery Arrived!`;
            message = `${args.supplier_name} has confirmed delivery. Please verify and update payment.`;
            priority = "urgent";
        } else {
            return;
        }

        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.db.insert("notifications", {
                user_email: admin.email,
                title,
                message,
                type: "delivery_update",
                priority,
                read: false,
                link: "/Suppliers",
                created_date: new Date().toISOString(),
                sender_email: args.supplier_email,
            });
        }
    },
});

// Trigger: Delivery Advance (daily cron → admin)
export const triggerDeliveryAdvanceNotification = internalMutation({
    args: {
        delivery_id: v.id("supplier_deliveries"),
        order_number: v.optional(v.string()),
        supplier_name: v.string(),
        delivery_date: v.string(),
        advance_type: v.string(), // "1w" | "48h" | "24h"
    },
    handler: async (ctx, args) => {
        const labelMap: Record<string, string> = {
            "1w": "in 1 week",
            "48h": "in 48 hours",
            "24h": "tomorrow",
        };
        const label = labelMap[args.advance_type] ?? args.advance_type;
        const orderRef = args.order_number ? `Order #${args.order_number}` : "an order";

        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.db.insert("notifications", {
                user_email: admin.email,
                title: `📅 Delivery Coming — ${label.toUpperCase()}`,
                message: `${args.supplier_name} will deliver ${orderRef} on ${args.delivery_date} (${label}).`,
                type: "delivery_advance",
                priority: args.advance_type === "24h" ? "urgent" : "high",
                read: false,
                link: "/Suppliers",
                created_date: new Date().toISOString(),
            });
        }

        // Mark the flag on the delivery record
        const flagField =
            args.advance_type === "1w"
                ? "advance_notified_1w"
                : args.advance_type === "48h"
                ? "advance_notified_48h"
                : "advance_notified_24h";
        await ctx.db.patch(args.delivery_id, { [flagField]: true } as any);
    },
});

// Trigger: New Internal Message from Supplier (supplier → admin)
export const triggerInternalMessageFromSupplier = internalMutation({
    args: {
        supplier_name: v.string(),
        supplier_email: v.string(),
        message_preview: v.string(),
        channel_id: v.string(),
    },
    handler: async (ctx, args) => {
        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();
        const preview =
            args.message_preview.length > 60
                ? args.message_preview.substring(0, 60) + "..."
                : args.message_preview;
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.db.insert("notifications", {
                user_email: admin.email,
                title: `💬 New message from ${args.supplier_name}`,
                message: preview,
                type: "message",
                priority: "high",
                read: false,
                link: "/Suppliers",
                created_date: new Date().toISOString(),
                sender_email: args.supplier_email,
            });
        }
    },
});

// List Notifications
export const list = query({
    args: {
        type: v.optional(v.string()),
        priority: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        let q = ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("user_email", identity.email!));

        // Note: Manual filtering for multiple optional fields might be needed if index isn't exact
        // Convex queries are exact chain.
        const notifications = await q.collect();

        return notifications
            .filter(n => !args.type || args.type === 'all' || n.type === args.type)
            .filter(n => !args.priority || args.priority === 'all' || n.priority === args.priority)
            .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    },
});

export const markAsRead = mutation({
    args: { id: v.id("notifications") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const notification = await ctx.db.get(args.id);
        if (!notification || notification.user_email !== identity.email) {
            throw new Error("Notification not found or access denied");
        }
        await ctx.db.patch(args.id, { read: true });
    },
});

export const deleteNotification = mutation({
    args: { id: v.id("notifications") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const notification = await ctx.db.get(args.id);
        if (!notification || notification.user_email !== identity.email) {
            throw new Error("Notification not found or access denied");
        }
        await ctx.db.delete(args.id);
    },
});
