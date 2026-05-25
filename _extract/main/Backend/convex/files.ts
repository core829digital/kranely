import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkRateLimit, RATE_LIMITS } from "./util/rateLimit";

export const generateUploadUrl = mutation(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await checkRateLimit(ctx, "upload_file", identity.subject, RATE_LIMITS.UPLOAD_FILE);

    return await ctx.storage.generateUploadUrl();
});

// Get a proper URL for a stored file
export const getFileUrl = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        // Extract the storage ID from the URL if it's a full URL
        let storageId = args.storageId;

        if (storageId.startsWith('http')) {
            // If it's a full URL like "https://xxx.convex.cloud/api/storage/xxx", extract the ID
            if (storageId.includes('/api/storage/')) {
                storageId = storageId.split('/api/storage/')[1];
            } else {
                // It's already a full resolved URL, return as is
                return storageId;
            }
        }

        try {
            const url = await ctx.storage.getUrl(storageId);
            return url;
        } catch (error) {
            console.error("Error getting file URL:", error);
            return null;
        }
    },
});
