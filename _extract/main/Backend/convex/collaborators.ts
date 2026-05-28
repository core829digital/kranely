import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, requireAnyAuth, getCallerInfo } from "./rbac";

// ═══════════════════════════════════════════
// COLLABORATOR REGISTRY
// ═══════════════════════════════════════════

export const list = query({
    args: { type: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        // Collaborators see only their own profile
        if (caller.role === "collaborator") {
            return await ctx.db.query("collaborators").withIndex("by_email", (q: any) => q.eq("email", caller.email)).collect();
        }
        // Admin sees all (optionally filtered by type)
        if (caller.role === "admin") {
            if (args.type) {
                return await ctx.db.query("collaborators").withIndex("by_type", (q: any) => q.eq("type", args.type)).collect();
            }
            return await ctx.db.query("collaborators").collect();
        }
        return [];
    },
});

export const getById = query({
    args: { id: v.id("collaborators") },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;
        const collab = await ctx.db.get(args.id);
        if (!collab) return null;
        // Admin sees any; collaborator sees only their own profile
        if (caller.role !== "admin"  && collab.email !== caller.email) return null;
        return collab;
    },
});

export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;
        // Admin sees any; collaborator only their own
        if (caller.role !== "admin"  && caller.email !== args.email) return null;
        return await ctx.db
            .query("collaborators")
            .withIndex("by_email", (q: any) => q.eq("email", args.email))
            .first();
    },
});

export const getDetailed = query({
    args: { id: v.id("collaborators") },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;
        const collab = await ctx.db.get(args.id);
        if (!collab) return null;
        // Admin sees any; collaborator only their own record
        if (caller.role !== "admin"  && collab.email !== caller.email) return null;

        const cantieri = [];
        if (collab.assigned_cantieri) {
            for (const cantiereId of collab.assigned_cantieri) {
                const cantiere = await ctx.db.get(cantiereId);
                if (cantiere) cantieri.push(cantiere);
            }
        }

        return {
            ...collab,
            cantieri,
        };
    },
});

export const create = mutation({
    args: {
        full_name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        type: v.string(),
        job_title: v.string(),
        fiscal_code: v.optional(v.string()),
        contract_type: v.optional(v.string()),
        hourly_rate: v.optional(v.number()),
        salary: v.optional(v.number()),
        payment_frequency: v.optional(v.string()),
        location_type: v.optional(v.string()),
        notes: v.optional(v.string()),
        iban: v.optional(v.string()),
        iban_name: v.optional(v.string()),
        assigned_cantieri: v.optional(v.array(v.id("cantieri"))),
        contract_start_date: v.optional(v.string()),
        contract_end_date: v.optional(v.string()),
        documents: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const id = await ctx.db.insert("collaborators", {
            ...args,
            status: "active",
            created_by: caller.email,
            created_date: new Date().toISOString(),
        });
        // Log activity
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "created",
            entity_type: "collaborator",
            entity_id: id,
            entity_name: args.full_name,
            details: `Collaboratore "${args.full_name}" (${args.type === "internal" ? "Interno" : "Esterno"}) creato`,
            created_date: new Date().toISOString(),
        });
        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id("collaborators"),
        data: v.object({
            full_name: v.optional(v.string()),
            email: v.optional(v.string()),
            phone: v.optional(v.string()),
            type: v.optional(v.string()),
            job_title: v.optional(v.string()),
            status: v.optional(v.string()),
            live_status: v.optional(v.string()),
            live_location: v.optional(v.string()),
            assigned_cantieri: v.optional(v.array(v.id("cantieri"))),
            fiscal_code: v.optional(v.string()),
            contract_type: v.optional(v.string()),
            hourly_rate: v.optional(v.number()),
            salary: v.optional(v.number()),
            payment_frequency: v.optional(v.string()),
            location_type: v.optional(v.string()),
            notes: v.optional(v.string()),
            iban: v.optional(v.string()),
            iban_name: v.optional(v.string()),
            contract_start_date: v.optional(v.string()),
            contract_end_date: v.optional(v.string()),
            documents: v.optional(v.array(v.string())),
        }),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        // Collaborators can only update their own live status
        if (caller.role === "collaborator") {
            const collab = await ctx.db.get(args.id);
            if (!collab || collab.email !== caller.email) {
                throw new Error("Non puoi modificare il profilo di un altro collaboratore.");
            }
            // Only allow updating live_status and live_location
            const allowed: Record<string, any> = {};
            if (args.data.live_status !== undefined) allowed.live_status = args.data.live_status;
            if (args.data.live_location !== undefined) allowed.live_location = args.data.live_location;
            await ctx.db.patch(args.id, allowed);
            return;
        }
        await requireRole(ctx, ["admin"]);
        await ctx.db.patch(args.id, args.data);
    },
});

export const remove = mutation({
    args: { id: v.id("collaborators") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.delete(args.id);
    },
});

// ═══════════════════════════════════════════
// HOURS TRACKING (Ore Lavorate)
// ═══════════════════════════════════════════

export const listHours = query({
    args: {
        collaborator_id: v.optional(v.id("collaborators")),
        cantiere_id: v.optional(v.id("cantieri")),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        if (args.collaborator_id) {
            return await ctx.db.query("collaborator_hours").withIndex("by_collaborator", (q: any) => q.eq("collaborator_id", args.collaborator_id)).collect();
        }
        if (args.cantiere_id) {
            return await ctx.db.query("collaborator_hours").withIndex("by_cantiere", (q: any) => q.eq("cantiere_id", args.cantiere_id)).collect();
        }
        // Admin sees all
        if (caller.role === "admin") {
            return await ctx.db.query("collaborator_hours").collect();
        }
        return [];
    },
});

export const logHours = mutation({
    args: {
        collaborator_id: v.id("collaborators"),
        cantiere_id: v.optional(v.id("cantieri")),
        date: v.string(),
        hours_worked: v.number(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);

        // Collaborators can only log hours for themselves; admins can log for anyone
        if (caller.role !== "admin" ) {
            const collab = await ctx.db.get(args.collaborator_id);
            if (!collab || collab.email !== caller.email) {
                throw new Error("Non puoi registrare ore per un altro collaboratore.");
            }
        }

        const id = await ctx.db.insert("collaborator_hours", {
            ...args,
            created_date: new Date().toISOString(),
        });

        // AUTO-TRIGGER: Notify Admins/CEO
        const collab = await ctx.db.get(args.collaborator_id);
        const admins = await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "admin")).collect();
        
        const recipients = [...admins];
        for (const recipient of recipients) {
            await ctx.db.insert("notifications", {
                user_email: recipient.email,
                type: "log_submitted",
                title: "Nuovo Log Giornaliero",
                message: `${collab?.full_name || caller.email} ha inserito ${args.hours_worked}h per il ${args.date}.`,
                link: "/Collaboratori",
                read: false,
                created_date: new Date().toISOString(),
                sender_email: caller.email,
            });
        }

        return id;
    },
});

export const approveHours = mutation({
    args: { id: v.id("collaborator_hours") },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const hoursEntry = await ctx.db.get(args.id);
        if (!hoursEntry) throw new Error("Ore non trovate");

        await ctx.db.patch(args.id, {
            approved: true,
            approved_by: caller.email,
        });

        // ═══ AUTO-TRIGGER: Create payment for approved hours ═══
        const collab = await ctx.db.get(hoursEntry.collaborator_id);
        if (collab && collab.hourly_rate && collab.hourly_rate > 0) {
            const amount = hoursEntry.hours_worked * collab.hourly_rate;
            await ctx.db.insert("payments", {
                type: "collaborator",
                reference_id: collab._id,
                reference_name: collab.full_name,
                collaborator_id: collab._id,
                cantiere_id: hoursEntry.cantiere_id,
                description: `Ore lavorate ${hoursEntry.date} — ${collab.full_name} (${hoursEntry.hours_worked}h × €${collab.hourly_rate})`,
                amount,
                payment_type: "fattura",
                status: "in_attesa",
                created_by: caller.email,
                created_date: new Date().toISOString(),
            });

            // Notify collaborator
            await ctx.db.insert("notifications", {
                user_email: collab.email,
                type: "hours_approved",
                title: "Ore Approvate",
                message: `${hoursEntry.hours_worked}h del ${hoursEntry.date} approvate. Pagamento di €${amount.toFixed(2)} creato.`,
                link: "/Pagamenti",
                read: false,
                created_date: new Date().toISOString(),
                sender_email: caller.email,
            });
            // Activity log
            await ctx.db.insert("activity_log", {
                user_email: caller.email,
                action: "hours_approved",
                entity_type: "collaborator_hours",
                entity_id: args.id,
                entity_name: collab.full_name,
                details: `${hoursEntry.hours_worked}h approvate per ${collab.full_name}. Pagamento di €${amount.toFixed(2)} auto-creato.`,
                created_date: new Date().toISOString(),
            });
        }
    },
});

export const removeHours = mutation({
    args: { id: v.id("collaborator_hours") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.delete(args.id);
    },
});

export const listLogsForAdmin = query({
    args: { collaborator_id: v.id("collaborators") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        return await ctx.db
            .query("collaborator_hours")
            .withIndex("by_collaborator", (q: any) => q.eq("collaborator_id", args.collaborator_id))
            .order("desc")
            .collect();
    },
});

// ═══════════════════════════════════════════
// STATS for Dashboard
// ═══════════════════════════════════════════

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const caller = await getCallerInfo(ctx);
        if (!caller || caller.role !== "admin") return null;
        const all = await ctx.db.query("collaborators").collect();
        const internal = all.filter(c => c.type === "internal");
        const external = all.filter(c => c.type === "external");
        const active = all.filter(c => c.status === "active");
        const inCantiere = all.filter(c => c.live_status === "in_cantiere");
        return {
            total: all.length,
            internal: internal.length,
            external: external.length,
            active: active.length,
            inCantiere: inCantiere.length,
        };
    },
});
// QR access system removed for simplification as per user request.

export const generateOnboardingLink = mutation({
    args: { id: v.id("collaborators") },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const collab = await ctx.db.get(args.id);
        if (!collab) throw new Error("Collaboratore non trovato");

        const token = `join-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours
        const tempPassword = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit password

        await ctx.db.patch(args.id, {
            onboarding_token: token,
            onboarding_expires: expires,
            temporary_password: tempPassword,
        });

        const baseUrl = "https://iwhome.it"; // Direct domain since user wants it simple
        const link = `${baseUrl}/onboarding-staff?token=${token}`;
        const message = `Ciao ${collab.full_name}, benvenuto in IWHome! Per attivare il tuo profilo clicca qui: ${link}\n\nLa tua password temporanea è: *${tempPassword}*`;
        
        return {
            link,
            whatsapp_url: `https://wa.me/${collab.phone?.replace(/\+/g, '').replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`
        };
    },
});

export const redeemOnboardingLink = mutation({
    args: { token: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Devi essere loggato per attivare il profilo.");

        const user = await ctx.db.query("users").withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
        if (!user) throw new Error("Utente non trovato nel sistema.");

        const collab = await ctx.db.query("collaborators")
            .withIndex("by_onboarding", q => q.eq("onboarding_token", args.token))
            .first();
        
        if (!collab) throw new Error("Link di onboarding non valido.");
        if (collab.temporary_password !== args.password) {
            throw new Error("Password temporanea errata.");
        }

        if (collab.onboarding_expires && new Date(collab.onboarding_expires) < new Date()) {
            throw new Error("Il link di onboarding è scaduto.");
        }

        // Link user to collaborator
        await ctx.db.patch(collab._id, {
            user_id: user._id,
            onboarding_token: undefined, // Clear after use
            onboarding_expires: undefined,
            temporary_password: undefined,
        });

        // Update user role
        const newRole = 'collaborator';
        await ctx.db.patch(user._id, { role: newRole });

        return { success: true, role: newRole };
    },
});
