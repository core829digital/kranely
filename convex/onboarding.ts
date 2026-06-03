import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const getOnboardingState = query({
  args: { organizationId: v.id("organizations"), userEmail: v.string() },
  handler: async (ctx, args) => {
    const auth = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (auth.role !== "admin" && auth.role !== "superadmin") {
      return { needsOnboarding: false }
    }
    const org = await ctx.db.get(args.organizationId)
    if (!org) throw new Error("Organization not found")
    return {
      needsOnboarding: !org.onboardingCompleted,
      accountType: org.accountType,
      step: org.accountType ? 9 : (org.companyName ? 3 : 1),
      data: {
        companyName: org.companyName,
        vatNumber: org.vatNumber,
        employeeCount: org.employeeCount,
        country: org.country,
        city: org.city,
        address: org.address,
        specializations: org.specializations,
        materialsUsed: org.materialsUsed,
        hardwareBrands: org.hardwareBrands,
        profileDescription: org.profileDescription,
        website: org.website,
        logo: org.logo,
        contactPhone: org.contactPhone,
      },
    }
  },
})

export const saveOnboardingStep = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    stepData: v.object({
      accountType: v.optional(v.union(v.literal("manufacturer"), v.literal("reseller"))),
      companyName: v.optional(v.string()),
      vatNumber: v.optional(v.string()),
      employeeCount: v.optional(v.number()),
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      address: v.optional(v.string()),
      specializations: v.optional(v.array(v.string())),
      materialsUsed: v.optional(v.array(v.string())),
      hardwareBrands: v.optional(v.array(v.string())),
      profileDescription: v.optional(v.string()),
      website: v.optional(v.string()),
      logo: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const auth = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (auth.role !== "admin" && auth.role !== "superadmin") {
      throw new Error("Solo l'amministratore può completare l'onboarding")
    }
    const updateData: Record<string, any> = {}
    for (const [key, value] of Object.entries(args.stepData)) {
      if (value !== undefined) updateData[key] = value
    }
    await ctx.db.patch(args.organizationId, updateData)
    return true
  },
})

export const completeOnboarding = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    accountType: v.union(v.literal("manufacturer"), v.literal("reseller")),
    companyName: v.string(),
    vatNumber: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
    country: v.string(),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    materialsUsed: v.optional(v.array(v.string())),
    hardwareBrands: v.optional(v.array(v.string())),
    profileDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    logo: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (auth.role !== "admin" && auth.role !== "superadmin") {
      throw new Error("Solo l'amministratore può completare l'onboarding")
    }
    const org = await ctx.db.get(args.organizationId)
    if (!org) throw new Error("Organization not found")
    if (org.onboardingCompleted) throw new Error("Onboarding già completato")

    const userId = auth.userId
    if (userId) {
      await ctx.db.patch(userId, { onboardingCompleted: true })
    }

    await ctx.db.patch(args.organizationId, {
      accountType: args.accountType,
      onboardingCompleted: true,
      companyName: args.companyName,
      vatNumber: args.vatNumber,
      employeeCount: args.employeeCount,
      country: args.country,
      city: args.city,
      address: args.address,
      specializations: args.specializations,
      materialsUsed: args.materialsUsed,
      hardwareBrands: args.hardwareBrands,
      profileDescription: args.profileDescription,
      website: args.website,
      logo: args.logo,
      contactPhone: args.contactPhone,
      metrics: {
        completedOrders: 0,
        totalClients: 0,
        memberSince: org._creationTime,
      },
    })

    return true
  },
})

export const skipOnboardingForUser = mutation({
  args: { userId: v.id("users"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user || user.role !== "superadmin") throw new Error("Accesso negato")
    await ctx.db.patch(args.userId, { onboardingCompleted: true })
    return true
  },
})
