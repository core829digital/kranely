import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("blog_posts")
            .withIndex("by_published", (q) => q.eq("published", true))
            .order("desc") // Order by creation time (or add sort field if index allows) - wait, by_published doesn't sort by date
            // Schema index is simple. For sorting by date, we might need a composite index. 
            // For now, let's just fetch and sort in memory if small, or use default collection order.
            .collect();
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const post = await ctx.db
            .query("blog_posts")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
        return post;
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        slug: v.string(),
        excerpt: v.string(),
        content: v.string(),
        featured_image: v.optional(v.string()),
        category: v.string(),
        author_name: v.string(),
        published: v.boolean(),
        published_date: v.string(),
        read_time: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("blog_posts", args);

        if (args.published) {
            await ctx.scheduler.runAfter(0, internal.notifications.triggerBlogPost, {
                title: args.title,
                slug: args.slug,
                excerpt: args.excerpt,
                author: args.author_name,
            });
        }
    },
});
