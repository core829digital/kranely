import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, requireAnyAuth, getCallerInfo } from "./rbac";

// ═══════════════════════════════════════════
// CERTIFICATES (Certificati)
// ═══════════════════════════════════════════

export const list = query({
    args: {
        category: v.optional(v.string()),
        cantiere_id: v.optional(v.id("cantieri")),
        collaborator_id: v.optional(v.id("collaborators")),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        // Admin/CEO see all
        if (caller.role === "admin") {
            if (args.category) {
                return await ctx.db.query("certificates").withIndex("by_category", (q: any) => q.eq("category", args.category)).collect();
            }
            if (args.cantiere_id) {
                return await ctx.db.query("certificates").withIndex("by_cantiere", (q: any) => q.eq("cantiere_id", args.cantiere_id)).collect();
            }
            return await ctx.db.query("certificates").collect();
        }
        // Collaborators see certificates linked to them
        if (caller.role === "collaborator") {
            const collab = await ctx.db.query("collaborators").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
            if (collab) {
                return await ctx.db.query("certificates").withIndex("by_collaborator", (q: any) => q.eq("collaborator_id", collab._id)).collect();
            }
        }
        return [];
    },
});

export const getById = query({
    args: { id: v.id("certificates") },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;
        return await ctx.db.get(args.id);
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        category: v.string(),
        subcategory: v.optional(v.string()),
        description: v.optional(v.string()),
        file_url: v.string(),
        file_name: v.string(),
        file_type: v.optional(v.string()),
        file_size: v.optional(v.number()),
        issue_date: v.optional(v.string()),
        expiry_date: v.optional(v.string()),
        cantiere_id: v.optional(v.id("cantieri")),
        collaborator_id: v.optional(v.id("collaborators")),
        supplier_id: v.optional(v.id("suppliers")),
        client_id: v.optional(v.id("clients")),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        // Determine initial status based on expiry
        let status = "valid";
        if (args.expiry_date) {
            const expiry = new Date(args.expiry_date);
            const now = new Date();
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            if (expiry < now) status = "expired";
            else if (expiry.getTime() - now.getTime() < thirtyDays) status = "expiring";
        }
        const id = await ctx.db.insert("certificates", {
            ...args,
            status,
            created_by: caller.email,
            created_date: new Date().toISOString(),
        });
        // Log activity
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "created",
            entity_type: "certificate",
            entity_id: id,
            entity_name: args.title,
            details: `Certificato "${args.title}" (${args.category}) creato`,
            created_date: new Date().toISOString(),
        });
        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id("certificates"),
        data: v.object({
            title: v.optional(v.string()),
            category: v.optional(v.string()),
            subcategory: v.optional(v.string()),
            description: v.optional(v.string()),
            file_url: v.optional(v.string()),
            file_name: v.optional(v.string()),
            issue_date: v.optional(v.string()),
            expiry_date: v.optional(v.string()),
            status: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.patch(args.id, args.data);
    },
});

export const remove = mutation({
    args: { id: v.id("certificates") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.delete(args.id);
    },
});

// ═══════════════════════════════════════════
// CRON: Check expiring certificates
// ═══════════════════════════════════════════

export const checkExpiringCertificates = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = new Date();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const allCerts = await ctx.db.query("certificates").collect();

        for (const cert of allCerts) {
            if (!cert.expiry_date) continue;
            const expiry = new Date(cert.expiry_date);

            // Update status
            let newStatus = "valid";
            if (expiry < now) newStatus = "expired";
            else if (expiry.getTime() - now.getTime() < thirtyDays) newStatus = "expiring";

            if (cert.status !== newStatus) {
                await ctx.db.patch(cert._id, { status: newStatus });
            }

            // Send alert for expiring (not yet alerted)
            if (newStatus === "expiring" && !cert.alert_sent) {
                // Notify all admins
                const admins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
                const superadmins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "superadmin")).collect();
                const recipients = [...admins, ...superadmins];

                for (const admin of recipients) {
                    await ctx.db.insert("notifications", {
                        user_email: admin.email,
                        type: "certificate_expiry",
                        priority: "high",
                        title: "Certificato in Scadenza",
                        message: `Il certificato "${cert.title}" scade il ${new Date(cert.expiry_date).toLocaleDateString("it-IT")}`,
                        link: "/Certificati",
                        read: false,
                        created_date: new Date().toISOString(),
                    });
                }
                await ctx.db.patch(cert._id, { alert_sent: true });
            }
        }
    },
});

// ═══════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const caller = await getCallerInfo(ctx);
        if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) return null;
        const all = await ctx.db.query("certificates").collect();
        return {
            total: all.length,
            valid: all.filter(c => c.status === "valid").length,
            expiring: all.filter(c => c.status === "expiring").length,
            expired: all.filter(c => c.status === "expired").length,
            edilizia: all.filter(c => c.category === "edilizia").length,
            infissi: all.filter(c => c.category === "infissi").length,
            documenti: all.filter(c => c.category === "documenti").length,
        };
    },
});
