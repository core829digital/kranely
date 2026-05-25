
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
        let message = `Benvenuto in IWHome, ${args.name}!`;
        if (args.role === 'admin' || args.role === 'superadmin') {
            message += " Hai accesso completo al pannello di amministrazione.";
        } else if (args.role === 'client') {
            message += " Puoi ora accedere ai tuoi preventivi, cantieri e documenti.";
        }

        await ctx.scheduler.runAfter(0, internal.notifications.send, {
            user_email: args.email,
            title: "Benvenuto in IWHome! 🏠",
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
        let message = "Il tuo account è stato aggiornato.";
        let title = "Aggiornamento Account";

        if (changes.role === 'client') {
            title = "Sei ora un Cliente! 🎉";
            message = "Il tuo account è stato promosso a Cliente. Ora hai accesso alla chat diretta con il team e puoi visualizzare i tuoi progetti.";
        } else if (changes.fullName) {
            title = "Nome Profilo Aggiornato ✏️";
            message = `Il tuo nome visualizzato è stato cambiato in: ${changes.fullName}`;
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
                title: `Nuovo messaggio da ${args.sender_name}`,
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
        let title = "Promemoria Appuntamento 📅";
        let message = `Hai un appuntamento il ${args.date} alle ${args.time}.`;

        if (args.status === 'confirmed') {
            title = "Appuntamento Confermato ✅";
            message = `Il tuo appuntamento del ${args.date} è stato confermato.`;
        } else if (args.status === 'pending') {
            title = "Richiesta Appuntamento Ricevuta ⏳";
            message = `Abbiamo ricevuto la tua richiesta per il ${args.date}. Ti invieremo una conferma a breve.`;
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
                title: "Nuovo Appuntamento",
                message: `Nuova richiesta da ${args.user_email} per il ${args.date}`,
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
                title: "Nuovo Articolo sul Blog! 📰",
                message: `Leggi "${args.title}" di ${args.author}`,
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

// Trigger: Fase di Produzione Aggiornata (fornitore → admin)
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
            "Materiali Ricevuti",
            "Taglio",
            "Assemblaggio",
            "Controllo Qualità",
            "Pronto per la Consegna ✅",
        ];
        const phaseLabel = phaseLabels[args.phase_index] ?? `Fase ${args.phase_index}`;
        const orderRef = `Ordine #${args.order_number || args.order_id.slice(-6)}`;
        const isReady = args.phase_index === 4;

        const title = isReady
            ? `🎉 ${orderRef} — Produzione Completata!`
            : `🔧 ${orderRef} — Produzione: ${phaseLabel}`;
        const message = isReady
            ? `${args.supplier_name} ha completato la produzione. L'ordine è pronto per la consegna.`
            : `${args.supplier_name} ha aggiornato la fase di produzione: ${phaseLabel}`;
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
                link: "/Fornitori",
                created_date: new Date().toISOString(),
                sender_email: args.supplier_email,
            });
        }
    },
});

// Trigger: Stato Consegna Aggiornato (fornitore → admin)
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
        const orderRef = `Ordine #${args.order_number || args.order_id.slice(-6)}`;
        let title: string;
        let message: string;
        let priority = "high";

        if (args.new_status === "in_transito") {
            title = `🚚 ${orderRef} — Consegna In Transito`;
            message = `${args.supplier_name}: la consegna è partita ed è in transito${args.driver_name ? ` (Autista: ${args.driver_name})` : ""}${args.estimated_arrival ? `. Arrivo stimato: ${args.estimated_arrival}` : ""}.`;
        } else if (args.new_status === "consegnato") {
            title = `📦 ${orderRef} — Consegna Arrivata!`;
            message = `${args.supplier_name} ha confermato la consegna. Verificare e aggiornare il pagamento.`;
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
                link: "/Fornitori",
                created_date: new Date().toISOString(),
                sender_email: args.supplier_email,
            });
        }
    },
});

// Trigger: Anticipo Consegna (cron giornaliero → admin)
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
            "1w": "tra 1 settimana",
            "48h": "tra 48 ore",
            "24h": "domani",
        };
        const label = labelMap[args.advance_type] ?? args.advance_type;
        const orderRef = args.order_number ? `Ordine #${args.order_number}` : "un ordine";

        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.db.insert("notifications", {
                user_email: admin.email,
                title: `📅 Consegna in Arrivo — ${label.toUpperCase()}`,
                message: `${args.supplier_name} consegnerà ${orderRef} il ${args.delivery_date} (${label}).`,
                type: "delivery_advance",
                priority: args.advance_type === "24h" ? "urgent" : "high",
                read: false,
                link: "/Fornitori",
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

// Trigger: Nuovo Messaggio Interno dal Fornitore (supplier → admin)
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
                title: `💬 Nuovo messaggio da ${args.supplier_name}`,
                message: preview,
                type: "message",
                priority: "high",
                read: false,
                link: "/Fornitori",
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
        if (!identity) throw new Error("Non autenticato");
        const notification = await ctx.db.get(args.id);
        if (!notification || notification.user_email !== identity.email) {
            throw new Error("Notifica non trovata o accesso negato");
        }
        await ctx.db.patch(args.id, { read: true });
    },
});

export const deleteNotification = mutation({
    args: { id: v.id("notifications") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Non autenticato");
        const notification = await ctx.db.get(args.id);
        if (!notification || notification.user_email !== identity.email) {
            throw new Error("Notifica non trovata o accesso negato");
        }
        await ctx.db.delete(args.id);
    },
});
