import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./rbac";

// Admin-only: List all clients
export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Check if user is admin
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (user?.role !== "admin") {
            throw new Error("Unauthorized: Admin only");
        }

        return await ctx.db.query("clients").order("desc").collect();
    },
});

// List all chateable clients (clients table + users with role='client')
// Used by ClientChat to show all potential chat partners
export const listForChat = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Check if user is admin
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (user?.role !== "admin") {
            return []; // Non-admins can't list all clients
        }

        // Get clients from 'clients' table
        const clientsFromTable = await ctx.db.query("clients").order("desc").collect();

        // Get users with role='client' from 'users' table
        const clientUsers = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "client"))
            .collect();

        // Merge, using email as unique key
        const emailMap = new Map();

        // Add clients from clients table
        clientsFromTable.forEach(c => {
            emailMap.set(c.email, {
                _id: c._id,
                full_name: c.full_name,
                email: c.email,
                phone: c.phone,
                source: 'clients'
            });
        });

        // Add users with role='client' (if not already present)
        clientUsers.forEach(u => {
            if (!emailMap.has(u.email)) {
                emailMap.set(u.email, {
                    _id: u._id,
                    full_name: u.fullName || u.email.split('@')[0],
                    email: u.email,
                    phone: null,
                    source: 'users'
                });
            }
        });

        return Array.from(emailMap.values());
    },
});

// Get client by ID with linked cantieri
export const getById = query({
    args: { id: v.id("clients") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const client = await ctx.db.get(args.id);
        if (!client) return null;

        // Get linked cantieri
        const cantieri = await ctx.db
            .query("cantieri")
            .withIndex("by_client", (q) => q.eq("client_id", args.id))
            .collect();

        // Get quotes by email
        const quotes = await ctx.db
            .query("quotes")
            .withIndex("by_email", (q) => q.eq("email", client.email))
            .collect();

        return {
            ...client,
            cantieri,
            quotes,
        };
    },
});

// Admin-only: Create client (MUST be linked to a real user account)
export const create = mutation({
    args: {
        full_name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        fiscal_code: v.optional(v.string()),
        company_name: v.optional(v.string()),
        notes: v.optional(v.string()),
        client_type: v.optional(v.string()),
        vat_number: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const adminUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (adminUser?.role !== "admin" && adminUser?.role !== "superadmin") {
            throw new Error("Unauthorized: Admin only");
        }

        // MANDATORY: Verify that a real user account exists with this email
        const targetUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!targetUser) {
            throw new Error("Utente non trovato. Il cliente deve essere collegato a un account utente registrato.");
        }

        // Check if client with email already exists in clients table
        const existingClient = await ctx.db
            .query("clients")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingClient) {
            throw new Error("Cliente con questa email già esistente");
        }

        // Auto-promote user from 'user' to 'client' role if needed
        if (targetUser.role === 'user') {
            await ctx.db.patch(targetUser._id, { role: 'client' });

            // Log the promotion
            await ctx.db.insert("activity_log", {
                user_email: identity.email!,
                user_name: adminUser.fullName || identity.email!,
                action: "role_promoted",
                entity_type: "user",
                entity_id: targetUser._id,
                entity_name: targetUser.fullName || targetUser.email,
                details: `Promosso da 'user' a 'client' dall'admin durante creazione cliente`,
                created_date: new Date().toISOString(),
            });
        }

        // Create the client entry
        const clientId = await ctx.db.insert("clients", {
            ...args,
            full_name: args.full_name || targetUser.fullName || targetUser.email,
            status: "active",
            created_by: identity.email!,
            created_date: new Date().toISOString(),
        });

        // Log client creation
        await ctx.db.insert("activity_log", {
            user_email: identity.email!,
            user_name: adminUser.fullName || identity.email!,
            action: "created",
            entity_type: "client",
            entity_id: clientId,
            entity_name: args.full_name,
            details: `Cliente creato e collegato a utente ${targetUser.email}`,
            created_date: new Date().toISOString(),
        });

        return clientId;
    },
});

// Admin-only: Update client
export const update = mutation({
    args: {
        id: v.id("clients"),
        full_name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        fiscal_code: v.optional(v.string()),
        company_name: v.optional(v.string()),
        notes: v.optional(v.string()),
        status: v.optional(v.string()),
        client_type: v.optional(v.string()),
        vat_number: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (user?.role !== "admin") {
            throw new Error("Unauthorized: Admin only");
        }

        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);

        // Log update
        const client = await ctx.db.get(id);
        if (client) {
            await ctx.db.insert("activity_log", {
                user_email: identity.email!,
                user_name: user?.fullName || identity.email!,
                action: "updated",
                entity_type: "client",
                entity_id: id,
                entity_name: client.full_name,
                details: "Dettagli cliente modificati",
                created_date: new Date().toISOString(),
            });
        }
        return id;
    },
});

// Admin-only: Archive client
export const archive = mutation({
    args: { id: v.id("clients") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (user?.role !== "admin") {
            throw new Error("Unauthorized: Admin only");
        }

        await ctx.db.patch(args.id, { status: "archived" });

        // Log archive
        const client = await ctx.db.get(args.id);
        if (client) {
            await ctx.db.insert("activity_log", {
                user_email: identity.email!,
                user_name: user?.fullName || identity.email!,
                action: "archived",
                entity_type: "client",
                entity_id: args.id,
                entity_name: client.full_name,
                details: "Cliente archiviato",
                created_date: new Date().toISOString(),
            });
        }
        return args.id;
    },
});

// Admin-only: Unarchive client
export const unarchive = mutation({
    args: { id: v.id("clients") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (user?.role !== "admin") {
            throw new Error("Unauthorized: Admin only");
        }

        await ctx.db.patch(args.id, { status: "active" });

        // Log unarchive
        const client = await ctx.db.get(args.id);
        if (client) {
            await ctx.db.insert("activity_log", {
                user_email: identity.email!,
                user_name: user?.fullName || identity.email!,
                action: "unarchived",
                entity_type: "client",
                entity_id: args.id,
                entity_name: client.full_name,
                details: "Cliente ripristinato",
                created_date: new Date().toISOString(),
            });
        }
        return args.id;
    },
});

// Search clients (for dropdowns)
export const search = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Check permissions (Admin/CEO/Supervisor)
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        // Allow workers to see clients? Maybe restricted, but for now let's allow if they have access to the app
        if (!user) return [];

        const clients = await ctx.db.query("clients").collect();
        const lowerQuery = args.query.toLowerCase();

        return clients.filter(c =>
            c.full_name.toLowerCase().includes(lowerQuery) ||
            c.email.toLowerCase().includes(lowerQuery)
        ).slice(0, 20);
    },
});

// Link client to cantiere
export const linkToCantiere = mutation({
    args: {
        client_id: v.id("clients"),
        cantiere_id: v.id("cantieri"),
    },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.patch(args.cantiere_id, { client_id: args.client_id });
        return true;
    },
});

// Delete Client (Strict: Only if no linked cantieri)
export const deleteClient = mutation({
    args: { id: v.id("clients") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Verify Admin
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (user?.role !== "admin") {
            throw new Error("Unauthorized: Admin only");
        }

        const client = await ctx.db.get(args.id);
        if (!client) throw new Error("Client not found");

        // Check for active cantieri
        const cantieri = await ctx.db
            .query("cantieri")
            .withIndex("by_client", (q) => q.eq("client_id", args.id))
            .collect();

        if (cantieri.length > 0) {
            throw new Error(`Impossibile eliminare: Il cliente ha ${cantieri.length} cantieri collegati. Archivia il cliente o elimina i cantieri prima.`);
        }

        // Log deletion
        await ctx.db.insert("activity_log", {
            user_email: identity.email!,
            user_name: user?.fullName || identity.email!,
            action: "deleted",
            entity_type: "client",
            entity_id: args.id,
            entity_name: client.full_name,
            details: `Cliente eliminato definitivamente`,
            created_date: new Date().toISOString(),
        });

        await ctx.db.delete(args.id);
    },
});
