"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Fetches all users from Clerk's Backend API and syncs missing ones into Convex.
 * This is an internal action used by Cron jobs to keep users in sync.
 */

// Extract Clerk domain from auth.config.ts - use regex to avoid import issues
const CLERK_DOMAIN = "https://choice-marmot-11.clerk.accounts.dev";
const CLERK_APPLICATION_ID = "convex";

export const syncFromClerk = internalAction({
    args: {},
    handler: async (ctx): Promise<{ synced: number; existing: number; total: number; errors: string[] }> => {
        // No auth check needed for internalAction called by Cron

        const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
        if (!CLERK_SECRET_KEY) {
            throw new Error("CLERK_SECRET_KEY not configured. Run: npx convex env set CLERK_SECRET_KEY <key>");
        }

        // Fetch all users from Clerk (paginated)
        let allClerkUsers: any[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(
                `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}&order_by=-created_at`,
                {
                    headers: {
                        "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Clerk API error (${response.status}): ${errorText}`);
            }

            const users = await response.json();

            if (!Array.isArray(users) || users.length === 0) {
                hasMore = false;
            } else {
                allClerkUsers = [...allClerkUsers, ...users];
                offset += limit;
                if (users.length < limit) {
                    hasMore = false;
                }
            }
        }

        // Sync each Clerk user into Convex via the internal mutation in users.ts
        let synced = 0;
        let existing = 0;
        const errors: string[] = [];

        for (const clerkUser of allClerkUsers) {
            const email = clerkUser.email_addresses?.[0]?.email_address;
            if (!email) {
                errors.push(`User ${clerkUser.id} has no email, skipped`);
                continue;
            }

            const fullName = [clerkUser.first_name, clerkUser.last_name]
                .filter(Boolean)
                .join(" ") || null;

        // The tokenIdentifier format used by Convex + Clerk - use the domain from auth.config
        const tokenIdentifier = `${CLERK_DOMAIN}|${clerkUser.id}`;

            try {
                const wasInserted = await ctx.runMutation(internal.users.upsertUser, {
                    email,
                    fullName,
                    tokenIdentifier,
                });

                if (wasInserted) {
                    synced++;
                } else {
                    existing++;
                }
            } catch (err: any) {
                errors.push(`Error syncing ${email}: ${err.message}`);
            }
        }

        return {
            synced,
            existing,
            total: allClerkUsers.length,
            errors,
        };
    },
});

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const manualSync = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Non autenticato.");

        // Verify admin role before allowing manual sync
        const user = await ctx.runQuery(api.users.getByEmail, { email: identity.email! });
        if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
            throw new Error("Accesso negato. Solo gli amministratori possono eseguire la sincronizzazione manuale.");
        }

        const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
        if (!CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY not configured");

        let allClerkUsers: any[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(
                `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}&order_by=-created_at`,
                {
                    headers: {
                        "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) throw new Error("Clerk API Error");
            const users = await response.json();

            if (!Array.isArray(users) || users.length === 0) {
                hasMore = false;
            } else {
                allClerkUsers = [...allClerkUsers, ...users];
                offset += limit;
                if (users.length < limit) hasMore = false;
            }
        }

        let synced = 0;
        for (const clerkUser of allClerkUsers) {
            const email = clerkUser.email_addresses?.[0]?.email_address;
            if (!email) continue;

            const fullName = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") || null;
            const tokenIdentifier = `https://more-dogfish-5.clerk.accounts.dev|${clerkUser.id}`;

            await ctx.runMutation(internal.users.upsertUser, {
                email,
                fullName,
                tokenIdentifier,
            });
            synced++;
        }

        return { success: true, count: synced };
    }
});
