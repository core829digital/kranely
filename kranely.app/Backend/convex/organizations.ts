import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────────────────────
// RBAC helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the currently-authenticated Convex user record, or throws if
 * unauthenticated.
 */
async function getAuthUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .first();

    if (!user) throw new Error("User record not found");
    return user;
}

/**
 * Throws unless the caller has the admin role.
 * OWASP: server-side role check — never trust client-supplied role claims.
 */
async function requireAdmin(ctx: any) {
    const user = await getAuthUser(ctx);
    if (user.role !== "admin" && user.role !== "superadmin") {
        throw new Error("Unauthorized: admin role required");
    }
    return user;
}

/**
 * Ensures the caller belongs to the requested organization (or is an admin).
 * Used for read operations so non-admin users can only read their own org data.
 */
async function requireOrgAccess(ctx: any, organizationId: any) {
    const user = await getAuthUser(ctx);
    const isAdmin = user.role === "admin" || user.role === "superadmin";
    const belongsToOrg = user.organization_id?.toString() === organizationId?.toString();

    if (!isAdmin && !belongsToOrg) {
        throw new Error("Unauthorized: you do not have access to this organization");
    }
    return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATION QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a single organization by ID.
 * Access: admin (any org) | authenticated user who belongs to that org.
 */
export const getOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        await requireOrgAccess(ctx, args.organizationId);
        return await ctx.db.get(args.organizationId);
    },
});

/**
 * Returns all organizations.
 * Access: admin only.
 */
export const listOrganizations = query({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        return await ctx.db.query("organizations").collect();
    },
});

/**
 * Returns the white-label settings for an organization.
 * Access: admin (any org) | authenticated user who belongs to that org.
 */
export const getWhiteLabel = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        await requireOrgAccess(ctx, args.organizationId);

        const settings = await ctx.db
            .query("white_label_settings")
            .withIndex("by_organization", (q: any) =>
                q.eq("organization_id", args.organizationId)
            )
            .first();

        return settings ?? null;
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATION MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new organization.
 * Access: admin only.
 */
export const createOrganization = mutation({
    args: {
        name: v.string(),
        slug: v.optional(v.string()),
        owner_email: v.string(),
        plan: v.optional(v.string()),
        domain: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx);

        // Validate name
        if (!args.name.trim()) throw new Error("Organization name is required");

        // Validate owner email
        if (!args.owner_email.includes("@")) {
            throw new Error("Invalid owner email");
        }

        // Enforce unique slug when provided
        if (args.slug) {
            const existing = await ctx.db
                .query("organizations")
                .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
                .first();
            if (existing) throw new Error("Slug already in use");
        }

        const now = new Date().toISOString();

        const orgId = await ctx.db.insert("organizations", {
            name: args.name.trim(),
            slug: args.slug?.trim().toLowerCase(),
            owner_email: args.owner_email.toLowerCase().trim(),
            plan: args.plan ?? "free",
            status: "active",
            domain: args.domain?.trim().toLowerCase(),
            created_by: admin.email,
            created_date: now,
        });

        return { success: true, organizationId: orgId };
    },
});

/**
 * Updates an existing organization's details.
 * Access: admin only.
 */
export const updateOrganization = mutation({
    args: {
        organizationId: v.id("organizations"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        owner_email: v.optional(v.string()),
        plan: v.optional(v.string()),
        status: v.optional(v.string()),
        domain: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);

        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Organization not found");

        // Validate slug uniqueness if changing
        if (args.slug && args.slug !== org.slug) {
            const existing = await ctx.db
                .query("organizations")
                .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
                .first();
            if (existing) throw new Error("Slug already in use");
        }

        // Validate status values if provided
        if (args.status) {
            const validStatuses = ["active", "suspended", "trial"];
            if (!validStatuses.includes(args.status)) {
                throw new Error("Invalid status: " + args.status);
            }
        }

        const updates: Record<string, any> = { updated_date: new Date().toISOString() };
        if (args.name !== undefined) updates.name = args.name.trim();
        if (args.slug !== undefined) updates.slug = args.slug.trim().toLowerCase();
        if (args.owner_email !== undefined) updates.owner_email = args.owner_email.toLowerCase().trim();
        if (args.plan !== undefined) updates.plan = args.plan;
        if (args.status !== undefined) updates.status = args.status;
        if (args.domain !== undefined) updates.domain = args.domain.trim().toLowerCase();

        await ctx.db.patch(args.organizationId, updates);

        return { success: true };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// WHITE LABEL MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates or updates white-label branding settings for an organization.
 * Access: admin only.
 *
 * Uses upsert pattern: if a settings record already exists it is patched,
 * otherwise a new record is inserted.
 */
export const upsertWhiteLabel = mutation({
    args: {
        organizationId: v.id("organizations"),
        // Branding
        logo_url: v.optional(v.string()),
        favicon_url: v.optional(v.string()),
        primary_color: v.optional(v.string()),
        secondary_color: v.optional(v.string()),
        accent_color: v.optional(v.string()),
        // Typography
        font_family: v.optional(v.string()),
        // Copy
        app_name: v.optional(v.string()),
        tagline: v.optional(v.string()),
        support_email: v.optional(v.string()),
        support_phone: v.optional(v.string()),
        website_url: v.optional(v.string()),
        // Feature flags (arbitrary JSON map)
        features: v.optional(v.any()),
        // Advanced
        custom_css: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx);

        // Confirm org exists
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Organization not found");

        const now = new Date().toISOString();

        // Build the payload (exclude organizationId from spread)
        const { organizationId, ...rest } = args;

        const existing = await ctx.db
            .query("white_label_settings")
            .withIndex("by_organization", (q: any) =>
                q.eq("organization_id", organizationId)
            )
            .first();

        if (existing) {
            // Patch — only update fields that were explicitly provided
            const patch: Record<string, any> = {
                updated_by: admin.email,
                updated_date: now,
            };
            for (const [key, val] of Object.entries(rest)) {
                if (val !== undefined) patch[key] = val;
            }
            await ctx.db.patch(existing._id, patch);
            return { success: true, settingsId: existing._id, action: "updated" };
        } else {
            // Insert
            const settingsId = await ctx.db.insert("white_label_settings", {
                organization_id: organizationId,
                ...rest,
                updated_by: admin.email,
                updated_date: now,
            });
            return { success: true, settingsId, action: "created" };
        }
    },
});
