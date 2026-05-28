import { mutation } from "./_generated/server"
import { hashPassword } from "./auth"

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const orgId = await ctx.db.insert("organizations", {
      name: "Kranely Demo Srl",
      slug: "kranely-demo",
      ownerEmail: "admin@kranely.app",
      plan: "pro",
      status: "active",
    })

    const adminHash = await hashPassword("admin123")
    const adminId = await ctx.db.insert("users", {
      email: "admin@kranely.app",
      fullName: "Marco Admin",
      role: "admin",
      organizationId: orgId,
      passwordHash: adminHash,
    })

    const supplierHash = await hashPassword("supplier123")
    const supplierUserId = await ctx.db.insert("users", {
      email: "supplier@test.com",
      fullName: "Luca Fornitore",
      role: "supplier",
      subrole: "serramenti",
      organizationId: orgId,
      passwordHash: supplierHash,
    })

    const clientHash = await hashPassword("client123")
    const clientUserId = await ctx.db.insert("users", {
      email: "client@test.com",
      fullName: "Mario Cliente",
      role: "client",
      organizationId: orgId,
      passwordHash: clientHash,
    })

    const collabHash = await hashPassword("collab123")
    const collabUserId = await ctx.db.insert("users", {
      email: "collaborator@test.com",
      fullName: "Alessandro Collaboratore",
      role: "collaborator",
      subrole: "edilizia",
      organizationId: orgId,
      passwordHash: collabHash,
    })

    // Create demo clients
    const client1 = await ctx.db.insert("clients", {
      organizationId: orgId,
      fullName: "Mario Rossi",
      email: "mario.rossi@email.it",
      phone: "+39 333 1234567",
      address: "Via Roma 15, Milano",
      companyName: "Rossi Costruzioni Srl",
      vatNumber: "IT12345678901",
      clientType: "b2b",
      status: "active",
      createdById: adminId,
    })

    const client2 = await ctx.db.insert("clients", {
      organizationId: orgId,
      fullName: "Laura Bianchi",
      email: "laura.bianchi@email.it",
      phone: "+39 333 7654321",
      address: "Corso Italia 42, Roma",
      clientType: "b2c",
      status: "active",
      createdById: adminId,
    })

    const client3 = await ctx.db.insert("clients", {
      organizationId: orgId,
      fullName: "Giuseppe Verdi",
      email: "g.verdi@email.it",
      phone: "+39 333 9876543",
      companyName: "Verdi Immobiliare",
      vatNumber: "IT98765432109",
      clientType: "b2b",
      status: "lead",
      createdById: adminId,
    })

    // Create demo suppliers
    const supplier1 = await ctx.db.insert("suppliers", {
      organizationId: orgId,
      companyName: "FerroMax Srl",
      email: "info@ferromax.it",
      phone: "+39 02 1234567",
      contactPerson: "Luca Ferro",
      address: "Via Industriale 10, Torino",
      type: "material",
      status: "active",
      supplierCode: "SUP-001",
      userId: supplierUserId,
    })

    const supplier2 = await ctx.db.insert("suppliers", {
      organizationId: orgId,
      companyName: "VetriPro SpA",
      email: "ordini@vetripro.it",
      phone: "+39 06 7654321",
      contactPerson: "Anna Vetri",
      type: "material",
      status: "active",
      supplierCode: "SUP-002",
    })

    const supplier3 = await ctx.db.insert("suppliers", {
      organizationId: orgId,
      companyName: "NoleggioSpeed",
      email: "info@noleggiospeed.it",
      phone: "+39 055 1112233",
      type: "equipment",
      status: "active",
      supplierCode: "SUP-003",
    })

    // Create collaborator records
    await ctx.db.insert("collaborators", {
      organizationId: orgId,
      fullName: "Alessandro Collaboratore",
      email: "collaborator@test.com",
      phone: "+39 333 1112233",
      type: "employee",
      specialization: "Facciate e ponteggi",
      status: "active",
      hourlyRate: 25,
      dailyRate: 200,
      userId: collabUserId,
    })

    await ctx.db.insert("collaborators", {
      organizationId: orgId,
      fullName: "Francesco Elettricista",
      email: "f.elettricista@kranely.demo",
      phone: "+39 333 4445566",
      type: "contractor",
      specialization: "Impianti elettrici",
      status: "active",
      hourlyRate: 35,
      dailyRate: 280,
    })

    await ctx.db.insert("collaborators", {
      organizationId: orgId,
      fullName: "Paolo Idraulico",
      email: "p.idraulico@kranely.demo",
      phone: "+39 333 7778899",
      type: "subcontractor",
      specialization: "Impianti idraulici",
      status: "active",
      hourlyRate: 30,
      dailyRate: 240,
    })

    // Remaining seed data (same as before but with corrected email references)
    const quote1 = await ctx.db.insert("quotes", {
      organizationId: orgId,
      clientId: client1,
      title: "Ristrutturazione facciata condominio",
      description: "Intervento completo di ristrutturazione facciata con ponteggi e finiture",
      quoteType: "preventivo",
      status: "accepted",
      estimatedPrice: 45000,
      email: "mario.rossi@email.it",
      createdBy: adminId,
      files: ["/docs/preventivo-001.pdf", "/docs/planimetria-facciata.pdf"],
      attachmentPhotos: ["/docs/foto-facciata-1.jpg", "/docs/foto-facciata-2.jpg"],
    })

    const quote2 = await ctx.db.insert("quotes", {
      organizationId: orgId,
      clientId: client2,
      title: "Sostituzione infissi villa",
      description: "Sostituzione 12 infissi in alluminio con doppio vetro",
      quoteType: "preventivo",
      status: "sent",
      estimatedPrice: 18500,
      email: "laura.bianchi@email.it",
      createdBy: adminId,
    })

    const quote3 = await ctx.db.insert("quotes", {
      organizationId: orgId,
      clientId: client3,
      title: "Sopralluogo tecnico palazzo uffici",
      quoteType: "sopralluogo",
      status: "draft",
      estimatedPrice: 0,
      email: "g.verdi@email.it",
      createdBy: adminId,
    })

    const cantiere1 = await ctx.db.insert("cantieri", {
      organizationId: orgId,
      clientId: client1,
      name: "Cantiere Via Roma 15",
      address: "Via Roma 15, Milano",
      startDate: "2026-03-01",
      endDate: "2026-08-30",
      status: "in_corso",
      description: "Ristrutturazione facciata condominio 8 piani",
      quoteId: quote1,
      totalBudget: 45000,
      managerId: adminId,
    })

    const cantiere2 = await ctx.db.insert("cantieri", {
      organizationId: orgId,
      clientId: client2,
      name: "Villa Bianchi - Infissi",
      address: "Via dei Pini 8, Firenze",
      startDate: "2026-05-15",
      endDate: "2026-06-30",
      status: "pianificato",
      description: "Sostituzione infissi villa su due piani",
      quoteId: quote2,
      totalBudget: 18500,
      managerId: adminId,
    })

    // Documents — created before payments so payments can reference them
    await ctx.db.insert("documents", {
      organizationId: orgId, title: "Contratto Cantiere Via Roma",
      type: "contract", fileUrl: "/docs/contratto-via-roma.pdf",
      fileName: "contratto-via-roma.pdf", fileSize: 245000,
      mimeType: "application/pdf", status: "final",
      description: "Contratto firmato con Rossi Costruzioni",
      clientId: client1, cantiereId: cantiere1, createdById: adminId,
    })

    const docPreventivo = await ctx.db.insert("documents", {
      organizationId: orgId, title: "Preventivo #2026-001",
      type: "quote", fileUrl: "/docs/preventivo-001.pdf",
      fileName: "preventivo-001.pdf", fileSize: 180000,
      mimeType: "application/pdf", status: "final",
      description: "Preventivo ristrutturazione facciata",
      clientId: client1, quoteId: quote1, createdById: adminId,
    })

    await ctx.db.patch(quote1, { clientSelectedVersionDocId: docPreventivo } as any)

    const paymentAcconto = await ctx.db.insert("payments", {
      organizationId: orgId,
      type: "client",
      description: "Acconto Cantiere Via Roma",
      amount: 15000,
      status: "pagato", dueDate: "2026-03-01", paidDate: "2026-03-01",
      clientId: client1, cantiereId: cantiere1, method: "bonifico",
      proofDocId: docPreventivo,
    })

    await ctx.db.insert("payments", {
      organizationId: orgId,
      type: "client",
      description: "Secondo acconto Cantiere Via Roma",
      amount: 15000,
      status: "in_attesa", dueDate: "2026-05-01",
      clientId: client1, cantiereId: cantiere1, method: "bonifico",
    })

    await ctx.db.insert("payments", {
      organizationId: orgId,
      type: "supplier",
      description: "Acquisto materiali FerroMax",
      amount: 8500,
      status: "pagato", dueDate: "2026-03-15", paidDate: "2026-03-14",
      supplierId: supplier1, method: "bonifico",
    })

    await ctx.db.insert("payments", {
      organizationId: orgId,
      type: "supplier",
      description: "Noleggio ponteggio",
      amount: 3200,
      status: "in_attesa", dueDate: "2026-05-20",
      supplierId: supplier3, method: "bonifico",
    })

    await ctx.db.insert("payments", {
      organizationId: orgId,
      type: "client",
      description: "Saldo lavori mese Aprile",
      amount: 10000,
      status: "in_ritardo", dueDate: "2026-04-30",
      clientId: client1, cantiereId: cantiere1,
    })

    await ctx.db.insert("certificates", {
      organizationId: orgId, name: "ISO 9001:2015",
      category: "qualifica", status: "valido",
      issueDate: "2025-01-15", expiryDate: "2028-01-15",
      issuedBy: "DNV GL", description: "Certificazione sistema qualità",
    })

    await ctx.db.insert("certificates", {
      organizationId: orgId, name: "Attestazione SOA OG1",
      category: "qualifica", status: "in_scadenza",
      issueDate: "2023-06-01", expiryDate: "2026-06-15",
      issuedBy: "SOA", description: "Qualificazione lavori generali",
    })

    await ctx.db.insert("certificates", {
      organizationId: orgId, name: "DURC",
      category: "conformita", status: "valido",
      issueDate: "2026-01-01", expiryDate: "2026-12-31",
      issuedBy: "INPS", description: "Documento unicità regolarità contributiva",
    })

    await ctx.db.insert("certificates", {
      organizationId: orgId, name: "Patentino PLE",
      category: "sicurezza", status: "scaduto",
      issueDate: "2022-03-01", expiryDate: "2026-03-01",
      issuedBy: "Regione Lombardia", description: "Abilitazione piattaforma elevatrice",
    })

    await ctx.db.insert("appointments", {
      organizationId: orgId,
      title: "Sopralluogo Villa Bianchi",
      email: "laura.bianchi@email.it",
      appointmentDate: "2026-05-25", appointmentTime: "10:00",
      location: "Via dei Pini 8, Firenze",
      description: "Sopralluogo preliminare per sostituzione infissi",
      status: "scheduled", clientId: client2,
    })

    await ctx.db.insert("appointments", {
      organizationId: orgId,
      title: "Riunione avanzamento lavori",
      email: "mario.rossi@email.it",
      appointmentDate: "2026-05-22", appointmentTime: "14:30",
      location: "Cantiere Via Roma 15",
      description: "Verifica stato avanzamento con il cliente",
      status: "scheduled", clientId: client1, cantiereId: cantiere1,
    })

    const order1 = await ctx.db.insert("supplierOrders", {
      organizationId: orgId, supplierId: supplier1,
      cantiereId: cantiere1, quoteId: quote1,
      orderNumber: "ORD-2026-001",
      description: "Ferro e acciaio per struttura facciata",
      totalAmount: 8500, status: "delivered",
      expectedDelivery: "2026-03-20",
    })

    const order2 = await ctx.db.insert("supplierOrders", {
      organizationId: orgId, supplierId: supplier2,
      cantiereId: cantiere2,
      orderNumber: "ORD-2026-002",
      description: "Infissi alluminio doppio vetro - 12 pezzi",
      totalAmount: 12000, status: "confirmed",
      expectedDelivery: "2026-06-01",
    })

    await ctx.db.insert("supplierDeliveries", {
      organizationId: orgId, supplierId: supplier1,
      cantiereId: cantiere1, orderId: order1,
      description: "Consegna ferro e acciaio",
      expectedDate: "2026-03-20", actualDate: "2026-03-19",
      status: "consegnato",
    })

    await ctx.db.insert("supplierDeliveries", {
      organizationId: orgId, supplierId: supplier2,
      cantiereId: cantiere2, orderId: order2,
      description: "Consegna infissi",
      expectedDate: "2026-06-01", status: "partito",
    })

    const generalChannel = await ctx.db.insert("chatChannels", {
      organizationId: orgId, name: "Generale",
      type: "general", description: "Canale generale per tutto il team",
      createdById: adminId,
    })

    await ctx.db.insert("chatChannels", {
      organizationId: orgId, name: "Cantiere Via Roma",
      type: "project", description: "Discussioni relative al cantiere Via Roma 15",
      createdById: adminId,
    })

    await ctx.db.insert("channelMessages", {
      organizationId: orgId, channelId: generalChannel,
      senderEmail: "admin@kranely.app",
      content: "Benvenuti nel nuovo sistema Kranely!",
    })

    await ctx.db.insert("notifications", {
      organizationId: orgId, userEmail: "admin@kranely.app",
      title: "Pagamento in scadenza",
      message: "Il pagamento di EUR15.000 da Rossi Costruzioni è in scadenza il 01/05",
      type: "payment_due", priority: "high", isRead: false,
    })

    await ctx.db.insert("notifications", {
      organizationId: orgId, userEmail: "admin@kranely.app",
      title: "Certificato in scadenza",
      message: "L'attestazione SOA OG1 scadrà il 15/06/2026",
      type: "certificate_expiry", priority: "normal", isRead: false,
    })

    await ctx.db.insert("notifications", {
      organizationId: orgId, userEmail: "admin@kranely.app",
      title: "Nuovo ordine confermato",
      message: "L'ordine ORD-2026-002 da VetriPro è stato confermato",
      type: "info", priority: "low", isRead: true,
    })

    await ctx.db.insert("activityLog", {
      organizationId: orgId, userEmail: "admin@kranely.app",
      action: "created", entityType: "client",
      entityId: client1, entityName: "Mario Rossi",
      details: "Cliente B2B Rossi Costruzioni Srl aggiunto",
    })

    await ctx.db.insert("activityLog", {
      organizationId: orgId, userEmail: "admin@kranely.app",
      action: "created", entityType: "quote",
      entityId: quote1, entityName: "Ristrutturazione facciata condominio",
      details: "Preventivo da €45.000 creato e accettato",
    })

    await ctx.db.insert("activityLog", {
      organizationId: orgId, userEmail: "admin@kranely.app",
      action: "created", entityType: "cantiere",
      entityId: cantiere1, entityName: "Cantiere Via Roma 15",
      details: "Cantiere avviato con budget €45.000",
    })

    return {
      orgId, adminId,
      clients: [client1, client2, client3],
      suppliers: [supplier1, supplier2, supplier3],
      quotes: [quote1, quote2, quote3],
      cantieri: [cantiere1, cantiere2],
    }
  },
})
