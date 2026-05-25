import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, getCallerInfo } from "./rbac";

// Phase Tasks - Tasks per phase with assignment and auto-progress

// List tasks for a cantiere phase
export const listByPhase = query({
    args: {
        cantiere_id: v.id("cantieri"),
        phase: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        if (args.phase) {
            return await ctx.db
                .query("phase_tasks")
                .withIndex("by_phase", (q) =>
                    q.eq("cantiere_id", args.cantiere_id).eq("phase", args.phase!)
                )
                .collect();
        }

        return await ctx.db
            .query("phase_tasks")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
            .collect();
    },
});

// Get tasks assigned to a specific user
export const listByAssignee = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("phase_tasks")
            .withIndex("by_assigned", (q) => q.eq("assigned_to", args.email))
            .collect();
    },
});

// Helper: Calculate and update phase progress
async function updatePhaseProgress(ctx: any, cantiere_id: any, phase: string) {
    const tasks = await ctx.db
        .query("phase_tasks")
        .withIndex("by_phase", (q: any) => q.eq("cantiere_id", cantiere_id).eq("phase", phase))
        .collect();

    if (tasks.length === 0) return 0;

    const completed = tasks.filter((t: any) => t.status === "completato").length;
    const progress = Math.round((completed / tasks.length) * 100);

    // Map phase to field name
    const fieldMap: Record<string, string> = {
        in_lavorazione: "progresso_in_lavorazione",
        posa_in_opera: "progresso_posa_in_opera",
        completato: "progresso_completamento",
    };

    const field = fieldMap[phase];
    if (field) {
        await ctx.db.patch(cantiere_id, { [field]: progress });
    }

    // Also update overall progress
    await updateOverallProgress(ctx, cantiere_id);

    return progress;
}

// Helper: Update overall cantiere progress
async function updateOverallProgress(ctx: any, cantiere_id: any) {
    const cantiere = await ctx.db.get(cantiere_id);
    if (!cantiere) return;

    const inLav = cantiere.progresso_in_lavorazione || 0;
    const posa = cantiere.progresso_posa_in_opera || 0;
    const compl = cantiere.progresso_completamento || 0;

    // Overall = weighted average (In Lavorazione 40%, Posa 40%, Completamento 20%)
    const overall = Math.round((inLav * 0.4) + (posa * 0.4) + (compl * 0.2));

    await ctx.db.patch(cantiere_id, { progresso: overall });
}

// Create task
export const create = mutation({
    args: {
        cantiere_id: v.id("cantieri"),
        phase: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        assigned_to: v.optional(v.string()),
        priority: v.string(),
        due_date: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const identity = { email: caller.email };

        const id = await ctx.db.insert("phase_tasks", {
            ...args,
            status: "da_fare",
            created_by: identity.email || "",
            created_date: new Date().toISOString(),
        });

        await updatePhaseProgress(ctx, args.cantiere_id, args.phase);

        return id;
    },
});

// Update task
export const update = mutation({
    args: {
        id: v.id("phase_tasks"),
        data: v.object({
            title: v.optional(v.string()),
            description: v.optional(v.string()),
            status: v.optional(v.string()),
            assigned_to: v.optional(v.string()),
            priority: v.optional(v.string()),
            due_date: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) throw new Error("Unauthenticated");

        const task = await ctx.db.get(args.id);
        if (!task) throw new Error("Task not found");

        // Admin can update anything; collaborator can only update status of their own assigned task
        if (caller.role !== "admin" && caller.role !== "superadmin") {
            if (task.assigned_to !== caller.email) throw new Error("Non autorizzato");
            // Collaborators may only update status field
            const allowedKeys = Object.keys(args.data).filter((k) => k !== "status");
            if (allowedKeys.length > 0) throw new Error("Non puoi modificare questo campo");
        }

        const updates: any = { ...args.data };

        if (args.data.status === "completato" && task.status !== "completato") {
            updates.completed_date = new Date().toISOString();
        }

        await ctx.db.patch(args.id, updates);

        // Update phase progress if status changed
        if (args.data.status) {
            await updatePhaseProgress(ctx, task.cantiere_id, task.phase);
        }
    },
});

// Delete task
export const remove = mutation({
    args: { id: v.id("phase_tasks") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        const task = await ctx.db.get(args.id);
        if (!task) throw new Error("Task not found");

        const cantiereId = task.cantiere_id;
        const phase = task.phase;

        await ctx.db.delete(args.id);
        await updatePhaseProgress(ctx, cantiereId, phase);
    },
});
