import { query } from "./_generated/server";
import { getCallerInfo } from "./rbac";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getCallerInfo(ctx);
    // Return null silently when unauthenticated or not admin — avoids Server Error on reconnect
    if (!caller || (caller.role !== "admin" )) {
      return null;
    }

    const documents = await ctx.db.query("documents").collect();

    const totalBytes = documents
      .reduce((sum, doc) => sum + (doc.file_size ?? 0), 0);

    const limitBytes = 1 * 1024 * 1024 * 1024; // 1 GB

    return {
      totalBytes,
      totalGB: totalBytes / (1024 * 1024 * 1024),
      limitGB: 1,
      percentage: Math.min((totalBytes / limitBytes) * 100, 100),
    };
  },
});
