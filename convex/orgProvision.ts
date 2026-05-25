import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getOrCreateDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("organizations").first()
    if (existing) return existing._id

    const id = await ctx.db.insert("organizations", {
      name: "Kranely Demo",
      slug: "kranely-demo",
      ownerEmail: "admin@kranely.app",
      plan: "free",
      status: "trial",
    })
    return id
  },
})

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").first()
  },
})
