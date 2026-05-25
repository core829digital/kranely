import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper: Recalculate and update cantiere progress
async function updateCantiereProgress(ctx: any, cantiere_id: any) {
    const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_cantiere", (q: any) => q.eq("cantiere_id", cantiere_id))
        .collect();

    if (tasks.length === 0) {
        await ctx.db.patch(cantiere_id, { progresso: 0 });
        return;
    }

    const completedTasks = tasks.filter((t: any) => t.status === "completato").length;
    const progress = Math.round((completedTasks / tasks.length) * 100);

    await ctx.db.patch(cantiere_id, { progresso: progress });
}

export const list = query({
    args: { cantiere_id: v.id("cantieri") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("tasks")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
            .collect();
    },
});

export const create = mutation({
    args: {
        cantiere_id: v.id("cantieri"),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.string(),
        priority: v.string(),
        scadenza: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const id = await ctx.db.insert("tasks", {
            ...args,
            created_by: identity.email,
            created_date: new Date().toISOString(),
        });

        // Update cantiere progress
        await updateCantiereProgress(ctx, args.cantiere_id);

        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id("tasks"),
        data: v.object({
            title: v.optional(v.string()),
            description: v.optional(v.string()),
            status: v.optional(v.string()),
            priority: v.optional(v.string()),
            scadenza: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const { id, data } = args;

        // Get task to find cantiere_id
        const task = await ctx.db.get(id);
        if (!task) throw new Error("Task not found");

        await ctx.db.patch(id, data);

        // Update cantiere progress if status changed
        if (data.status) {
            await updateCantiereProgress(ctx, task.cantiere_id);
        }
    },
});

export const remove = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        if (!task) throw new Error("Task not found");

        const cantiereId = task.cantiere_id;
        await ctx.db.delete(args.id);

        // Update cantiere progress
        await updateCantiereProgress(ctx, cantiereId);
    },
});
