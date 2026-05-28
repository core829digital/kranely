import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const listPublished = query({
  args: { organizationId: v.optional(v.id("organizations")), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.organizationId) {
      const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
      const items = await ctx.db
        .query("blogPosts")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId!))
        .filter((q) => q.eq(q.field("published"), true))
        .collect()
      return items.sort((a, b) => b._creationTime - a._creationTime)
    }
    const items = await ctx.db.query("blogPosts").collect()
    const filtered = items.filter((p) => p.published)
    return filtered.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const list = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
      .then((items) => items.sort((a, b) => b._creationTime - a._creationTime))
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()
    return post ?? null
  },
})

export const get = query({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    featuredImage: v.optional(v.string()),
    category: v.string(),
    authorName: v.string(),
    readTime: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { organizationId, userEmail, ...rest } = args
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()
    if (existing) throw new Error("Slug già in uso")
    return await ctx.db.insert("blogPosts", {
      ...rest,
      organizationId,
      published: false,
      publishedDate: undefined,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("blogPosts"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    category: v.optional(v.string()),
    authorName: v.optional(v.string()),
    readTime: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { id, organizationId, userEmail, ...data } = args
    const prev = await ctx.db.get(id)
    if (!prev || prev.organizationId !== organizationId) throw new Error("Not found")
    await ctx.db.patch(id, data)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: prev.organizationId,
        userEmail: userEmail || "system",
        action: "updated",
        entityType: "blogPost",
        entityId: id,
        entityName: prev.title,
        details: `Articolo blog "${prev.title}" aggiornato`,
      })
    }

    return id
  },
})

export const publish = mutation({
  args: { id: v.id("blogPosts"), published: v.boolean(), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const prev = await ctx.db.get(args.id)
    if (!prev || prev.organizationId !== args.organizationId) throw new Error("Not found")
    const patch: { published: boolean; publishedDate?: string } = {
      published: args.published,
    }
    if (args.published) {
      patch.publishedDate = new Date().toISOString()
    }
    await ctx.db.patch(args.id, patch)
    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: args.userEmail || "system",
      action: args.published ? "published" : "unpublished",
      entityType: "blogPost",
      entityId: args.id,
      entityName: prev.title,
      details: `Articolo blog "${prev.title}" ${args.published ? "pubblicato" : "ritirato"}`,
    })
    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id("blogPosts"), organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const prev = await ctx.db.get(args.id)
    if (!prev || prev.organizationId !== args.organizationId) throw new Error("Not found")
    await ctx.db.delete(args.id)

    if (prev) {
      await ctx.db.insert("activityLog", {
        organizationId: args.organizationId,
        userEmail: args.userEmail || "system",
        action: "deleted",
        entityType: "blogPost",
        entityId: args.id,
        entityName: prev.title,
        details: `Articolo blog "${prev.title}" rimosso`,
      })
    }
  },
})
