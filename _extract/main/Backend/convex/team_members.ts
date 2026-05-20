import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Role hierarchy - higher number = more permissions
const ROLE_HIERARCHY = {
    superadmin: 100,
    admin: 80,
    supervisor: 50,
    worker: 10,
};

// Permission definitions per role
const ROLE_PERMISSIONS = {
    superadmin: {
        canManageCantieri: true,
        canManageTeam: true,
        canAssignTasks: true,
        canViewAllTasks: true,
        canEditAllTasks: true,
        canViewReports: true,
        canManageClients: true,
        canViewFinancials: true,
        canApproveInvites: true,
        canRemoveMembers: true,
        canChangeRoles: true,
    },
    admin: {
        canManageCantieri: true,
        canManageTeam: true,
        canAssignTasks: true,
        canViewAllTasks: true,
        canEditAllTasks: true,
        canViewReports: true,
        canManageClients: true,
        canViewFinancials: false,
        canApproveInvites: true,
        canRemoveMembers: true,
        canChangeRoles: false,
    },
    supervisor: {
        canManageCantieri: false,
        canManageTeam: false,
        canAssignTasks: true,
        canViewAllTasks: true,
        canEditAllTasks: false,
        canViewReports: true,
        canManageClients: false,
        canViewFinancials: false,
        canApproveInvites: false,
        canRemoveMembers: false,
        canChangeRoles: false,
    },
    worker: {
        canManageCantieri: false,
        canManageTeam: false,
        canAssignTasks: false,
        canViewAllTasks: false,
        canEditAllTasks: false,
        canViewReports: false,
        canManageClients: false,
        canViewFinancials: false,
        canApproveInvites: false,
        canRemoveMembers: false,
        canChangeRoles: false,
    },
};

// Get permissions for a role
export const getPermissions = query({
    args: { role: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return ROLE_PERMISSIONS[args.role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.worker;
    },
});

// Check if user has a specific permission on a cantiere
export const checkPermission = query({
    args: {
        cantiere_id: v.id("cantieri"),
        permission: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return false;

        const userEmail = identity.email || "";

        // Check if user is a team member of this cantiere
        const member = await ctx.db
            .query("cantiere_team_members")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
            .filter((q) => q.eq(q.field("email"), userEmail))
            .first();

        if (!member || member.status !== "accepted") return false;

        const permissions = ROLE_PERMISSIONS[member.role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.worker;
        return permissions[args.permission as keyof typeof permissions] || false;
    },
});

// Get current user's role on a cantiere
export const getUserRole = query({
    args: { cantiere_id: v.id("cantieri") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const userEmail = identity.email || "";

        const member = await ctx.db
            .query("cantiere_team_members")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
            .filter((q) => q.eq(q.field("email"), userEmail))
            .first();

        if (!member) return null;

        return {
            role: member.role,
            status: member.status,
            permissions: ROLE_PERMISSIONS[member.role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.worker,
        };
    },
});

// Get all team members with their activity stats
export const getTeamWithActivity = query({
    args: { cantiere_id: v.id("cantieri") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const members = await ctx.db
            .query("cantiere_team_members")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
            .collect();

        // For each member, get their activity stats
        const membersWithActivity = await Promise.all(
            members.map(async (member) => {
                // Count completed tasks assigned to this member
                const tasksCompleted = await ctx.db
                    .query("phase_tasks")
                    .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("assigned_to"), member.email),
                            q.eq(q.field("status"), "completato")
                        )
                    )
                    .collect();

                // Count pending tasks
                const tasksPending = await ctx.db
                    .query("phase_tasks")
                    .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("assigned_to"), member.email),
                            q.neq(q.field("status"), "completato")
                        )
                    )
                    .collect();

                // Get recent activity logs
                const recentActivity = await ctx.db
                    .query("activity_log")
                    .withIndex("by_user", (q) => q.eq("user_email", member.email))
                    .order("desc")
                    .take(5);

                return {
                    ...member,
                    stats: {
                        tasksCompleted: tasksCompleted.length,
                        tasksPending: tasksPending.length,
                        totalTasks: tasksCompleted.length + tasksPending.length,
                        completionRate: tasksCompleted.length + tasksPending.length > 0
                            ? Math.round((tasksCompleted.length / (tasksCompleted.length + tasksPending.length)) * 100)
                            : 0,
                    },
                    recentActivity: recentActivity.map(a => ({
                        action: a.action,
                        entity_name: a.entity_name,
                        date: a.created_date,
                    })),
                    permissions: ROLE_PERMISSIONS[member.role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.worker,
                };
            })
        );

        return membersWithActivity;
    },
});

// Log team member activity
export const logActivity = mutation({
    args: {
        action: v.string(), // created, updated, completed, assigned, etc.
        entity_type: v.string(), // task, cantiere, document, etc.
        entity_id: v.string(),
        entity_name: v.optional(v.string()),
        details: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        return await ctx.db.insert("activity_log", {
            user_email: identity.email || "",
            user_name: identity.name || identity.email?.split("@")[0],
            action: args.action,
            entity_type: args.entity_type,
            entity_id: args.entity_id,
            entity_name: args.entity_name,
            details: args.details,
            created_date: new Date().toISOString(),
        });
    },
});

// Get activity for a specific cantiere
export const getCantiereActivity = query({
    args: { cantiere_id: v.id("cantieri") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Get team members of this cantiere
        const members = await ctx.db
            .query("cantiere_team_members")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
            .collect();

        const memberEmails = members.map(m => m.email);

        // Get activity from all team members related to this cantiere
        const activity = await ctx.db
            .query("activity_log")
            .withIndex("by_entity", (q) => q.eq("entity_type", "cantiere").eq("entity_id", args.cantiere_id.toString()))
            .order("desc")
            .take(50);

        // Also get task-related activity
        const taskActivity = await ctx.db
            .query("activity_log")
            .withIndex("by_entity", (q) => q.eq("entity_type", "task"))
            .order("desc")
            .take(100);

        // Filter task activity to only include tasks from this cantiere's team
        const relevantTaskActivity = taskActivity.filter(a =>
            memberEmails.includes(a.user_email)
        ).slice(0, 50);

        return [...activity, ...relevantTaskActivity].sort((a, b) =>
            new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
        ).slice(0, 50);
    },
});

// Get user's activity history
export const getUserActivity = query({
    args: { email: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("activity_log")
            .withIndex("by_user", (q) => q.eq("user_email", args.email))
            .order("desc")
            .take(args.limit || 20);
    },
});

// Get role options for assignment
export const getRoleOptions = query({
    args: {},
    handler: async () => {
        return [
            { id: "superadmin", label: "SuperAdmin", description: "Accesso completo a tutte le funzionalità", level: 100 },
            { id: "admin", label: "Admin", description: "Gestione cantieri, team e clienti", level: 80 },
            { id: "supervisor", label: "Supervisore", description: "Assegnazione task e visualizzazione report", level: 50 },
            { id: "worker", label: "Operaio", description: "Visualizzazione e completamento task assegnati", level: 10 },
        ];
    },
});

// Check if user can perform action on another user (role hierarchy)
export const canManageUser = query({
    args: {
        cantiere_id: v.id("cantieri"),
        target_email: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return false;

        const userEmail = identity.email || "";

        // Get current user's role
        const currentMember = await ctx.db
            .query("cantiere_team_members")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
            .filter((q) => q.eq(q.field("email"), userEmail))
            .first();

        if (!currentMember || currentMember.status !== "accepted") return false;

        // Get target user's role
        const targetMember = await ctx.db
            .query("cantiere_team_members")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
            .filter((q) => q.eq(q.field("email"), args.target_email))
            .first();

        if (!targetMember) return false;

        // Check hierarchy
        const currentLevel = ROLE_HIERARCHY[currentMember.role as keyof typeof ROLE_HIERARCHY] || 0;
        const targetLevel = ROLE_HIERARCHY[targetMember.role as keyof typeof ROLE_HIERARCHY] || 0;

        return currentLevel > targetLevel;
    },
});
