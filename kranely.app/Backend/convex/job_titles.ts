import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, getCallerInfo } from "./rbac";

/**
 * List all job titles.
 */
export const list = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];

        if (args.category) {
            return await ctx.db
                .query("job_titles")
                .withIndex("by_category", (q: any) => q.eq("category", args.category))
                .collect();
        }
        return await ctx.db.query("job_titles").collect();
    },
});

/**
 * Create a new job title (Admin/CEO only).
 */
export const create = mutation({
    args: {
        title: v.string(),
        category: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);

        // Check if title already exists
        const existing = await ctx.db
            .query("job_titles")
            .withIndex("by_title", (q: any) => q.eq("title", args.title))
            .first();

        if (existing) throw new Error("Questa mansione esiste già.");

        return await ctx.db.insert("job_titles", {
            ...args,
            created_by: caller.email,
            created_date: new Date().toISOString(),
        });
    },
});

/**
 * Seed default job titles for construction and office sectors (Admin/CEO only).
 * Safe to call multiple times — skips titles that already exist.
 */
export const seedDefaults = mutation({
    args: {},
    handler: async (ctx, args) => {
        const caller = requireRole(ctx, ["admin"]);

        const defaults = [
            // Construction / Cantiere
            { title: "Muratore", category: "construction" },
            { title: "Carpentiere", category: "construction" },
            { title: "Elettricista", category: "construction" },
            { title: "Idraulico", category: "construction" },
            { title: "Gruista", category: "construction" },
            { title: "Caposquadra", category: "construction" },
            { title: "Geometra", category: "construction" },
            { title: "Manovale", category: "construction" },
            { title: "Ferraiolo", category: "construction" },
            { title: "Operatore Macchine", category: "construction" },
            { title: "Saldatore", category: "construction" },
            { title: "Installatore", category: "construction" },
            // Office / Showroom
            { title: "Segreteria", category: "office" },
            { title: "Assistenza Clienti", category: "office" },
            { title: "Commercialista", category: "office" },
            { title: "Supervisore", category: "office" },
            { title: "Tecnico", category: "office" },
        ];

        const now = new Date().toISOString();

        for (const item of defaults) {
            const existing = await ctx.db
                .query("job_titles")
                .withIndex("by_title", (q: any) => q.eq("title", item.title))
                .first();
            if (!existing) {
                await ctx.db.insert("job_titles", {
                    title: item.title,
                    category: item.category,
                    created_by: (await caller).email,
                    created_date: now,
                });
            }
        }
        return { seeded: defaults.length };
    },
});

/**
 * Remove a job title (Admin/CEO only).
 */
export const remove = mutation({
    args: { id: v.id("job_titles") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.delete(args.id);
    },
});
