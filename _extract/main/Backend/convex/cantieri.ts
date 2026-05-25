import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdminOrCeo } from "./util/auth";
import { getCallerInfo } from "./rbac";

// List all cantieri for company
export const listCantieri = query({
    args: { company_email: v.string() },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];

        // Only admin/superadmin may query arbitrary company emails
        if (caller.role !== "admin" && caller.role !== "superadmin" && caller.email !== args.company_email) {
            return [];
        }

        return await ctx.db
            .query("cantieri")
            .withIndex("by_company", (q) => q.eq("company_email", args.company_email))
            .collect();
    },
});

// List cantieri for the logged-in client
export const getByClient = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Find the client record associated with this user
        const client = await ctx.db
            .query("clients")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!client) return [];

        return await ctx.db
            .query("cantieri")
            .withIndex("by_client", (q) => q.eq("client_id", client._id))
            .collect();
    },
});

// List cantieri for the logged-in worker/collaborator
export const getByWorker = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const collab = await ctx.db
            .query("collaborators")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!collab || !collab.assigned_cantieri) return [];

        const results = [];
        for (const id of collab.assigned_cantieri) {
            const cantiere = await ctx.db.get(id);
            if (cantiere) results.push(cantiere);
        }
        return results;
    },
});

// Get single cantiere with full details (client, quotes, documents, team)
export const getById = query({
    args: { id: v.id("cantieri") },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;

        const cantiere = await ctx.db.get(args.id);
        if (!cantiere) return null;

        // Non-admin users can only see cantieri they're associated with
        if (caller.role !== "admin" && caller.role !== "superadmin") {
            if (caller.role === "client") {
                const clientRecord = await ctx.db.query("clients").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
                if (!clientRecord || cantiere.client_id !== clientRecord._id) return null;
            } else if (caller.role === "collaborator") {
                const collabRecord = await ctx.db.query("collaborators").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
                if (!collabRecord || !collabRecord.assigned_cantieri?.includes(args.id)) return null;
            } else {
                return null;
            }
        }

        // Get linked client
        let client = null;
        if (cantiere.client_id) {
            client = await ctx.db.get(cantiere.client_id);
        }

        // Get team members
        const team = await ctx.db
            .query("cantiere_team_members")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.id))
            .collect();

        // Get phase tasks
        const tasks = await ctx.db
            .query("phase_tasks")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.id))
            .collect();

        // Get linked quotes
        const quotes = cantiere.preventivi_collegati
            ? await Promise.all(cantiere.preventivi_collegati.map((id) => ctx.db.get(id)))
            : [];

        // Get linked documents
        const documents = await ctx.db
            .query("documents")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.id))
            .collect();

        return {
            ...cantiere,
            client,
            team,
            tasks,
            quotes: quotes.filter(Boolean),
            documents,
        };
    },
});

// Create cantiere (Strict Mode: Requires Quote & Client)
export const createCantiere = mutation({
    args: {
        company_email: v.string(),
        nome_cantiere: v.string(),
        cliente: v.string(),
        client_id: v.id("clients"), // MANDATORY
        quote_id: v.id("quotes"),   // MANDATORY
        indirizzo: v.optional(v.string()),
        status: v.string(),
        valore_contratto: v.optional(v.number()),
        valore_progetto: v.optional(v.number()),
        created_date: v.string(),
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx);
        const identity = await ctx.auth.getUserIdentity();

        // Verify quote
        const quote = await ctx.db.get(args.quote_id);
        if (!quote) throw new Error("Quote not found");
        if (quote.status !== 'accepted') throw new Error("Solo preventivi accettati possono generare cantieri");
        if (quote.cantiere_id) throw new Error("Questo preventivo è già collegato a un cantiere");

        const id = await ctx.db.insert("cantieri", {
            company_email: args.company_email,
            nome_cantiere: args.nome_cantiere,
            cliente: args.cliente,
            client_id: args.client_id,
            indirizzo: args.indirizzo,
            status: args.status,
            valore_contratto: args.valore_contratto,
            valore_progetto: args.valore_progetto,
            created_date: args.created_date,
            progresso: 0,
            progresso_in_lavorazione: 0,
            progresso_posa_in_opera: 0,
            progresso_completamento: 0,
            created_by: identity!.email,
            preventivi_collegati: [args.quote_id] // Auto-link
        });

        // Update Quote with new Cantiere ID
        await ctx.db.patch(args.quote_id, { cantiere_id: id });

        // Log activity
        await ctx.db.insert("activity_log", {
            user_email: identity!.email || "",
            user_name: identity!.name,
            action: "created",
            entity_type: "cantiere",
            entity_id: id,
            entity_name: args.nome_cantiere,
            details: `Creato cantiere da preventivo ${quote.full_name}`,
            created_date: new Date().toISOString(),
        });

        return id;
    },
});

// Update cantiere (enhanced with all fields)
export const updateCantiere = mutation({
    args: {
        id: v.id("cantieri"),
        data: v.object({
            nome_cantiere: v.optional(v.string()),
            cliente: v.optional(v.string()),
            client_id: v.optional(v.id("clients")),
            indirizzo: v.optional(v.string()),
            status: v.optional(v.string()),
            valore_contratto: v.optional(v.number()),
            valore_progetto: v.optional(v.number()),
            costi_effettivi: v.optional(v.number()),
            progresso: v.optional(v.number()),
            progresso_in_lavorazione: v.optional(v.number()),
            progresso_posa_in_opera: v.optional(v.number()),
            progresso_completamento: v.optional(v.number()),
            team_assegnato: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx);
        await ctx.db.patch(args.id, args.data);

        // Log update
        const cantiere = await ctx.db.get(args.id);
        if (cantiere) {
            const identity = await ctx.auth.getUserIdentity();
            await ctx.db.insert("activity_log", {
                user_email: identity!.email || "",
                user_name: identity!.name,
                action: "updated",
                entity_type: "cantiere",
                entity_id: args.id,
                entity_name: cantiere.nome_cantiere,
                details: args.data.status ? `Stato cantiere aggiornato a: ${args.data.status}` : "Dettagli cantiere modificati",
                created_date: new Date().toISOString(),
            });
        }
    },
});

// Link quote to cantiere
export const linkQuote = mutation({
    args: {
        cantiere_id: v.id("cantieri"),
        quote_id: v.id("quotes"),
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Role check

        const cantiere = await ctx.db.get(args.cantiere_id);
        if (!cantiere) throw new Error("Cantiere not found");

        const existing = cantiere.preventivi_collegati || [];
        if (!existing.includes(args.quote_id)) {
            await ctx.db.patch(args.cantiere_id, {
                preventivi_collegati: [...existing, args.quote_id],
            });
        }

        // Also update quote with cantiere_id
        await ctx.db.patch(args.quote_id, { cantiere_id: args.cantiere_id });

        // Log link
        const identity = await ctx.auth.getUserIdentity();
        const quote = await ctx.db.get(args.quote_id);
        if (identity && quote && cantiere) {
            await ctx.db.insert("activity_log", {
                user_email: identity.email!,
                user_name: identity.name,
                action: "linked_quote",
                entity_type: "cantiere",
                entity_id: args.cantiere_id,
                entity_name: cantiere.nome_cantiere,
                details: `Preventivo per ${quote.full_name} collegato al cantiere`,
                created_date: new Date().toISOString(),
            });
        }
    },
});

// Teams
export const listTeams = query({
    args: { company_email: v.string() },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        return await ctx.db
            .query("company_teams")
            .withIndex("by_company", (q) => q.eq("company_email", args.company_email))
            .collect();
    },
});

// Get team members for a cantiere
export const getCantiereTeam = query({
    args: { cantiere_id: v.id("cantieri") },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        return await ctx.db
            .query("cantiere_team_members")
            .withIndex("by_cantiere", (q) => q.eq("cantiere_id", args.cantiere_id))
            .collect();
    },
});

// Invite team member
export const inviteTeamMember = mutation({
    args: {
        cantiere_id: v.id("cantieri"),
        email: v.string(),
        role: v.string(),
        invited_by: v.string(),
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Role check

        const existing = await ctx.db
            .query("cantiere_team_members")
            .filter((q) =>
                q.and(
                    q.eq(q.field("cantiere_id"), args.cantiere_id),
                    q.eq(q.field("email"), args.email)
                )
            )
            .first();

        if (existing) {
            throw new Error("Questo utente è già stato invitato");
        }

        const invitedUser = await ctx.db.query("users").withIndex("by_email", (q: any) => q.eq("email", args.email)).first();
        const isInternal = invitedUser && ["superadmin", "admin", "collaborator_internal"].includes(invitedUser.role);

        return await ctx.db.insert("cantiere_team_members", {
            cantiere_id: args.cantiere_id,
            email: args.email,
            role: args.role,
            invited_by: args.invited_by,
            status: isInternal ? "accepted" : "pending",
            invited_date: new Date().toISOString(),
            accepted_date: isInternal ? new Date().toISOString() : undefined,
        });
    },
});

// Update team member
export const updateTeamMember = mutation({
    args: {
        member_id: v.id("cantiere_team_members"),
        role: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const member = await ctx.db.get(args.member_id);
        if (!member) throw new Error("Member not found");

        let isAdmin = false;
        try {
            await checkAdminOrCeo(ctx);
            isAdmin = true;
        } catch (e) {
            isAdmin = false;
        }

        if (args.role && !isAdmin) {
            throw new Error("Unauthorized: Only Admin can change roles");
        }

        if (args.status) {
            // Verify if it's self-update or admin
            if (!isAdmin && member.email !== identity.email) {
                throw new Error("Unauthorized: You can only update your own status");
            }
        }

        const updates: Record<string, string> = {};
        if (args.role) updates.role = args.role;
        if (args.status) {
            updates.status = args.status;
            if (args.status === "accepted") {
                updates.accepted_date = new Date().toISOString();
            }
        }

        await ctx.db.patch(args.member_id, updates);
        return true;
    },
});

// Remove team member
export const removeTeamMember = mutation({
    args: { member_id: v.id("cantiere_team_members") },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Role check
        await ctx.db.delete(args.member_id);
        return true;
    },
});



// Create a new Company Team + Automatic Chat Channel
export const createTeam = mutation({
    args: {
        company_email: v.string(),
        team_name: v.string(),
        members: v.array(v.string()), // emails
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Role check
        const identity = await ctx.auth.getUserIdentity();

        const teamId = await ctx.db.insert("company_teams", {
            company_email: args.company_email,
            team_name: args.team_name,
            members: args.members,
            created_by: identity!.email!,
            created_date: new Date().toISOString(),
        });

        // Automatically create a chat channel for this team
        await ctx.db.insert("chat_channels", {
            company_email: args.company_email,
            name: `Team: ${args.team_name}`,
            type: "team",
            linked_id: teamId,
            members: [...args.members, identity!.email!], // Add admin/creator to chat
            created_by: identity!.email!,
        });

        // Promote members to 'collaborator' if they are basic users
        for (const email of args.members) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", email))
                .first();

            if (user && user.role === "user") {
                await ctx.db.patch(user._id, { role: "collaborator" });
            }
        }

        return teamId;
    },
});

// Add member to team
export const addMemberToTeam = mutation({
    args: {
        team_id: v.id("company_teams"),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Role check

        const team = await ctx.db.get(args.team_id);
        if (!team) throw new Error("Team not found");

        const members = team.members || [];
        if (members.includes(args.email)) return; // Already in team

        await ctx.db.patch(args.team_id, {
            members: [...members, args.email],
        });

        // Update linked chat channel
        const channel = await ctx.db
            .query("chat_channels")
            .filter(q => q.eq(q.field("linked_id"), args.team_id))
            .first();

        if (channel && !channel.members.includes(args.email)) {
            await ctx.db.patch(channel._id, {
                members: [...channel.members, args.email]
            });
        }

        // Promote to 'collaborator' if basic user
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (user && user.role === "user") {
            await ctx.db.patch(user._id, { role: "collaborator" });
        }
    },
});

// Remove member from team
export const removeMemberFromTeam = mutation({
    args: {
        team_id: v.id("company_teams"),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Role check

        const team = await ctx.db.get(args.team_id);
        if (!team) throw new Error("Team not found");

        const members = team.members || [];
        const newMembers = members.filter(m => m !== args.email);

        await ctx.db.patch(args.team_id, {
            members: newMembers,
        });

        // Update linked chat channel
        const channel = await ctx.db
            .query("chat_channels")
            .filter(q => q.eq(q.field("linked_id"), args.team_id))
            .first();

        if (channel) {
            await ctx.db.patch(channel._id, {
                members: channel.members.filter(m => m !== args.email)
            });
        }
    },
});

// Delete Cantiere
export const deleteCantiere = mutation({
    args: { id: v.id("cantieri") },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx);
        const identity = await ctx.auth.getUserIdentity();

        const cantiere = await ctx.db.get(args.id);
        if (!cantiere) throw new Error("Cantiere not found");

        // Unlink quotes
        if (cantiere.preventivi_collegati) {
            for (const quoteId of cantiere.preventivi_collegati) {
                await ctx.db.patch(quoteId, { cantiere_id: undefined });
            }
        }

        // Delete associated tasks
        const tasks = await ctx.db.query("phase_tasks").withIndex("by_cantiere", q => q.eq("cantiere_id", args.id)).collect();
        for (const task of tasks) {
            await ctx.db.delete(task._id);
        }

        // Delete associated team members
        const team = await ctx.db.query("cantiere_team_members").withIndex("by_cantiere", q => q.eq("cantiere_id", args.id)).collect();
        for (const member of team) {
            await ctx.db.delete(member._id);
        }

        // Log deletion
        if (identity) {
            await ctx.db.insert("activity_log", {
                user_email: identity.email!,
                user_name: identity.name || identity.email!,
                action: "deleted",
                entity_type: "cantiere",
                entity_id: args.id,
                entity_name: cantiere.nome_cantiere,
                details: `Cantiere eliminato da ${identity.email}`,
                created_date: new Date().toISOString(),
            });
        }

        await ctx.db.delete(args.id);
    },
});
