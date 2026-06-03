import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // ═══════════════════════════════════════════════════════
  // MULTI-TENANT / WHITE-LABEL
  // ═══════════════════════════════════════════════════════

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerEmail: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("trial"), v.literal("cancelled")),
    domain: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
    // Onboarding / Account Type
    accountType: v.optional(v.union(v.literal("manufacturer"), v.literal("reseller"))),
    onboardingCompleted: v.optional(v.boolean()),
    // Company profile (public)
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
    metrics: v.optional(v.object({
      completedOrders: v.number(),
      totalClients: v.number(),
      memberSince: v.number(),
    })),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerEmail"])
    .index("by_status", ["status"])
    .index("by_accountType", ["accountType"])
    .index("by_country_accountType", ["country", "accountType"]),

  whiteLabelSettings: defineTable({
    organizationId: v.id("organizations"),
    logoUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    appName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    features: v.optional(v.any()),
    customCss: v.optional(v.string()),
    updatedById: v.optional(v.id("users")),
  })
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // USERS & AUTH
  // ═══════════════════════════════════════════════════════

  users: defineTable({
    email: v.string(),
    fullName: v.optional(v.string()),
    role: v.union(v.literal("superadmin"), v.literal("admin"), v.literal("supplier"), v.literal("driver"), v.literal("collaborator"), v.literal("client")),
    subrole: v.optional(v.union(v.literal("serramenti"), v.literal("edilizia"), v.literal("generale"), v.literal("factory"), v.literal("office"), v.literal("construction"))),
    organizationId: v.optional(v.id("organizations")),
    isCompany: v.optional(v.boolean()),
    companyRole: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    phone: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    workSector: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    blocked: v.optional(v.boolean()),
    blockedReason: v.optional(v.string()),
    referralCodeApplied: v.optional(v.id("referralCodes")),
    referralDiscountPercent: v.optional(v.number()),
    failedAttempts: v.optional(v.number()),
    lastLoginAttempt: v.optional(v.number()),
    passwordResetToken: v.optional(v.string()),
    passwordResetExpires: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_organization", ["organizationId"])
    .index("by_passwordResetToken", ["passwordResetToken"]),

  // ═══════════════════════════════════════════════════════
  // CLIENTS
  // ═══════════════════════════════════════════════════════

  clients: defineTable({
    organizationId: v.id("organizations"),
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    fiscalCode: v.optional(v.string()),
    companyName: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(v.literal("lead"), v.literal("active"), v.literal("archived")),
    clientType: v.union(v.literal("b2b"), v.literal("b2c")),
    vatNumber: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // APPOINTMENTS
  // ═══════════════════════════════════════════════════════

  appointments: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    email: v.string(),
    appointmentDate: v.string(),
    appointmentTime: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(v.literal("scheduled"), v.literal("confirmed"), v.literal("completed"), v.literal("cancelled"), v.literal("no_show")),
    clientId: v.optional(v.id("clients")),
    cantiereId: v.optional(v.id("cantieri")),
    collaboratorId: v.optional(v.id("collaborators")),
  })
    .index("by_email", ["email"])
    .index("by_date", ["appointmentDate"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // CANTIERI (Projects)
  // ═══════════════════════════════════════════════════════

  cantieri: defineTable({
    organizationId: v.id("organizations"),
    clientId: v.optional(v.id("clients")),
    name: v.string(),
    address: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.union(v.literal("pianificato"), v.literal("in_corso"), v.literal("completato"), v.literal("sospeso")),
    description: v.optional(v.string()),
    quoteId: v.optional(v.id("quotes")),
    totalBudget: v.optional(v.number()),
    progressPercentage: v.optional(v.number()),
    managerId: v.optional(v.id("users")),
    companyEmail: v.optional(v.string()),
    teamAssegnato: v.optional(v.string()),
    documentiCollegati: v.optional(v.array(v.string())),
    createdById: v.optional(v.id("users")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  phaseTasks: defineTable({
    organizationId: v.id("organizations"),
    cantiereId: v.id("cantieri"),
    phase: v.union(v.literal("in_lavorazione"), v.literal("posa_in_opera"), v.literal("completato")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("da_fare"), v.literal("in_corso"), v.literal("completato")),
    assignedTo: v.optional(v.string()),
    priority: v.union(v.literal("alta"), v.literal("media"), v.literal("bassa")),
    dueDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
  })
    .index("by_cantiere", ["cantiereId"])
    .index("by_phase", ["cantiereId", "phase"])
    .index("by_assigned", ["assignedTo"])
    .index("by_organization", ["organizationId"]),

  companyTeams: defineTable({
    organizationId: v.id("organizations"),
    companyEmail: v.string(),
    teamName: v.string(),
    companyName: v.optional(v.string()),
    members: v.optional(v.array(v.string())),
    createdById: v.optional(v.id("users")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_company", ["companyEmail"]),

  // ═══════════════════════════════════════════════════════
  // QUOTES (Preventivi)
  // ═══════════════════════════════════════════════════════

  quotes: defineTable({
    organizationId: v.id("organizations"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("accepted"), v.literal("rejected"), v.literal("scaduto"), v.literal("in_lavorazione"), v.literal("ordine_confermato"), v.literal("in_consegna"), v.literal("completato")),
    quoteType: v.string(),
    estimatedPrice: v.optional(v.number()),
    files: v.optional(v.array(v.string())),
    windowConfig: v.optional(v.any()),
    projectConfig: v.optional(v.any()),
    ediliziaConfig: v.optional(v.any()),
    clientId: v.optional(v.id("clients")),
    cantiereId: v.optional(v.id("cantieri")),
    clientQuoteExpiresAt: v.optional(v.string()),
    validUntil: v.optional(v.string()),
    clientQuoteExpiresDays: v.optional(v.number()),
    expiryNotified24h: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
    accontoPercentage: v.optional(v.number()),
    paymentPlan: v.optional(v.any()),
    clientSelectedVersionDocId: v.optional(v.id("documents")),
    requestTitle: v.optional(v.string()),
    materialCategory: v.optional(v.string()),
    attachmentPhotos: v.optional(v.array(v.string())),
  })
    .index("by_status", ["status"])
    .index("by_type", ["quoteType"])
    .index("by_email", ["email"])
    .index("by_client", ["clientId"])
    .index("by_organization", ["organizationId"]),

  quotePolls: defineTable({
    organizationId: v.id("organizations"),
    conversationId: v.string(),
    quoteId: v.optional(v.id("quotes")),
    documentId: v.optional(v.id("documents")),
    title: v.string(),
    description: v.optional(v.string()),
    options: v.array(v.string()),
    votes: v.optional(v.any()),
    status: v.union(v.literal("active"), v.literal("completed")),
    createdById: v.optional(v.id("users")),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_quote", ["quoteId"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // SUPPLIERS (Fornitori)
  // ═══════════════════════════════════════════════════════

  suppliers: defineTable({
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    companyName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    piva: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    type: v.union(v.literal("subprod"), v.literal("subeng"), v.literal("material"), v.literal("general"), v.literal("equipment"), v.literal("service"), v.literal("logistics")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("archived"), v.literal("pending")),
    notes: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    invitationCode: v.optional(v.string()),
    invitationStatus: v.optional(v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"))),
    invitationSentDate: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    rating: v.optional(v.number()),
    whatsappLink: v.optional(v.string()),
    whatsappLinkExpires: v.optional(v.string()),
    whatsappLinkUsed: v.optional(v.boolean()),
    supplierPassword: v.optional(v.string()),
    supplierCode: v.optional(v.string()),
    chatChannelId: v.optional(v.id("chatChannels")),
    createdById: v.optional(v.id("users")),
  })
    .index("by_email", ["email"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_invitation", ["invitationCode"])
    .index("by_supplier_code", ["supplierCode"])
    .index("by_whatsapp_link", ["whatsappLink"])
    .index("by_organization", ["organizationId"]),

  supplierRequests: defineTable({
    organizationId: v.id("organizations"),
    supplierId: v.optional(v.id("suppliers")),
    title: v.string(),
    description: v.optional(v.string()),
    fixtureType: v.optional(v.string()),
    fixtureSpecs: v.optional(v.any()),
    photos: v.optional(v.array(v.string())),
    documents: v.optional(v.array(v.string())),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("received"), v.literal("quoted"), v.literal("accepted"), v.literal("rejected"), v.literal("preventivato")),
    quotedPrice: v.optional(v.number()),
    supplierNotes: v.optional(v.string()),
    cantiereId: v.optional(v.id("cantieri")),
    clientId: v.optional(v.id("clients")),
    urgency: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    quantity: v.optional(v.number()),
    quoteId: v.optional(v.id("quotes")),
    dimensions: v.optional(v.any()),
    material: v.optional(v.string()),
    color: v.optional(v.string()),
    glassType: v.optional(v.string()),
    budgetEstimate: v.optional(v.number()),
    fixtureCategory: v.optional(v.string()),
    fixtureSubcategory: v.optional(v.string()),
    preliminaryQuote: v.optional(v.number()),
    supplierQuoteDocId: v.optional(v.id("documents")),
    platformMarginPrice: v.optional(v.number()),
    platformFinalDocId: v.optional(v.id("documents")),
    supplierQuoteExpiresAt: v.optional(v.string()),
    supplierQuoteExpiresDays: v.optional(v.number()),
    supplierExpiryNotified: v.optional(v.boolean()),
    counterproposalPrice: v.optional(v.number()),
    counterproposalNotes: v.optional(v.string()),
    counterproposalStatus: v.optional(v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"))),
    counterproposalDate: v.optional(v.string()),
    counterproposalResponseDate: v.optional(v.string()),
    counterproposalRejectionNotes: v.optional(v.string()),
    quoteRevisionCount: v.optional(v.number()),
    supplierAccontoPercentage: v.optional(v.number()),
    supplierPaymentPlan: v.optional(v.any()),
    depositPaid: v.optional(v.boolean()),
    depositPaymentId: v.optional(v.id("payments")),
    conversionOrderId: v.optional(v.id("supplierOrders")),
    requestedBy: v.optional(v.id("users")),
    materials: v.optional(v.any()),
    neededBy: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
  })
    .index("by_supplier", ["supplierId"])
    .index("by_status", ["status"])
    .index("by_cantiere", ["cantiereId"])
    .index("by_quote", ["quoteId"])
    .index("by_organization", ["organizationId"]),

  supplierOrders: defineTable({
    organizationId: v.id("organizations"),
    supplierId: v.id("suppliers"),
    requestId: v.optional(v.id("supplierRequests")),
    orderNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    items: v.optional(v.any()),
    totalAmount: v.optional(v.number()),
    status: v.union(v.literal("confirmed"), v.literal("in_production"), v.literal("ready"), v.literal("shipped"), v.literal("delivered"), v.literal("pending"), v.literal("cancelled")),
    deliveryDate: v.optional(v.string()),
    expectedDelivery: v.optional(v.string()),
    notes: v.optional(v.string()),
    supplierNotes: v.optional(v.string()),
    cantiereId: v.optional(v.id("cantieri")),
    quoteId: v.optional(v.id("quotes")),
    workflowStep: v.optional(v.number()),
    workflowStatus: v.optional(v.string()),
    locked: v.optional(v.boolean()),
    produzioneSbloccata: v.optional(v.boolean()),
    accontoPaid: v.optional(v.boolean()),
    accontoPaymentId: v.optional(v.id("payments")),
    accontoPercentage: v.optional(v.number()),
    quotePdfUrl: v.optional(v.string()),
    clientQuotePdfUrl: v.optional(v.string()),
    productionStartedDate: v.optional(v.string()),
    productionPhase: v.optional(v.number()),
    workflowHistory: v.optional(v.any()),
    paymentProposal: v.optional(v.any()),
    paymentProposalNotes: v.optional(v.string()),
    paymentProposalStatus: v.optional(v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"))),
    materialCost: v.optional(v.number()),
    withholdingTax: v.optional(v.number()),
    updatedById: v.optional(v.id("users")),
  })
    .index("by_supplier", ["supplierId"])
    .index("by_request", ["requestId"])
    .index("by_status", ["status"])
    .index("by_cantiere", ["cantiereId"])
    .index("by_quote", ["quoteId"])
    .index("by_organization", ["organizationId"]),

  supplierProduction: defineTable({
    organizationId: v.id("organizations"),
    orderId: v.optional(v.id("supplierOrders")),
    supplierId: v.id("suppliers"),
    description: v.optional(v.string()),
    quantity: v.optional(v.number()),
    completed: v.optional(v.number()),
    phase: v.optional(v.union(v.literal("materiali_ricevuti"), v.literal("taglio"), v.literal("assemblaggio"), v.literal("controllo_qualita"), v.literal("pronto"))),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
    startedDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
    estimatedCompletion: v.optional(v.string()),
    notes: v.optional(v.string()),
    progressPercentage: v.optional(v.number()),
    updatedById: v.optional(v.id("users")),
  })
    .index("by_order", ["orderId"])
    .index("by_supplier", ["supplierId"])
    .index("by_status", ["status"])
    .index("by_organization", ["organizationId"]),

  supplierDeliveries: defineTable({
    organizationId: v.id("organizations"),
    orderId: v.optional(v.id("supplierOrders")),
    supplierId: v.id("suppliers"),
    productionId: v.optional(v.id("supplierProduction")),
    description: v.optional(v.string()),
    status: v.union(v.literal("partito"), v.literal("in_transito"), v.literal("consegnato"), v.literal("pending")),
    departureDate: v.optional(v.string()),
    estimatedArrival: v.optional(v.string()),
    expectedDate: v.optional(v.string()),
    actualDate: v.optional(v.string()),
    deliveryDate: v.optional(v.string()),
    deliveryConfirmedBy: v.optional(v.id("users")),
    trackingNumber: v.optional(v.string()),
    driverId: v.optional(v.id("users")),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    driverVehicle: v.optional(v.string()),
    driverLicensePlate: v.optional(v.string()),
    documents: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    cantiereId: v.optional(v.id("cantieri")),
    confirmedArrival: v.optional(v.string()),
    clientDeliveryDate: v.optional(v.string()),
    deliveryType: v.optional(v.union(v.literal("edilizia"), v.literal("infissi"))),
    loadManifest: v.optional(v.any()),
    advanceNotified24h: v.optional(v.boolean()),
    advanceNotified48h: v.optional(v.boolean()),
    advanceNotified1w: v.optional(v.boolean()),
  })
    .index("by_order", ["orderId"])
    .index("by_supplier", ["supplierId"])
    .index("by_status", ["status"])
    .index("by_cantiere", ["cantiereId"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // COLLABORATORS
  // ═══════════════════════════════════════════════════════

  collaborators: defineTable({
    organizationId: v.id("organizations"),
    userId: v.optional(v.id("users")),
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    type: v.union(v.literal("employee"), v.literal("contractor"), v.literal("subcontractor"), v.literal("freelancer")),
    jobTitle: v.optional(v.string()),
    specialization: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("on_leave")),
    liveStatus: v.optional(v.union(v.literal("in_cantiere"), v.literal("in_ufficio"), v.literal("disponibile"), v.literal("non_disponibile"))),
    liveLocation: v.optional(v.string()),
    assignedCantieri: v.optional(v.array(v.id("cantieri"))),
    fiscalCode: v.optional(v.string()),
    contractType: v.optional(v.union(v.literal("tempo_pieno"), v.literal("tempo_parziale"), v.literal("freelance"), v.literal("subappalto"))),
    hourlyRate: v.optional(v.number()),
    dailyRate: v.optional(v.number()),
    salary: v.optional(v.number()),
    paymentFrequency: v.optional(v.string()),
    locationType: v.optional(v.union(v.literal("site"), v.literal("showroom"))),
    onboardingToken: v.optional(v.string()),
    onboardingExpires: v.optional(v.string()),
    temporaryPassword: v.optional(v.string()),
    notes: v.optional(v.string()),
    iban: v.optional(v.string()),
    ibanName: v.optional(v.string()),
    documents: v.optional(v.array(v.string())),
    contractStartDate: v.optional(v.string()),
    contractEndDate: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
  })
    .index("by_email", ["email"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_onboarding", ["onboardingToken"])
    .index("by_organization", ["organizationId"]),

  jobTitles: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    category: v.union(v.literal("construction"), v.literal("office"), v.literal("other")),
    createdById: v.optional(v.id("users")),
  })
    .index("by_category", ["category"])
    .index("by_title", ["title"])
    .index("by_organization", ["organizationId"]),

  collaboratorHours: defineTable({
    organizationId: v.id("organizations"),
    collaboratorId: v.id("collaborators"),
    cantiereId: v.optional(v.id("cantieri")),
    date: v.string(),
    hours: v.number(),
    description: v.optional(v.string()),
    approved: v.optional(v.boolean()),
    approvedById: v.optional(v.id("users")),
  })
    .index("by_collaborator", ["collaboratorId"])
    .index("by_cantiere", ["cantiereId"])
    .index("by_date", ["date"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // CERTIFICATES
  // ═══════════════════════════════════════════════════════

  certificates: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    category: v.union(v.literal("sicurezza"), v.literal("qualifica"), v.literal("conformita"), v.literal("ambientale"), v.literal("altro")),
    subcategory: v.optional(v.string()),
    description: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    issueDate: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    status: v.union(v.literal("valido"), v.literal("in_scadenza"), v.literal("scaduto"), v.literal("in_rinnovo")),
    cantiereId: v.optional(v.id("cantieri")),
    collaboratorId: v.optional(v.id("collaborators")),
    supplierId: v.optional(v.id("suppliers")),
    clientId: v.optional(v.id("clients")),
    alertSent: v.optional(v.boolean()),
    createdById: v.optional(v.id("users")),
    documentUrl: v.optional(v.string()),
    issuedBy: v.optional(v.string()),
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_expiry", ["expiryDate"])
    .index("by_cantiere", ["cantiereId"])
    .index("by_collaborator", ["collaboratorId"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // PAYMENTS
  // ═══════════════════════════════════════════════════════

  payments: defineTable({
    organizationId: v.id("organizations"),
    type: v.union(v.literal("supplier"), v.literal("collaborator"), v.literal("client")),
    referenceId: v.optional(v.string()),
    referenceName: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    collaboratorId: v.optional(v.id("collaborators")),
    clientId: v.optional(v.id("clients")),
    orderId: v.optional(v.id("supplierOrders")),
    cantiereId: v.optional(v.id("cantieri")),
    quoteId: v.optional(v.id("quotes")),
    description: v.string(),
    amount: v.number(),
    paymentType: v.optional(v.union(v.literal("acconto"), v.literal("saldo"), v.literal("rata"), v.literal("fattura"))),
    dueDate: v.optional(v.string()),
    paidDate: v.optional(v.string()),
    status: v.union(v.literal("in_attesa"), v.literal("in_verifica"), v.literal("pagato"), v.literal("in_ritardo"), v.literal("parziale")),
    method: v.optional(v.union(v.literal("bonifico"), v.literal("contanti"), v.literal("carta"), v.literal("paypal"), v.literal("altro"))),
    proofDocId: v.optional(v.id("documents")),
    invoiceNumber: v.optional(v.string()),
    invoiceUrl: v.optional(v.string()),
    proofUrl: v.optional(v.string()),
    confirmationNotes: v.optional(v.string()),
    recipientNotes: v.optional(v.string()),
    senderRole: v.optional(v.union(v.literal("client"), v.literal("admin"))),
    notes: v.optional(v.string()),
    sentAt: v.optional(v.string()),
    receivedAt: v.optional(v.string()),
    confirmedAmount: v.optional(v.number()),
    partialAmount: v.optional(v.number()),
    remainingAmount: v.optional(v.number()),
    pdfInvoiceUrl: v.optional(v.string()),
    pdfReceiptUrl: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    rejectionNotes: v.optional(v.string()),
    rejectedAt: v.optional(v.string()),
    rejectedById: v.optional(v.id("users")),
    createdById: v.optional(v.id("users")),
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_supplier", ["supplierId"])
    .index("by_collaborator", ["collaboratorId"])
    .index("by_client", ["clientId"])
    .index("by_cantiere", ["cantiereId"])
    .index("by_due_date", ["dueDate"])
    .index("by_organization", ["organizationId"]),

  paymentSettings: defineTable({
    organizationId: v.id("organizations"),
    accontoB2cPct: v.optional(v.number()),
    accontoB2bPct: v.optional(v.number()),
    intermedioPct: v.optional(v.number()),
    saldoPct: v.optional(v.number()),
    customClientOverrides: v.optional(v.any()),
    customSupplierOverrides: v.optional(v.any()),
    updatedById: v.optional(v.id("users")),
  })
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // COMMUNICATIONS
  // ═══════════════════════════════════════════════════════

  chatChannels: defineTable({
    organizationId: v.id("organizations"),
    companyEmail: v.optional(v.string()),
    name: v.string(),
    type: v.union(v.literal("general"), v.literal("project"), v.literal("private"), v.literal("announcement")),
    description: v.optional(v.string()),
    linkedId: v.optional(v.string()),
    members: v.optional(v.array(v.string())),
    lastMessage: v.optional(v.string()),
    lastMessageDate: v.optional(v.string()),
    lastActivity: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
  })
    .index("by_organization", ["organizationId"]),

  channelMessages: defineTable({
    organizationId: v.id("organizations"),
    channelId: v.id("chatChannels"),
    senderEmail: v.string(),
    senderName: v.optional(v.string()),
    content: v.string(),
    replyTo: v.optional(v.id("channelMessages")),
    attachments: v.optional(v.array(v.string())),
    likes: v.optional(v.array(v.string())),
    messageType: v.optional(v.string()),
    isEphemeral: v.optional(v.boolean()),
    ephemeralExpiresAt: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    pollId: v.optional(v.id("quotePolls")),
  })
    .index("by_channel", ["channelId"])
    .index("by_organization", ["organizationId"]),

  conversations: defineTable({
    organizationId: v.id("organizations"),
    clientEmail: v.string(),
    adminEmail: v.string(),
    clientName: v.optional(v.string()),
    adminName: v.optional(v.string()),
    lastMessage: v.optional(v.string()),
    lastMessageDate: v.optional(v.string()),
    unreadClient: v.optional(v.number()),
    unreadAdmin: v.optional(v.number()),
  })
    .index("by_client", ["clientEmail"])
    .index("by_admin", ["adminEmail"])
    .index("by_organization", ["organizationId"]),

  conversationMessages: defineTable({
    organizationId: v.id("organizations"),
    conversationId: v.id("conversations"),
    senderEmail: v.string(),
    senderName: v.string(),
    content: v.string(),
    attachments: v.optional(v.any()),
    read: v.optional(v.boolean()),
    pollId: v.optional(v.id("quotePolls")),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_organization", ["organizationId"]),

  internalMessages: defineTable({
    organizationId: v.id("organizations"),
    channelType: v.string(),
    channelId: v.string(),
    channelName: v.optional(v.string()),
    senderEmail: v.string(),
    senderName: v.optional(v.string()),
    senderRole: v.optional(v.string()),
    message: v.string(),
    messageType: v.optional(v.union(v.literal("text"), v.literal("system"), v.literal("alert"), v.literal("file"), v.literal("voice"))),
    attachments: v.optional(v.array(v.string())),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("voice"), v.literal("document"))),
    fileSize: v.optional(v.number()),
    read: v.optional(v.boolean()),
    readDate: v.optional(v.string()),
  })
    .index("by_channel", ["channelType", "channelId"])
    .index("by_sender", ["senderEmail"])
    .index("by_read", ["channelType", "channelId", "read"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // DOCUMENTS
  // ═══════════════════════════════════════════════════════

  documents: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("contract"), v.literal("quote"), v.literal("invoice"), v.literal("technical"), v.literal("certificate"), v.literal("photo"), v.literal("altro"), v.literal("documento"), v.literal("foto"), v.literal("preventivo"), v.literal("fattura"), v.literal("other"))),
    category: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    isPublic: v.optional(v.boolean()),
    sharedWith: v.optional(v.array(v.string())),
    clientId: v.optional(v.id("clients")),
    cantiereId: v.optional(v.id("cantieri")),
    quoteId: v.optional(v.id("quotes")),
    orderId: v.optional(v.id("supplierOrders")),
    deliveryId: v.optional(v.string()),
    entityType: v.optional(v.union(v.literal("client"), v.literal("cantiere"), v.literal("quote"), v.literal("supplier"))),
    entityId: v.optional(v.string()),
    name: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("final"), v.literal("archived")),
    createdById: v.optional(v.id("users")),
  })
    .index("by_creator", ["createdById"])
    .index("by_client", ["clientId"])
    .index("by_cantiere", ["cantiereId"])
    .index("by_quote", ["quoteId"])
    .index("by_status", ["status"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // BLOG
  // ═══════════════════════════════════════════════════════

  blogPosts: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    featuredImage: v.optional(v.string()),
    category: v.string(),
    authorName: v.string(),
    published: v.optional(v.boolean()),
    publishedDate: v.optional(v.string()),
    readTime: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════

  notifications: defineTable({
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    type: v.string(),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent")),
    isRead: v.optional(v.boolean()),
    readAt: v.optional(v.string()),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    senderEmail: v.optional(v.string()),
  })
    .index("by_user", ["userEmail"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // ACTIVITY LOG
  // ═══════════════════════════════════════════════════════

  activityLog: defineTable({
    organizationId: v.id("organizations"),
    userEmail: v.string(),
    userName: v.optional(v.string()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    entityName: v.optional(v.string()),
    details: v.optional(v.string()),
  })
    .index("by_user", ["userEmail"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_organization", ["organizationId"])
    .index("by_org_type", ["organizationId", "entityType"])
    .index("by_org_user", ["organizationId", "userEmail"]),

  // ═══════════════════════════════════════════════════════
  // REFERRAL CODES
  // ═══════════════════════════════════════════════════════

  referralCodes: defineTable({
    organizationId: v.id("organizations"),
    code: v.string(),
    description: v.optional(v.string()),
    discountPercent: v.number(),
    isActive: v.optional(v.boolean()),
    maxUses: v.optional(v.number()),
    usesCount: v.optional(v.number()),
    createdById: v.optional(v.id("users")),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // EDILIZIA PRICES
  // ═══════════════════════════════════════════════════════

  ediliziaPrices: defineTable({
    organizationId: v.id("organizations"),
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
  })
    .index("by_organization", ["organizationId"]),

  // ═══════════════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════

  subscriptions: defineTable({
    organizationId: v.id("organizations"),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(v.literal("active"), v.literal("past_due"), v.literal("canceled"), v.literal("trialing")),
    currentPeriodStart: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_stripe", ["stripeSubscriptionId"]),

  // ═══════════════════════════════════════════════════════
  // STRIPE EVENTS (idempotency)
  // ═══════════════════════════════════════════════════════

  stripeEvents: defineTable({
    stripeEventId: v.string(),
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
  }).index("by_stripeEventId", ["stripeEventId"]),

  // ═══════════════════════════════════════════════════════
  // ANALYTICS — PAGE VIEWS
  // ═══════════════════════════════════════════════════════

  pageViews: defineTable({
    userEmail: v.optional(v.string()),
    path: v.string(),
    title: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    duration: v.optional(v.number()),
    isAuthenticated: v.boolean(),
  })
    .index("by_path", ["path"])
    .index("by_user", ["userEmail"])
    .index("by_session", ["sessionId"]),

  // ═══════════════════════════════════════════════════════
  // ANALYTICS — FEATURE EVENTS
  // ═══════════════════════════════════════════════════════

  featureEvents: defineTable({
    userEmail: v.optional(v.string()),
    eventName: v.string(),
    eventData: v.optional(v.any()),
    page: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    isAuthenticated: v.boolean(),
  })
    .index("by_event", ["eventName"])
    .index("by_user", ["userEmail"])
    .index("by_session", ["sessionId"]),

  // ═══════════════════════════════════════════════════════
  // ANALYTICS — USER SESSIONS
  // ═══════════════════════════════════════════════════════

  userSessions: defineTable({
    userEmail: v.string(),
    signedInAt: v.number(),
    lastActiveAt: v.optional(v.number()),
    signedOutAt: v.optional(v.number()),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.string(),
  })
    .index("by_user", ["userEmail"])
    .index("by_session", ["sessionId"]),
})
