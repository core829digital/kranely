import { query } from "./_generated/server";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Admin/superadmin see all channels
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (user?.role === "admin" || user?.role === "superadmin") {
            return await ctx.db.query("chat_channels").collect();
        }

        // Others see only channels they are a member of
        const all = await ctx.db.query("chat_channels").collect();
        return all.filter((ch) => Array.isArray(ch.members) && ch.members.includes(identity.email!));
    },
});
