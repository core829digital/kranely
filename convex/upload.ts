import { v } from "convex/values"
import { mutation } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl()
})

export const saveFile = mutation({
  args: {
    organizationId: v.id("organizations"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    type: v.string(),
    fileSize: v.number(),
    description: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { userEmail, organizationId, storageId, fileName, type, fileSize, description } = args
    const url = await ctx.storage.getUrl(storageId)
    if (!url) throw new Error("URL non generabile")

    const existing = await ctx.db
      .query("documents")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .filter((q) => q.eq(q.field("fileUrl"), url))
      .first()

    if (existing) throw new Error("File già presente")

    return await ctx.db.insert("documents", {
      organizationId,
      fileName,
      title: fileName,
      type: type as any,
      status: "final",
      fileUrl: url,
      storageId,
      fileSize,
      description,
    })
  },
})
