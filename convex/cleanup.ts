import { v } from "convex/values"
import { mutation } from "./_generated/server"
import { assertAdmin } from "./auth"

export const fixUnderscoreFields = mutation({
  args: { userEmail: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.userEmail)
    const allUsers = await ctx.db.query("users").collect()
    for (const user of allUsers) {
      const patch: Record<string, undefined> = {}
      const doc = user as Record<string, unknown>
      for (const key of Object.keys(doc)) {
        if (key.startsWith("_") && key !== "_id" && key !== "_creationTime") {
          patch[key] = undefined
        }
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch as any)
      }
    }
    return { fixed: allUsers.length }
  },
})
