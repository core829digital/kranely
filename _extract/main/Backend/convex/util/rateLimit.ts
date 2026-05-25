import { MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";

export const RATE_LIMITS = {
    SEND_MESSAGE: { limit: 10, window: 60 * 1000 }, // 10 messages per minute
    UPLOAD_FILE: { limit: 5, window: 60 * 1000 }, // 5 uploads per minute
    CREATE_QUOTE_REQUEST: { limit: 3, window: 60 * 60 * 1000 }, // 3 quote requests per hour
    APPLY_REFERRAL: { limit: 5, window: 60 * 60 * 1000 }, // 5 attempts per hour
};

/**
 * Checks if a user has exceeded the rate limit for a specific action.
 * Throws a ConvexError if the limit is exceeded.
 * 
 * @param ctx Mutation context
 * @param actionIdentifier Key for the action (e.g., "send_message")
 * @param userIdentifier Key for the user (e.g., user ID or email)
 * @param config Rate limit configuration { limit, window }
 */
export async function checkRateLimit(
    ctx: MutationCtx,
    actionIdentifier: string,
    userIdentifier: string,
    config: { limit: number; window: number }
) {
    const key = `${actionIdentifier}:${userIdentifier}`;
    const now = Date.now();

    const record = await ctx.db
        .query("rate_limits")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

    if (record) {
        if (now < record.window_start + config.window) {
            if (record.count >= config.limit) {
                throw new ConvexError(
                    `Too many requests. Please try again later.`
                );
            }

            await ctx.db.patch(record._id, {
                count: record.count + 1,
            });
        } else {
            // Window expired, reset
            await ctx.db.patch(record._id, {
                count: 1,
                window_start: now,
            });
        }
    } else {
        // New record
        await ctx.db.insert("rate_limits", {
            key,
            count: 1,
            window_start: now,
        });
    }
}
