import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Only these two emails can ever hold the admin role. No one else.
const ADMIN_EMAILS = ["contact.core829@gmail.com", "info@kranely.app"];

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        // If admin, return everyone
        if (user?.role === "admin") {
            return await ctx.db.query("users").collect();
        }

        // Non-admin users can see admins and superadmins to start chats
        const admins = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "admin")).collect();
        const superadmins = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "superadmin")).collect();

        // Resolve profile images
        const users = [...admins, ...superadmins];
        for (const u of users) {
            if (u.profile_image && !u.profile_image.startsWith('http')) {
                u.profile_image = (await ctx.storage.getUrl(u.profile_image)) || u.profile_image;
            }
        }

        // Remove duplicates if any
        const map = new Map();
        users.forEach(u => map.set(u._id, u));
        return Array.from(map.values());
    },
});

export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        // Require authentication — never expose user data to unauthenticated requests.
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        // Reject empty email queries
        if (!args.email || !args.email.includes("@")) return null;

        // Only allow querying your own profile unless you're an admin.
        const isSelf = identity.email === args.email;
        if (!isSelf) {
            // Check if requester is admin
            const requester = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();
            const isAdmin = requester?.role === "admin" || requester?.role === "superadmin";
            if (!isAdmin) return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (user && user.profile_image && !user.profile_image.startsWith('http')) {
            user.profile_image = (await ctx.storage.getUrl(user.profile_image)) || user.profile_image;
        }

        return user;
    },
});

export const store = mutation({
    args: {
        // Optional: pass the org's ID when registering from a white-label tenant portal.
        organization_id: v.optional(v.id("organizations")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        let user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        // Fallback: if no user found by tokenIdentifier, try by email (handles Clerk domain migration)
        let isNewTokenLink = false;
        if (!user && identity.email) {
            const userByEmail = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", identity.email!))
                .first();
            
            if (userByEmail) {
                // Link existing user to new Clerk tokenIdentifier
                await ctx.db.patch(userByEmail._id, { tokenIdentifier: identity.tokenIdentifier });
                user = userByEmail;
                isNewTokenLink = true;
            }
        }

        const { name, email } = identity;

        if (user) {
            let role = user.role;
            if (ADMIN_EMAILS.includes(email!)) {
                // Blessed email → always admin
                role = "admin";
            } else if (role === "admin" || role === "superadmin") {
                // Non-blessed email somehow ended up as admin → demote to client
                role = "client";
            } else if (role === "user") {
                // Legacy "user" role → migrate to client
                role = "client";
            } else if (role === "supervisor") {
                // Legacy "supervisor" role → migrate to collaborator
                role = "collaborator";
            }

            // If user has no role at all, default to client
            if (!role) role = "client";

            if (user.email !== email || user.fullName !== name || user.role !== role) {
                await ctx.db.patch(user._id, { email, fullName: name, role });
                // Trigger Account Update Notification
                const changes: any = { role };
                // Check if name changed (and it's not just the first sync or null)
                if (user.fullName && name && user.fullName !== name) {
                    changes.fullName = name;
                }

                await ctx.scheduler.runAfter(0, internal.notifications.triggerAccountUpdate, {
                    email: email!,
                    changes: changes
                });
            }

            // Auto-link supplier record: if this user has the supplier role and their
            // supplier record doesn't have user_id set yet (e.g. admin manually assigned
            // the role instead of going through the onboarding code flow), link them now.
            // Uses case-insensitive email match to handle admin typos (INFO@ vs info@).
            if (role === "supplier") {
                let supplierRecord = await ctx.db
                    .query("suppliers")
                    .withIndex("by_email", (q) => q.eq("email", email!))
                    .first();
                if (!supplierRecord) {
                    // Case-insensitive fallback — admin may have stored email with different casing
                    const allSuppliers = await ctx.db.query("suppliers").collect();
                    supplierRecord = allSuppliers.find(
                        (s) => s.email.toLowerCase() === email!.toLowerCase()
                    ) ?? null;
                }
                if (supplierRecord && !supplierRecord.user_id) {
                    await ctx.db.patch(supplierRecord._id, { user_id: user._id });
                }
            }

            return user._id;
        }

        // New users get "client" role by default; admin emails get "admin"
        let role: string = "client";
        if (ADMIN_EMAILS.includes(email!)) {
            role = "admin";
        }

        // Check by email to avoid duplicate records (e.g. re-auth with new Clerk token)
        const existingByEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email!))
            .first();

        if (existingByEmail) {
            // Link existing record to new Clerk token
            await ctx.db.patch(existingByEmail._id, { tokenIdentifier: identity.tokenIdentifier });
            return existingByEmail._id;
        }

        const userId = await ctx.db.insert("users", {
            email: email!,
            fullName: name,
            tokenIdentifier: identity.tokenIdentifier,
            is_company: false,
            role,
            ...(args.organization_id ? { organization_id: args.organization_id } : {}),
        });

        // Trigger Welcome Notification
        await ctx.scheduler.runAfter(0, internal.notifications.triggerWelcome, {
            email: email!,
            name: name || "Utente",
            role: role ?? "pending"
        });

        return userId;
    },
});

export const verifyAccount = mutation({
    args: { accessCode: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Rate limit: max 5 attempts per hour per user
        const now = Date.now();
        const key = `verify_account:${identity.email}`;
        const record = await ctx.db.query("rate_limits").withIndex("by_key", (q) => q.eq("key", key)).first();
        const window = 60 * 60 * 1000;
        if (record && now < record.window_start + window) {
            if (record.count >= 5) throw new Error("Troppi tentativi. Riprova tra un'ora.");
            await ctx.db.patch(record._id, { count: record.count + 1 });
        } else if (record) {
            await ctx.db.patch(record._id, { count: 1, window_start: now });
        } else {
            await ctx.db.insert("rate_limits", { key, count: 1, window_start: now });
        }

        const USER_CODE = process.env.USER_ACCESS_CODE || "KRANELY_SHOWROOM@AREAPRIVATA";
        const code = args.accessCode.trim();

        if (code === USER_CODE) {
            return { success: true, type: 'user', message: "Account Utente Verificato" };
        } else {
            throw new Error("Codice non valido");
        }
    },
});

export const updateProfile = mutation({
    args: {
        fullName: v.optional(v.string()),
        profile_image: v.optional(v.string()),
        work_sector: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Try by tokenIdentifier first
        let user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        // Fallback: try by email if tokenIdentifier doesn't match (handles Clerk domain migration)
        if (!user && identity.email) {
            user = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", identity.email!))
                .first();
            
            // If found by email but tokenIdentifier is different, update it
            if (user && user.tokenIdentifier !== identity.tokenIdentifier) {
                await ctx.db.patch(user._id, { tokenIdentifier: identity.tokenIdentifier });
            }
        }

        // If still no user found, create one (handles case where sync missed this user)
        if (!user && identity.email) {
            let role = "client";
            if (ADMIN_EMAILS.includes(identity.email)) {
                role = "admin";
            }
            const userId = await ctx.db.insert("users", {
                email: identity.email,
                fullName: identity.name,
                tokenIdentifier: identity.tokenIdentifier,
                role: role,
                createdAt: new Date().toISOString(),
            });
            return userId;
        }

        if (!user) throw new Error("User not found");

        const updates: any = {};
        if (args.fullName !== undefined) updates.fullName = args.fullName;
        if (args.profile_image !== undefined) updates.profile_image = args.profile_image;
        if (args.work_sector !== undefined) updates.work_sector = args.work_sector;

        await ctx.db.patch(user._id, updates);

        // Notify if name changed
        if (args.fullName && args.fullName !== user.fullName) {
            await ctx.scheduler.runAfter(0, internal.notifications.triggerAccountUpdate, {
                email: user.email,
                changes: { fullName: args.fullName }
            });
        }
    },
});

// Self-upgrade to client role when requesting a quote
export const upgradeToCliente = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) throw new Error("User not found");

        // Only upgrade if user has no role or legacy 'user' role
        if (!user.role || user.role === "user") {
            await ctx.db.patch(user._id, { role: "client" });
        }

        return { success: true, role: (!user.role || user.role === "user") ? "client" : user.role };
    },
});

// ============ ADMIN MUTATIONS ============

// Helper to verify admin/superadmin role
async function requireAdmin(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();

    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
        throw new Error("Unauthorized: Admin access required");
    }
    return user;
}

export const updateRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.string(),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);

        const validRoles = ["client", "supplier", "collaborator", "admin"];
        if (!validRoles.includes(args.role)) {
            throw new Error("Ruolo non valido: " + args.role);
        }

        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) throw new Error("Utente non trovato");

        // Prevent granting admin/superadmin to non-blessed emails
        if ((args.role === "admin" || args.role === "superadmin") && !ADMIN_EMAILS.includes(targetUser.email)) {
            throw new Error("Solo le email autorizzate possono avere il ruolo admin");
        }

        await ctx.db.patch(args.userId, { role: args.role });

        await ctx.scheduler.runAfter(0, internal.notifications.triggerAccountUpdate, {
            email: targetUser.email,
            changes: { role: args.role }
        });

        return { success: true };
    },
});

export const blockUser = mutation({
    args: {
        userId: v.id("users"),
        blocked: v.boolean(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);

        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) throw new Error("Utente non trovato");

        // Prevent blocking other admins/CEOs
        if (targetUser.role === "admin") {
            throw new Error("Non puoi bloccare un amministratore");
        }

        await ctx.db.patch(args.userId, {
            blocked: args.blocked,
            blocked_reason: args.blocked ? (args.reason || "Bloccato dall'amministratore") : undefined,
        });

        return { success: true };
    },
});

export const deleteUser = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx);

        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) throw new Error("Utente non trovato");

        // Prevent self-deletion & admin deletion
        if (targetUser._id === admin._id) {
            throw new Error("Non puoi eliminare il tuo account");
        }
        if (targetUser.role === "admin") {
            throw new Error("Non puoi eliminare un amministratore");
        }

        await ctx.db.delete(args.userId);

        return { success: true };
    },
});

/**
 * Internal mutation to upsert a user into the Convex users table.
 * Used by the Clerk sync action. Returns true if user was newly inserted.
 */
export const upsertUser = internalMutation({
    args: {
        email: v.string(),
        fullName: v.union(v.string(), v.null()),
        tokenIdentifier: v.string(),
    },
    handler: async (ctx, args): Promise<boolean> => {
        // Helper: check if this email belongs to an active supplier record
        const findSupplierByEmail = async (email: string) => {
            let s = await ctx.db.query("suppliers")
                .withIndex("by_email", (q) => q.eq("email", email))
                .first();
            if (!s) {
                const all = await ctx.db.query("suppliers").collect();
                s = all.find(r => r.email.toLowerCase() === email.toLowerCase()) ?? null;
            }
            return s?.status === "active" ? s : null;
        };

        // Check by tokenIdentifier first (most accurate)
        const existingByToken = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
            .first();

        if (existingByToken) {
            // Auto-upgrade to supplier if email matches an active supplier record
            if (existingByToken.role === "client" || existingByToken.role === "user") {
                const supplier = await findSupplierByEmail(args.email);
                if (supplier) {
                    await ctx.db.patch(existingByToken._id, { role: "supplier" });
                    if (!supplier.user_id) {
                        await ctx.db.patch(supplier._id, { user_id: existingByToken._id, invitation_status: "accepted" });
                    }
                }
            }
            return false;
        }

        // Also check by email to avoid duplicates
        const existingByEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingByEmail) {
            const updates: Record<string, any> = {};
            if (existingByEmail.tokenIdentifier !== args.tokenIdentifier) {
                updates.tokenIdentifier = args.tokenIdentifier;
            }
            // Auto-upgrade to supplier if not already a privileged role
            if (existingByEmail.role === "client" || existingByEmail.role === "user") {
                const supplier = await findSupplierByEmail(args.email);
                if (supplier) {
                    updates.role = "supplier";
                    if (!supplier.user_id) {
                        await ctx.db.patch(supplier._id, { user_id: existingByEmail._id, invitation_status: "accepted" });
                    }
                }
            }
            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(existingByEmail._id, updates);
            }
            return false;
        }

        // Determine role: client by default, admin for blessed emails, supplier if email matches
        let role: string = "client";
        if (ADMIN_EMAILS.includes(args.email)) {
            role = "admin";
        }

        // Auto-assign supplier role on first registration if email is in active supplier records
        const supplierOnInsert = await findSupplierByEmail(args.email);
        if (supplierOnInsert && role === "client") {
            role = "supplier";
        }

        // Insert new user
        const newUserId = await ctx.db.insert("users", {
            email: args.email,
            fullName: args.fullName ?? undefined,
            tokenIdentifier: args.tokenIdentifier,
            is_company: false,
            role,
        });

        // Link supplier record if found
        if (supplierOnInsert && !supplierOnInsert.user_id) {
            await ctx.db.patch(supplierOnInsert._id, { user_id: newUserId, invitation_status: "accepted" });
        }

        return true;
    },
});

// ── Migration: convert legacy roles ──────────────────────────────────────
// Internal migration — run once via CLI: npx convex run users:migrateLegacyRoles
export const migrateLegacyRoles = internalMutation({
    args: {},
    handler: async (ctx) => {

        const allUsers = await ctx.db.query("users").collect();
        let migrated = 0;

        for (const user of allUsers) {
            let newRole: string | undefined;
            if (user.role === "user") newRole = "client";
            else if (user.role === "superadmin") newRole = "admin";
            else if (user.role === "supervisor") newRole = "collaborator";

            if (newRole) {
                await ctx.db.patch(user._id, { role: newRole });
                migrated++;
            }
        }

        return { migrated };
    },
});
