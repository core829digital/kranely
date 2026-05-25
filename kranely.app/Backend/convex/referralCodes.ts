import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkRateLimit, RATE_LIMITS } from "./util/rateLimit";

// ─── Admin Queries ────────────────────────────────────────────────────────────

/** List all referral codes — admin only */
export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
        if (!user || user.role !== "admin") throw new Error("Admin only");
        return await ctx.db.query("referral_codes").order("desc").collect();
    },
});

// ─── Admin Mutations ──────────────────────────────────────────────────────────

/** Create a new referral code — admin only */
export const create = mutation({
    args: {
        code: v.string(),
        description: v.optional(v.string()),
        discount_percent: v.number(),
        max_uses: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
        if (!user || user.role !== "admin") throw new Error("Admin only");

        // Check code uniqueness (case-insensitive stored as uppercase)
        const code = args.code.toUpperCase().trim();
        const existing = await ctx.db
            .query("referral_codes")
            .withIndex("by_code", (q) => q.eq("code", code))
            .unique();
        if (existing) throw new Error("Code already exists");

        return await ctx.db.insert("referral_codes", {
            code,
            description: args.description,
            discount_percent: args.discount_percent,
            is_active: true,
            max_uses: args.max_uses,
            uses_count: 0,
            created_by: user.email,
            created_date: new Date().toISOString(),
        });
    },
});

/** Toggle active/inactive — admin only */
export const toggleActive = mutation({
    args: { id: v.id("referral_codes") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
        if (!user || user.role !== "admin") throw new Error("Admin only");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Not found");
        await ctx.db.patch(args.id, { is_active: !record.is_active });
    },
});

/** Delete a referral code — admin only */
export const remove = mutation({
    args: { id: v.id("referral_codes") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
        if (!user || user.role !== "admin") throw new Error("Admin only");
        await ctx.db.delete(args.id);
    },
});

// ─── Client Queries / Mutations ───────────────────────────────────────────────

/** Validate a referral code — returns discount_percent if valid, null otherwise */
export const validate = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        const code = args.code.toUpperCase().trim();
        const record = await ctx.db
            .query("referral_codes")
            .withIndex("by_code", (q) => q.eq("code", code))
            .unique();
        if (!record || !record.is_active) return null;
        if (record.max_uses !== undefined && record.uses_count >= record.max_uses) return null;
        return { discount_percent: record.discount_percent, description: record.description };
    },
});

/** Apply a referral code to the authenticated user's profile */
export const apply = mutation({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Devi accedere per usare un codice referral");
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
        if (!user) throw new Error("Utente non trovato");

        // Rate limit: 5 attempts per hour to prevent code brute-forcing
        await checkRateLimit(ctx, "apply_referral", identity.email!, RATE_LIMITS.APPLY_REFERRAL);

        const code = args.code.toUpperCase().trim();
        const record = await ctx.db
            .query("referral_codes")
            .withIndex("by_code", (q) => q.eq("code", code))
            .unique();
        if (!record || !record.is_active) throw new Error("Codice non valido o non attivo");
        if (record.max_uses !== undefined && record.uses_count >= record.max_uses)
            throw new Error("Codice esaurito");
        if (user.referral_code_applied)
            throw new Error("Hai già un codice referral applicato");

        // Apply discount to user
        await ctx.db.patch(user._id, {
            referral_code_applied: code,
            referral_discount_percent: record.discount_percent,
        });
        // Increment uses_count
        await ctx.db.patch(record._id, { uses_count: record.uses_count + 1 });

        return { discount_percent: record.discount_percent };
    },
});

/** Remove the applied referral code from the user's profile */
export const removeFromUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
        if (!user) throw new Error("Utente non trovato");
        await ctx.db.patch(user._id, {
            referral_code_applied: undefined,
            referral_discount_percent: undefined,
        });
    },
});
