import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { assertOrgAccess } from "./auth"

const UNITS = ["pz", "m", "kg", "lt", "conf", "rotolo", "foglio", "barra", "scatola", "set"]

// ─── CATEGORIES ───

export const listCategories = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    return ctx.db
      .query("warehouseCategories")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()
  },
})

export const createCategory = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    return ctx.db.insert("warehouseCategories", {
      organizationId: args.organizationId,
      name: args.name,
      description: args.description,
    })
  },
})

export const updateCategory = mutation({
  args: {
    id: v.id("warehouseCategories"),
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const patch: Record<string, any> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.description !== undefined) patch.description = args.description
    await ctx.db.patch(args.id, patch)
  },
})

export const removeCategory = mutation({
  args: {
    id: v.id("warehouseCategories"),
    organizationId: v.id("organizations"),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    await ctx.db.delete(args.id)
  },
})

// ─── ITEMS ───

export const listItems = query({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    categoryId: v.optional(v.id("warehouseCategories")),
    searchQuery: v.optional(v.string()),
    lowStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let items = await ctx.db
      .query("warehouseItems")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    if (args.categoryId) {
      items = items.filter((i) => i.categoryId === args.categoryId)
    }
    if (args.lowStock) {
      items = items.filter((i) => i.minStock != null && i.quantity <= i.minStock!)
    }
    if (args.searchQuery) {
      const q = args.searchQuery.toLowerCase()
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      )
    }

    return items.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export const getItem = query({
  args: {
    id: v.id("warehouseItems"),
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    return ctx.db.get(args.id)
  },
})

export const createItem = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    name: v.string(),
    sku: v.optional(v.string()),
    categoryId: v.optional(v.id("warehouseCategories")),
    quantity: v.number(),
    unit: v.string(),
    minStock: v.optional(v.number()),
    price: v.optional(v.number()),
    description: v.optional(v.string()),
    supplier: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    if (!UNITS.includes(args.unit)) throw new Error("Unità di misura non valida")
    return ctx.db.insert("warehouseItems", {
      organizationId: args.organizationId,
      name: args.name,
      sku: args.sku,
      categoryId: args.categoryId,
      quantity: args.quantity,
      unit: args.unit,
      minStock: args.minStock,
      price: args.price,
      description: args.description,
      supplier: args.supplier,
      image: args.image,
    })
  },
})

export const updateItem = mutation({
  args: {
    id: v.id("warehouseItems"),
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    categoryId: v.optional(v.id("warehouseCategories")),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    minStock: v.optional(v.number()),
    price: v.optional(v.number()),
    description: v.optional(v.string()),
    supplier: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const patch: Record<string, any> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.sku !== undefined) patch.sku = args.sku
    if (args.categoryId !== undefined) patch.categoryId = args.categoryId
    if (args.quantity !== undefined) patch.quantity = args.quantity
    if (args.unit !== undefined) {
      if (!UNITS.includes(args.unit)) throw new Error("Unità di misura non valida")
      patch.unit = args.unit
    }
    if (args.minStock !== undefined) patch.minStock = args.minStock
    if (args.price !== undefined) patch.price = args.price
    if (args.description !== undefined) patch.description = args.description
    if (args.supplier !== undefined) patch.supplier = args.supplier
    if (args.image !== undefined) patch.image = args.image
    await ctx.db.patch(args.id, patch)
  },
})

export const removeItem = mutation({
  args: {
    id: v.id("warehouseItems"),
    organizationId: v.id("organizations"),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    await ctx.db.delete(args.id)
  },
})

// ─── STOCK MOVEMENTS ───

export const listMovements = query({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.optional(v.string()),
    itemId: v.optional(v.id("warehouseItems")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    let movements
    if (args.itemId) {
      movements = await ctx.db
        .query("stockMovements")
        .withIndex("by_item", (q) => q.eq("itemId", args.itemId!))
        .order("desc")
        .collect()
    } else {
      movements = await ctx.db
        .query("stockMovements")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .order("desc")
        .collect()
    }
    if (args.limit) movements = movements.slice(0, args.limit)
    return movements
  },
})

export const addStock = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    itemId: v.id("warehouseItems"),
    quantity: v.number(),
    note: v.optional(v.string()),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error("Articolo non trovato")
    if (args.quantity <= 0) throw new Error("La quantità deve essere positiva")

    await ctx.db.patch(args.itemId, { quantity: item.quantity + args.quantity })

    return ctx.db.insert("stockMovements", {
      organizationId: args.organizationId,
      itemId: args.itemId,
      type: "in",
      quantity: args.quantity,
      note: args.note,
      reference: args.reference,
      createdBy: args.userEmail,
      createdAt: Date.now(),
    })
  },
})

export const removeStock = mutation({
  args: {
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    itemId: v.id("warehouseItems"),
    quantity: v.number(),
    note: v.optional(v.string()),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error("Articolo non trovato")
    if (args.quantity <= 0) throw new Error("La quantità deve essere positiva")
    if (item.quantity < args.quantity) throw new Error("Stock insufficiente")

    await ctx.db.patch(args.itemId, { quantity: item.quantity - args.quantity })

    return ctx.db.insert("stockMovements", {
      organizationId: args.organizationId,
      itemId: args.itemId,
      type: "out",
      quantity: args.quantity,
      note: args.note,
      reference: args.reference,
      createdBy: args.userEmail,
      createdAt: Date.now(),
    })
  },
})

// ─── STATS ───

export const getStats = query({
  args: { organizationId: v.id("organizations"), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const items = await ctx.db
      .query("warehouseItems")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    const totalItems = items.length
    const totalStock = items.reduce((sum, i) => sum + i.quantity, 0)
    const lowStock = items.filter((i) => i.minStock != null && i.quantity <= i.minStock!)
    const estimatedValue = items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0)

    return { totalItems, totalStock, lowStockCount: lowStock.length, estimatedValue }
  },
})

// ─── EXPORT ───

export { UNITS }
