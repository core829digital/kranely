import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const get = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("whiteLabelSettings")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first()
    return settings
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    appName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    customCss: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("whiteLabelSettings", {
      organizationId: args.organizationId,
      appName: args.appName,
      tagline: args.tagline,
      logoUrl: args.logoUrl,
      faviconUrl: args.faviconUrl,
      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,
      accentColor: args.accentColor,
      fontFamily: args.fontFamily,
      supportEmail: args.supportEmail,
      supportPhone: args.supportPhone,
      websiteUrl: args.websiteUrl,
      customCss: args.customCss,
    })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id("whiteLabelSettings"),
    appName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    customCss: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args
    await ctx.db.patch(id, data)
    return id
  },
})
