import { v } from "convex/values"
import { mutation } from "./_generated/server"
import { internal } from "./_generated/api"
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
    clientId: v.optional(v.id("clients")),
    cantiereId: v.optional(v.id("cantieri")),
    quoteId: v.optional(v.id("quotes")),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { userEmail, organizationId, storageId, fileName, type, fileSize, description, clientId, cantiereId, quoteId } = args
    const url = await ctx.storage.getUrl(storageId)
    if (!url) throw new Error("URL non generabile")

    const existing = await ctx.db
      .query("documents")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .filter((q) => q.eq(q.field("fileUrl"), url))
      .first()

    if (existing) throw new Error("File già presente")

    const docId = await ctx.db.insert("documents", {
      organizationId,
      fileName,
      title: fileName,
      type: type as any,
      status: "final",
      fileUrl: url,
      storageId,
      fileSize,
      description,
      clientId,
      cantiereId,
      quoteId,
    })

    await ctx.db.insert("activityLog", {
      organizationId,
      userEmail: userEmail || "system",
      action: "uploaded",
      entityType: "document",
      entityId: docId,
      entityName: fileName,
      details: `File "${fileName}" caricato${clientId ? " per cliente" : ""}${cantiereId ? " per cantiere" : ""}${quoteId ? " per preventivo" : ""}`,
    })

    return docId
  },
})

export const deleteFile = mutation({
  args: { storageId: v.id("_storage"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    await ctx.storage.delete(args.storageId)
    return args.storageId
  },
})
