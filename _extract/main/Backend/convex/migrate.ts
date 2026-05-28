/**
 * migrate.ts — Safe, non-destructive data migration
 *
 * Backfills all existing records with new optional fields and fixes legacy values.
 * Safe to run multiple times (idempotent) — only patches records that need updating.
 * Callable from the Admin panel (adminStats or direct mutation call).
 *
 * Tables handled:
 *   users            — fix legacy roles, ensure admin emails have admin role
 *   quotes           — backfill request_title, material_category, attachment_photos
 *   payments         — backfill rejection tracking fields (already optional in schema)
 *   supplier_requests — backfill new optional fields with safe defaults
 *   supplier_orders  — backfill workflow fields for pre-workflow orders
 *   clients          — ensure client_type default
 *   collaborators    — ensure type/status defaults
 */

import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_EMAILS = ["contact.core829@gmail.com", "info@iwhome.it"];

// ─────────────────────────────────────────────────────────
// Public mutation — callable by admin from the frontend
// ─────────────────────────────────────────────────────────
export const runMigration = mutation({
    args: {},
    handler: async (ctx): Promise<{
        users: number;
        quotes: number;
        payments: number;
        supplier_requests: number;
        supplier_orders: number;
        clients: number;
        collaborators: number;
        total: number;
    }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Non autenticato.");

        // Only admin can run migrations
        const caller = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!caller || (caller.role !== "admin" )) {
            throw new Error("Accesso negato. Solo gli amministratori possono eseguire la migrazione.");
        }

        let patchedUsers = 0;
        let patchedQuotes = 0;
        let patchedPayments = 0;
        let patchedRequests = 0;
        let patchedOrders = 0;
        let patchedClients = 0;
        let patchedCollaborators = 0;

        // ── 1. USERS ────────────────────────────────────────────
        // Fix legacy roles and ensure admin emails always have admin role.
        const allUsers = await ctx.db.query("users").collect();
        for (const user of allUsers) {
            let newRole = user.role;

            if (ADMIN_EMAILS.includes(user.email)) {
                // Blessed emails → always admin
                newRole = "admin";
            } else if (newRole === "admin" || newRole === "superadmin") {
                // Non-blessed user somehow got admin → demote to client
                newRole = "client";
            } else if (newRole === "user") {
                // Legacy "user" role → migrate to client
                newRole = "client";
            } else if (newRole === "supervisor") {
                // Legacy "supervisor" role → migrate to collaborator
                newRole = "collaborator";
            } else if (!newRole) {
                // No role at all → default to client
                newRole = "client";
            }
            // Valid modern roles: client, supplier, collaborator, admin, superadmin — leave as-is

            if (newRole !== user.role) {
                await ctx.db.patch(user._id, { role: newRole });
                patchedUsers++;
            }
        }

        // ── 2. QUOTES ────────────────────────────────────────────
        // Backfill new fields with safe empty defaults for old records.
        const allQuotes = await ctx.db.query("quotes").collect();
        for (const quote of allQuotes) {
            const updates: Record<string, unknown> = {};

            if (quote.request_title === undefined) {
                // Derive from existing title field if available
                updates.request_title = quote.title ?? "";
            }
            if (quote.material_category === undefined) {
                updates.material_category = "";
            }
            if (quote.attachment_photos === undefined) {
                updates.attachment_photos = [];
            }
            // Ensure files array is never undefined
            if (quote.files === undefined) {
                updates.files = [];
            }

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(quote._id, updates);
                patchedQuotes++;
            }
        }

        // ── 3. PAYMENTS ──────────────────────────────────────────
        // Fix any payments stuck with invalid status.
        // NOTE: optional string fields cannot be set to null in Convex — leave them absent.
        const allPayments = await ctx.db.query("payments").collect();
        for (const payment of allPayments) {
            const updates: Record<string, unknown> = {};

            const validStatuses = ["in_attesa", "in_verifica", "pagato", "in_ritardo", "parziale", "confirmed"];
            if (!payment.status || !validStatuses.includes(payment.status)) {
                updates.status = "in_attesa";
            }

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(payment._id, updates);
                patchedPayments++;
            }
        }

        // ── 4. SUPPLIER REQUESTS ─────────────────────────────────
        // Backfill new optional fields for old requests.
        const allRequests = await ctx.db.query("supplier_requests").collect();
        for (const req of allRequests) {
            const updates: Record<string, unknown> = {};

            if (req.photos === undefined) updates.photos = [];
            if (req.documents === undefined) updates.documents = [];
            if (req.quote_revision_count === undefined) updates.quote_revision_count = 0;

            // Fix invalid statuses — valid: draft | sent | received | quoted | accepted | rejected
            const validReqStatuses = ["draft", "sent", "received", "quoted", "accepted", "rejected"];
            if (!req.status || !validReqStatuses.includes(req.status)) {
                updates.status = "draft";
            }

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(req._id, updates);
                patchedRequests++;
            }
        }

        // ── 5. SUPPLIER ORDERS ───────────────────────────────────
        // Backfill workflow fields for orders that predate the 9-step workflow.
        const allOrders = await ctx.db.query("supplier_orders").collect();
        for (const order of allOrders) {
            const updates: Record<string, unknown> = {};

            if (order.workflow_step === undefined) updates.workflow_step = 1;
            if (order.workflow_history === undefined) updates.workflow_history = [];
            if (order.locked === undefined) updates.locked = false;
            if (order.acconto_paid === undefined) updates.acconto_paid = false;

            // Fix invalid statuses — valid: confirmed | in_production | ready | shipped | delivered
            const validOrderStatuses = ["confirmed", "in_production", "ready", "shipped", "delivered"];
            if (!order.status || !validOrderStatuses.includes(order.status)) {
                updates.status = "confirmed";
            }

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(order._id, updates);
                patchedOrders++;
            }
        }

        // ── 6. CLIENTS ───────────────────────────────────────────
        // Ensure client_type is set for all clients.
        const allClients = await ctx.db.query("clients").collect();
        for (const client of allClients) {
            const updates: Record<string, unknown> = {};

            if (!client.client_type) {
                updates.client_type = "b2c"; // default for existing clients without type
            }

            // Fix invalid statuses — valid: lead, active, archived
            const validClientStatuses = ["lead", "active", "archived"];
            if (!client.status || !validClientStatuses.includes(client.status)) {
                updates.status = "active";
            }

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(client._id, updates);
                patchedClients++;
            }
        }

        // ── 7. COLLABORATORS ─────────────────────────────────────
        // Ensure type and status fields exist.
        const allCollaborators = await ctx.db.query("collaborators").collect();
        for (const collab of allCollaborators) {
            const updates: Record<string, unknown> = {};

            if (!collab.type) updates.type = "internal";
            if (!collab.status) updates.status = "active";
            if (collab.documents === undefined) updates.documents = [];

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(collab._id, updates);
                patchedCollaborators++;
            }
        }

        const total = patchedUsers + patchedQuotes + patchedPayments + patchedRequests + patchedOrders + patchedClients + patchedCollaborators;

        return {
            users: patchedUsers,
            quotes: patchedQuotes,
            payments: patchedPayments,
            supplier_requests: patchedRequests,
            supplier_orders: patchedOrders,
            clients: patchedClients,
            collaborators: patchedCollaborators,
            total,
        };
    },
});

// ─────────────────────────────────────────────────────────
// Internal mutation — callable by Cron without auth check
// (can be used to run migration automatically on deploy)
// ─────────────────────────────────────────────────────────
export const runMigrationInternal = internalMutation({
    args: {},
    handler: async (ctx): Promise<{ total: number }> => {
        let total = 0;

        // Users — fix roles
        const allUsers = await ctx.db.query("users").collect();
        for (const user of allUsers) {
            let newRole = user.role;
            if (ADMIN_EMAILS.includes(user.email)) newRole = "admin";
            else if (newRole === "user") newRole = "client";
            else if (newRole === "supervisor") newRole = "collaborator";
            else if (!newRole) newRole = "client";
            else if ((newRole === "admin" || newRole === "superadmin") && !ADMIN_EMAILS.includes(user.email)) newRole = "client";
            if (newRole !== user.role) { await ctx.db.patch(user._id, { role: newRole }); total++; }
        }

        // Quotes — backfill new fields
        const allQuotes = await ctx.db.query("quotes").collect();
        for (const quote of allQuotes) {
            const updates: Record<string, unknown> = {};
            if (quote.request_title === undefined) updates.request_title = quote.title ?? "";
            if (quote.material_category === undefined) updates.material_category = "";
            if (quote.attachment_photos === undefined) updates.attachment_photos = [];
            if (quote.files === undefined) updates.files = [];
            if (Object.keys(updates).length > 0) { await ctx.db.patch(quote._id, updates); total++; }
        }

        // Payments — backfill rejection fields
        const allPayments = await ctx.db.query("payments").collect();
        for (const payment of allPayments) {
            const updates: Record<string, unknown> = {};
            const valid = ["in_attesa", "in_verifica", "pagato", "in_ritardo", "parziale", "confirmed"];
            if (!payment.status || !valid.includes(payment.status)) { updates.status = "in_attesa"; }
            if (Object.keys(updates).length > 0) { await ctx.db.patch(payment._id, updates); total++; }
        }

        // Supplier requests — backfill
        const allRequests = await ctx.db.query("supplier_requests").collect();
        for (const req of allRequests) {
            const updates: Record<string, unknown> = {};
            if (req.photos === undefined) updates.photos = [];
            if (req.documents === undefined) updates.documents = [];
            if (req.quote_revision_count === undefined) updates.quote_revision_count = 0;
            const validS = ["draft", "sent", "received", "quoted", "accepted", "rejected"];
            if (!req.status || !validS.includes(req.status)) updates.status = "draft";
            if (Object.keys(updates).length > 0) { await ctx.db.patch(req._id, updates); total++; }
        }

        return { total };
    },
});
