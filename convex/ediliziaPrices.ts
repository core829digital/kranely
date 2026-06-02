import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertOrgAccess } from "./auth"

export const get = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    if (!isAdmin) return null
    const doc = await ctx.db
      .query("ediliziaPrices")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first()
    return doc || null
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    pricePerMq: v.number(),
    multiplierNord: v.number(),
    multiplierCentro: v.number(),
    multiplierSud: v.number(),
    multiplierVilla: v.number(),
    multiplierCasale: v.number(),
    multiplierAppartamento: v.number(),
    multiplierMedia: v.number(),
    multiplierDegradato: v.number(),
    tramezzi20: v.number(),
    tramezzi50: v.number(),
    tramezzi100: v.number(),
    elettricoPiccole: v.number(),
    elettricoStandard: v.number(),
    elettricoDomotico: v.number(),
    riscaldamentoAdeguamento: v.number(),
    finitureAltaQualitaExtra: v.number(),
    controsoffittatureMq: v.number(),
    portaUnit: v.number(),
    finestraUnit: v.number(),
    parquetMq: v.number(),
    marmoMq: v.number(),
    monocotturaMq: v.number(),
    resinaMq: v.number(),
    bagnoUnit: v.number(),
    pitturaMq: v.number(),
    updatedById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { updatedById, ...rest } = args
    const existing = await ctx.db
      .query("ediliziaPrices")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { ...rest, updatedById })
      return existing._id
    }
    const id = await ctx.db.insert("ediliziaPrices", { ...rest, updatedById })
    return id
  },
})

export const update = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    pricePerMq: v.optional(v.number()),
    multiplierNord: v.optional(v.number()),
    multiplierCentro: v.optional(v.number()),
    multiplierSud: v.optional(v.number()),
    multiplierVilla: v.optional(v.number()),
    multiplierCasale: v.optional(v.number()),
    multiplierAppartamento: v.optional(v.number()),
    multiplierMedia: v.optional(v.number()),
    multiplierDegradato: v.optional(v.number()),
    tramezzi20: v.optional(v.number()),
    tramezzi50: v.optional(v.number()),
    tramezzi100: v.optional(v.number()),
    elettricoPiccole: v.optional(v.number()),
    elettricoStandard: v.optional(v.number()),
    elettricoDomotico: v.optional(v.number()),
    riscaldamentoAdeguamento: v.optional(v.number()),
    finitureAltaQualitaExtra: v.optional(v.number()),
    controsoffittatureMq: v.optional(v.number()),
    portaUnit: v.optional(v.number()),
    finestraUnit: v.optional(v.number()),
    parquetMq: v.optional(v.number()),
    marmoMq: v.optional(v.number()),
    monocotturaMq: v.optional(v.number()),
    resinaMq: v.optional(v.number()),
    bagnoUnit: v.optional(v.number()),
    pitturaMq: v.optional(v.number()),
    updatedById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const { organizationId, updatedById, ...data } = args
    const existing = await ctx.db
      .query("ediliziaPrices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .first()
    if (!existing) throw new Error("Edilizia prices not found")
    await ctx.db.patch(existing._id, { ...data, updatedById })
    return existing._id
  },
})

export const remove = mutation({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const existing = await ctx.db
      .query("ediliziaPrices")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first()
    if (!existing) throw new Error("Not found")
    await ctx.db.delete(existing._id)
    return existing._id
  },
})
