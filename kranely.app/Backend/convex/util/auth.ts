import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Checks if the current user has Admin or SuperAdmin role.
 * Throws an error if not authorized.
 * Returns the user object if authorized.
 */
export async function checkAdmin(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();

    if (!user) throw new Error("User not found");

    if (user.role !== "admin" && user.role !== "superadmin") {
        throw new Error("Unauthorized: Requires Admin role");
    }

    return user;
}

/** @deprecated Use checkAdmin instead */
export const checkAdminOrCeo = checkAdmin;

/**
 * Checks if the current user is authenticated.
 * Returns the identity and user object.
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();

    if (!user) throw new Error("User not found");

    return { identity, user };
}
