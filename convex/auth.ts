import { v } from "convex/values"
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server"
import { internal } from "./_generated/api"
import { Id } from "./_generated/dataModel"

const SALT_LENGTH = 16
const ITERATIONS = 100000
const KEY_LENGTH = 64
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH * 8
  )
  const hashArray = new Uint8Array(bits)
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("")
  const hashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("")
  return `pbkdf2:${ITERATIONS}:${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored || stored === "imported") return false
  if (!stored.startsWith("pbkdf2:")) {
    const parts = stored.split(":")
    if (parts.length === 2 || parts.length === 3) {
      return stored === `legacy:${password}`
    }
    return false
  }
  const [, iterationsStr, saltHex, hashHex] = stored.split(":")
  const iterations = parseInt(iterationsStr, 10)
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH * 8
  )
  const newHash = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("")
  return newHash === hashHex
}

async function migrateLegacyPassword(password: string, oldHash: string): Promise<string | null> {
  if (oldHash && oldHash.startsWith("h_")) {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    const legacyHash = "h_" + Math.abs(hash).toString(36)
    if (oldHash === legacyHash) {
      return await hashPassword(password)
    }
  }
  return null
}

export const getCurrentUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
      .first()
    return user
  },
})

export const getUserRole = query({
  args: { email: v.string(), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.email, args.organizationId)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
      .first()

    if (!user) return { role: "client" as const, isSupplier: false, isAdmin: false, isCollaborator: false, isDriver: false, isClient: true, userId: undefined, organizationId: undefined, subrole: undefined, blocked: false }

    return {
      role: user.role,
      isSupplier: user.role === "supplier",
      isAdmin: user.role === "admin" || user.role === "superadmin",
      isCollaborator: user.role === "collaborator",
      isClient: user.role === "client",
      isDriver: user.role === "driver",
      subrole: user.subrole || null,
      blocked: user.blocked || false,
      userId: user._id,
      fullName: user.fullName,
      organizationId: user.organizationId,
    }
  },
})

export const register = mutation({
   args: {
     email: v.string(),
     password: v.string(),
     fullName: v.string(),
     role: v.union(v.literal("supplier"), v.literal("collaborator"), v.literal("client"), v.literal("driver")),
     subrole: v.optional(v.union(v.literal("serramenti"), v.literal("edilizia"), v.literal("generale"), v.literal("factory"), v.literal("office"), v.literal("construction"))),
     organizationId: v.optional(v.id("organizations")),
     phone: v.optional(v.string()),
     microRole: v.optional(v.union(
       v.literal("manufacturer"), 
       v.literal("reseller"), 
       v.literal("factory_manager"), 
       v.literal("procurement_specialist"), 
       v.literal("quality_control"), 
       v.literal("logistics_coordinator")
     )),
   },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim()
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first()

    if (existing) throw new Error("Email già registrata")
    if (args.password.length < 8) throw new Error("Password troppo corta (min 8 caratteri)")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) throw new Error("Email non valida")

    const passwordHash = await hashPassword(args.password)

    let orgId = args.organizationId
    if (!orgId) {
      const slug = "org-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6)
      orgId = await ctx.db.insert("organizations", {
        name: args.fullName + "'s Organization",
        slug,
        ownerEmail: normalizedEmail,
        plan: "free",
        status: "active",
      })
    }

     const id = await ctx.db.insert("users", {
       email: normalizedEmail,
       fullName: args.fullName,
       role: args.role,
       subrole: args.subrole,
       organizationId: orgId,
       phone: args.phone,
       passwordHash,
       microRole: args.microRole,
     })

    await ctx.scheduler.runAfter(0, internal.lib.helpers.logActivity, {
      organizationId: orgId,
      userEmail: args.email,
      action: "registered",
      entityType: "user",
      entityId: id,
      entityName: args.fullName,
      details: `Utente ${args.fullName} registrato come ${args.role}`,
    })

     if (args.role === "client") {
       await ctx.db.insert("clients", {
         organizationId: orgId,
         fullName: args.fullName,
         email: normalizedEmail,
         phone: args.phone,
         status: "lead",
         clientType: "b2c", // Default to B2C for individual registrations
       })
     }

    const org = await ctx.db.get(orgId)
    await ctx.scheduler.runAfter(0, internal.email.sendOnboarding, {
      email: args.email,
      fullName: args.fullName,
      organizationName: org?.name || "Kranely",
    })

    return { userId: id, organizationId: orgId }
  },
})

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim()
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first()

    if (!user) throw new Error("Utente non trovato")
    if (user.blocked) throw new Error("Utente bloccato")

    const lastAttempt = user.lastLoginAttempt ?? 0
    const attempts = user.failedAttempts ?? 0
    const lockoutPeriod = LOCKOUT_MINUTES * 60 * 1000

    if (attempts >= MAX_LOGIN_ATTEMPTS && Date.now() - lastAttempt < lockoutPeriod) {
      const remaining = Math.ceil((lockoutPeriod - (Date.now() - lastAttempt)) / 60000)
      throw new Error(`Troppi tentativi. Riprova tra ${remaining} minuti`)
    }

    let valid = false
    const stored = user.passwordHash || ""

    if (stored.startsWith("pbkdf2:")) {
      valid = await verifyPassword(args.password, stored)
    } else if (stored.startsWith("h_")) {
      const migrated = await migrateLegacyPassword(args.password, stored)
      if (migrated) {
        await ctx.db.patch(user._id, { passwordHash: migrated })
        valid = true
      }
    } else {
      valid = stored === `legacy:${args.password}`
    }

    if (!valid) {
      await ctx.db.patch(user._id, {
        failedAttempts: attempts + 1,
        lastLoginAttempt: Date.now(),
      })
      throw new Error("Password errata")
    }

    await ctx.db.patch(user._id, { failedAttempts: 0, lastLoginAttempt: undefined })

    const org = user.organizationId ? await ctx.db.get(user.organizationId) : null

    return {
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      subrole: user.subrole,
      organizationId: user.organizationId,
      _id: user._id,
      onboardingCompleted: org?.onboardingCompleted ?? user.onboardingCompleted ?? true,
      accountType: org?.accountType ?? null,
    }
  },
})

export const registerCompany = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    phone: v.optional(v.string()),
    accountType: v.union(v.literal("manufacturer"), v.literal("reseller")),
    companyName: v.string(),
    vatNumber: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
    suppliers: v.optional(v.array(v.string())),
    specializations: v.optional(v.array(v.string())),
    materialsUsed: v.optional(v.array(v.string())),
    hardwareBrands: v.optional(v.array(v.string())),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    profileDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim()

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first()
    if (existing) throw new Error("Email già registrata")
    if (args.password.length < 8) throw new Error("Password troppo corta (min 8 caratteri)")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) throw new Error("Email non valida")

    const passwordHash = await hashPassword(args.password)

    const slug = "org-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6)
    const orgId = await ctx.db.insert("organizations", {
      name: args.companyName,
      slug,
      ownerEmail: normalizedEmail,
      accountType: args.accountType,
      companyName: args.companyName,
      vatNumber: args.vatNumber,
      employeeCount: args.employeeCount,
      suppliers: args.suppliers,
      country: args.country,
      city: args.city,
      address: args.address,
      specializations: args.specializations,
      materialsUsed: args.materialsUsed,
      hardwareBrands: args.hardwareBrands,
      profileDescription: args.profileDescription,
      website: args.website,
      contactPhone: args.contactPhone,
      onboardingCompleted: true,
      plan: "free",
      status: "active",
    })

    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      fullName: args.fullName,
      role: "admin",
      organizationId: orgId,
      phone: args.phone,
      passwordHash,
      onboardingCompleted: true,
    })

    await ctx.scheduler.runAfter(0, internal.lib.helpers.logActivity, {
      organizationId: orgId,
      userEmail: args.email,
      action: "registered_company",
      entityType: "user",
      entityId: userId,
      entityName: args.fullName,
      details: `Azienda ${args.companyName} registrata come ${args.accountType === "manufacturer" ? "Fabbricante" : "Rivenditore"}`,
    })

    return { userId, organizationId: orgId, accountType: args.accountType }
  },
})

export const updatePassword = mutation({
  args: { email: v.string(), oldPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim()
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first()

    if (!user) throw new Error("Utente non trovato")
    if (args.newPassword.length < 8) throw new Error("Nuova password troppo corta (min 8 caratteri)")

    const stored = user.passwordHash || ""
    let valid = false
    if (stored.startsWith("pbkdf2:")) {
      valid = await verifyPassword(args.oldPassword, stored)
    } else if (stored.startsWith("h_")) {
      valid = !!(await migrateLegacyPassword(args.oldPassword, stored))
    } else {
      valid = stored === `legacy:${args.oldPassword}`
    }

    if (!valid) throw new Error("Password attuale errata")

    const newHash = await hashPassword(args.newPassword)
    await ctx.db.patch(user._id, { passwordHash: newHash })
    return true
  },
})

export const requestPasswordReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim()
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first()

    if (!user) throw new Error("Email non trovata")

    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    const expires = Date.now() + 60 * 60 * 1000

    await ctx.db.patch(user._id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    })

    await ctx.scheduler.runAfter(0, internal.email.sendPasswordReset, {
      email: args.email,
      token,
    })

    return { success: true }
  },
})

export const resetPassword = mutation({
  args: { token: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) throw new Error("Password troppo corta (min 8 caratteri)")

    const target = await ctx.db
      .query("users")
      .withIndex("by_passwordResetToken", (q) => q.eq("passwordResetToken", args.token))
      .first()
    if (!target || !target.passwordResetExpires || target.passwordResetExpires < Date.now()) {
      throw new Error("Token non valido o scaduto")
    }

    const passwordHash = await hashPassword(args.newPassword)

    await ctx.db.patch(target._id, {
      passwordHash,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      failedAttempts: 0,
      lastLoginAttempt: undefined,
    })

    return true
  },
})

export const validateSession = query({
  args: { email: v.string(), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim()
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first()

    if (!user) return { valid: false, reason: "User not found" }
    if (user.blocked) return { valid: false, reason: "User blocked" }
    if (user.organizationId && user.organizationId !== args.organizationId) {
      return { valid: false, reason: "Wrong organization" }
    }

    return { valid: true, role: user.role, userId: user._id }
  },
})

export async function assertOrgAccess(
  ctx: MutationCtx | QueryCtx,
  userEmail: string | undefined,
  organizationId: Id<"organizations">,
): Promise<{ userId: Id<"users"> | undefined; role: string; fullName: string; email: string }> {
  if (!userEmail) return { userId: undefined, role: "anonymous", fullName: "anonymous", email: "" }
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", userEmail))
    .first()
  if (!user) return { userId: undefined, role: "anonymous", fullName: "anonymous", email: "" }
  if (user.blocked) return { userId: undefined, role: "blocked", fullName: user.email, email: user.email }
  if (user.organizationId && user.organizationId !== organizationId) return { userId: undefined, role: "anonymous", fullName: "anonymous", email: "" }
  return { userId: user._id, role: user.role, fullName: user.fullName || user.email, email: user.email }
}

export const ADMIN_EMAIL = "contact.core829@gmail.com"

export function assertAdmin(email: string | null | undefined): void {
  if (!email || email.toLowerCase().trim() !== ADMIN_EMAIL) {
    throw new Error("Accesso negato — solo l'amministratore può eseguire questa operazione")
  }
}

export async function assertAdminAsync(
   ctx: QueryCtx | MutationCtx,
   email: string | null | undefined,
): Promise<void> {
   assertAdmin(email)
   if (!email) return
   const user = await ctx.db
     .query("users")
     .withIndex("by_email", (q: any) => q.eq("email", email.toLowerCase().trim()))
     .first()
   if (user && user.role !== "superadmin" && user.role !== "admin") {
     throw new Error("Accesso negato — ruolo non autorizzato")
   }
}

// MICRO-ROLE MANAGEMENT
export const getUserMicroRole = query({
   args: { email: v.string() },
   handler: async (ctx, args) => {
     const user = await ctx.db
       .query("users")
       .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
       .first()
     
     if (!user) {
       throw new Error("Utente non trovato")
     }
     
     return { microRole: user.microRole ?? null }
   },
})

export const assignMicroRole = mutation({
   args: { 
     email: v.string(), 
     microRole: v.union(
       v.literal("manufacturer"), 
       v.literal("reseller"), 
       v.literal("factory_manager"), 
       v.literal("procurement_specialist"), 
       v.literal("quality_control"), 
       v.literal("logistics_coordinator")
     )
   },
   handler: async (ctx, args) => {
     // Only superadmin can assign micro-roles
     assertAdmin(args.email.toLowerCase().trim())
     
     const user = await ctx.db
       .query("users")
       .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
       .first()
     
     if (!user) {
       throw new Error("Utente non trovato")
     }
     
     await ctx.db.patch(user._id, { microRole: args.microRole })
     
     await ctx.scheduler.runAfter(0, internal.lib.helpers.logActivity, {
       organizationId: user.organizationId!,
       userEmail: args.email,
       action: "micro_role_assigned",
       entityType: "user",
       entityId: user._id,
       entityName: user.fullName,
       details: `Micro-ruolo assegnato: ${args.microRole}`,
     })
     
     return { success: true }
   },
})

export const removeMicroRole = mutation({
   args: { email: v.string() },
   handler: async (ctx, args) => {
     // Only superadmin can remove micro-roles
     assertAdmin(args.email.toLowerCase().trim())
     
     const user = await ctx.db
       .query("users")
       .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
       .first()
     
     if (!user) {
       throw new Error("Utente non trovato")
     }
     
     await ctx.db.patch(user._id, { microRole: undefined })
     
     await ctx.scheduler.runAfter(0, internal.lib.helpers.logActivity, {
       organizationId: user.organizationId!,
       userEmail: args.email,
       action: "micro_role_removed",
       entityType: "user",
       entityId: user._id,
       entityName: user.fullName,
       details: "Micro-ruolo rimosso",
     })
     
     return { success: true }
   },
})

// SUPERADMIN USER MANAGEMENT
export const banUser = mutation({
   args: { email: v.string(), reason: v.optional(v.string()) },
   handler: async (ctx, args) => {
     // Only superadmin can ban users
     assertAdmin(args.email.toLowerCase().trim())
     
     const user = await ctx.db
       .query("users")
       .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
       .first()
     
     if (!user) {
       throw new Error("Utente non trovato")
     }
     
     // Prevent banning superadmins
     if (user.role === "superadmin") {
       throw new Error("Non è possibile bannare un superadmin")
     }
     
      await ctx.db.patch(user._id, { 
        blocked: true,
        banReason: args.reason ?? "Nessuna ragione specificata",
        bannedAt: Date.now(),
        bannedBy: args.email
      })
     
     await ctx.scheduler.runAfter(0, internal.lib.helpers.logActivity, {
       organizationId: user.organizationId!,
       userEmail: args.email,
       action: "user_banned",
       entityType: "user",
       entityId: user._id,
       entityName: user.fullName,
       details: `Utente bannato. Ragione: ${args.reason ?? "Nessuna ragione specificata"}`,
     })
     
     return { success: true }
   },
})

export const unbanUser = mutation({
   args: { email: v.string() },
   handler: async (ctx, args) => {
     // Only superadmin can unban users
     assertAdmin(args.email.toLowerCase().trim())
     
     const user = await ctx.db
       .query("users")
       .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
       .first()
     
     if (!user) {
       throw new Error("Utente non trovato")
     }
     
     await ctx.db.patch(user._id, { 
       blocked: false,
       banReason: undefined,
       bannedAt: undefined,
       bannedBy: undefined
     })
     
     await ctx.scheduler.runAfter(0, internal.lib.helpers.logActivity, {
       organizationId: user.organizationId!,
       userEmail: args.email,
       action: "user_unbanned",
       entityType: "user",
       entityId: user._id,
       entityName: user.fullName,
       details: "Utente sbannato",
     })
     
     return { success: true }
   },
})

export const deleteUser = mutation({
   args: { email: v.string() },
   handler: async (ctx, args) => {
     // Only superadmin can delete users
     assertAdmin(args.email.toLowerCase().trim())
     
     const user = await ctx.db
       .query("users")
       .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
       .first()
     
     if (!user) {
       throw new Error("Utente non trovato")
     }
     
     // Prevent deleting superadmins
     if (user.role === "superadmin") {
       throw new Error("Non è possibile eliminare un superadmin")
     }
     
     const organizationId = user.organizationId
     
     // Delete user
     await ctx.db.delete(user._id)
     
     await ctx.scheduler.runAfter(0, internal.lib.helpers.logActivity, {
       organizationId: organizationId!,
       userEmail: args.email,
       action: "user_deleted",
       entityType: "user",
       entityId: user._id,
       entityName: user.fullName,
       details: "Utente eliminato definitivamente",
     })
     
     return { success: true }
   },
})

export const warnUser = mutation({
   args: { email: v.string(), reason: v.string() },
   handler: async (ctx, args) => {
     // Only superadmin can warn users
     assertAdmin(args.email.toLowerCase().trim())
     
     const user = await ctx.db
       .query("users")
       .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
       .first()
     
     if (!user) {
       throw new Error("Utente non trovato")
     }
     
      // Increment warning count or add to warnings array
      const warnings = user.warnings ?? []
      const newWarning = {
        id: crypto.randomUUID(),
        reason: args.reason,
        warnedAt: Date.now(),
        warnedBy: args.email
      }
     
     await ctx.db.patch(user._id, { 
       warnings: [...warnings, newWarning],
       lastWarnedAt: Date.now()
     })
     
     await ctx.scheduler.runAfter(0, internal.lib.helpers.logActivity, {
       organizationId: user.organizationId!,
       userEmail: args.email,
       action: "user_warned",
       entityType: "user",
       entityId: user._id,
       entityName: user.fullName,
       details: `Utente avvertito. Ragione: ${args.reason}`,
     })
     
     return { success: true }
   },
})
