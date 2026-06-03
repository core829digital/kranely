import { v } from "convex/values"
import { query } from "./_generated/server"

export const searchNetwork = query({
  args: {
    accountType: v.optional(v.union(v.literal("manufacturer"), v.literal("reseller"))),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    materialsUsed: v.optional(v.array(v.string())),
    hardwareBrands: v.optional(v.array(v.string())),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let orgs
    if (args.accountType) {
      orgs = await ctx.db
        .query("organizations")
        .withIndex("by_accountType", (q) => q.eq("accountType", args.accountType!))
        .collect()
    } else {
      orgs = await ctx.db.query("organizations").collect()
    }

    let results = orgs.filter((o) => o.onboardingCompleted)

    if (args.country) {
      results = results.filter((o) => o.country === args.country)
    }

    if (args.city) {
      const c = args.city.toLowerCase()
      results = results.filter((o) => o.city?.toLowerCase().includes(c))
    }

    if (args.specializations && args.specializations.length > 0) {
      results = results.filter((o) =>
        o.specializations?.some((s) => args.specializations!.includes(s))
      )
    }

    if (args.materialsUsed && args.materialsUsed.length > 0) {
      results = results.filter((o) =>
        o.materialsUsed?.some((m) => args.materialsUsed!.includes(m))
      )
    }

    if (args.hardwareBrands && args.hardwareBrands.length > 0) {
      results = results.filter((o) =>
        o.hardwareBrands?.some((h) => args.hardwareBrands!.includes(h))
      )
    }

    if (args.searchQuery) {
      const q = args.searchQuery.toLowerCase()
      results = results.filter(
        (o) =>
          (o.companyName || o.name).toLowerCase().includes(q) ||
          o.profileDescription?.toLowerCase().includes(q)
      )
    }

    return results.sort((a, b) => b._creationTime - a._creationTime).map((o) => ({
      _id: o._id,
      accountType: o.accountType,
      companyName: o.companyName || o.name,
      country: o.country,
      city: o.city,
      specializations: o.specializations,
      materialsUsed: o.materialsUsed,
      hardwareBrands: o.hardwareBrands,
      profileDescription: o.profileDescription,
      website: o.website,
      logo: o.logo,
      contactPhone: o.contactPhone,
      employeeCount: o.employeeCount,
      metrics: o.metrics,
      _creationTime: o._creationTime,
    }))
  },
})
