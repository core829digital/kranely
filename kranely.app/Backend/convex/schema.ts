import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // ============ ORGANIZATIONS (WhiteLabel / Multi-Tenant) ============

    // Organizations — one record per tenant (serramentista company)
    organizations: defineTable({
        name: v.string(),                          // Company/brand display name
        slug: v.optional(v.string()),              // URL-friendly identifier
        owner_email: v.string(),                   // Primary admin email
        plan: v.optional(v.string()),              // free | pro | enterprise
        status: v.string(),                        // active | suspended | trial
        domain: v.optional(v.string()),            // Custom domain for white-label
        created_by: v.string(),
        created_date: v.string(),
        updated_date: v.optional(v.string()),
    }).index("by_slug", ["slug"]).index("by_owner", ["owner_email"]).index("by_status", ["status"]),

    // White Label Settings — per-org branding configuration
    white_label_settings: defineTable({
        organization_id: v.id("organizations"),
        // Branding
        logo_url: v.optional(v.string()),          // Storage ID or URL for logo
        favicon_url: v.optional(v.string()),
        primary_color: v.optional(v.string()),     // Hex colour, e.g. "#3B82F6"
        secondary_color: v.optional(v.string()),
        accent_color: v.optional(v.string()),
        // Typography
        font_family: v.optional(v.string()),
        // Copy / naming
        app_name: v.optional(v.string()),          // Name shown in the UI
        tagline: v.optional(v.string()),
        support_email: v.optional(v.string()),
        support_phone: v.optional(v.string()),
        website_url: v.optional(v.string()),
        // Feature toggles
        features: v.optional(v.any()),             // JSON map of feature flags
        // Custom CSS / advanced overrides
        custom_css: v.optional(v.string()),
        updated_by: v.string(),
        updated_date: v.string(),
    }).index("by_organization", ["organization_id"]),

    // Users (synced with Clerk via webhooks)
    users: defineTable({
        email: v.string(),
        fullName: v.optional(v.string()),
        role: v.optional(v.string()),              // admin | supplier | client | staff | collaborator
        tokenIdentifier: v.string(),
        organization_id: v.optional(v.id("organizations")), // Multi-tenant: which org this user belongs to
        is_company: v.optional(v.boolean()),
        company_role: v.optional(v.string()),
        profile_image: v.optional(v.string()),     // Profile image URL or storage ID
        work_sector: v.optional(v.string()),       // Work sector
        blocked: v.optional(v.boolean()),          // Admin: block user access
        blocked_reason: v.optional(v.string()),    // Admin: reason for blocking
        referral_code_applied: v.optional(v.string()),   // Applied referral code
        referral_discount_percent: v.optional(v.number()), // Discount from referral
    }).index("by_token", ["tokenIdentifier"]).index("by_email", ["email"]).index("by_role", ["role"]).index("by_organization", ["organization_id"]),

    // Clients (registered by admins)
    clients: defineTable({
        full_name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        fiscal_code: v.optional(v.string()),
        company_name: v.optional(v.string()),
        notes: v.optional(v.string()),
        status: v.string(), // lead, active, archived
        client_type: v.optional(v.string()), // b2b | b2c
        vat_number: v.optional(v.string()), // P.IVA per B2B
        created_by: v.string(),
        created_date: v.string(),
    }).index("by_email", ["email"]).index("by_status", ["status"]),

    // Appointments (CalendarWidget)
    appointments: defineTable({
        full_name: v.optional(v.string()),
        email: v.string(),
        phone: v.optional(v.string()),
        appointment_date: v.string(),
        appointment_time: v.string(),
        status: v.string(), // pending, confirmed, completed, cancelled
        project_type: v.string(),
        notes: v.optional(v.string()),
        created_by: v.optional(v.string()),
        created_by_role: v.optional(v.string()), // cliente | fornitore | collaboratore | admin
        is_sample: v.optional(v.string()),
    }).index("by_email", ["email"]).index("by_date", ["appointment_date"]).index("by_date_time", ["appointment_date", "appointment_time"]),

    // Cantieri (CantieriDashboard) - ENHANCED
    cantieri: defineTable({
        client_id: v.optional(v.id("clients")), // Link to client
        company_email: v.optional(v.string()),
        nome_cantiere: v.string(),
        cliente: v.string(), // Client name for display
        indirizzo: v.optional(v.string()), // NEW: Address
        status: v.string(), // in_lavorazione, posa_in_opera, completato
        valore_contratto: v.optional(v.number()),
        valore_progetto: v.optional(v.number()), // NEW: Project value
        costi_effettivi: v.optional(v.number()),
        progresso: v.optional(v.number()), // Overall 0-100
        // Phase-specific progress
        progresso_in_lavorazione: v.optional(v.number()),
        progresso_posa_in_opera: v.optional(v.number()),
        progresso_completamento: v.optional(v.number()),
        team_assegnato: v.optional(v.string()),
        documenti_collegati: v.optional(v.array(v.string())),
        preventivi_collegati: v.optional(v.array(v.id("quotes"))), // Changed to quote IDs
        created_by: v.optional(v.string()),
        created_date: v.optional(v.string()),
    }).index("by_company", ["company_email"]).index("by_client", ["client_id"]).index("by_status", ["status"]),

    // Phase Tasks - NEW (tasks per phase with assignment)
    phase_tasks: defineTable({
        cantiere_id: v.id("cantieri"),
        phase: v.string(), // in_lavorazione, posa_in_opera, completato
        title: v.string(),
        description: v.optional(v.string()),
        status: v.string(), // da_fare, in_corso, completato
        assigned_to: v.optional(v.string()), // email of team member
        priority: v.string(), // alta, media, bassa
        due_date: v.optional(v.string()),
        completed_date: v.optional(v.string()),
        created_by: v.string(),
        created_date: v.string(),
    }).index("by_cantiere", ["cantiere_id"]).index("by_phase", ["cantiere_id", "phase"]).index("by_assigned", ["assigned_to"]),

    // Company Teams
    company_teams: defineTable({
        company_email: v.string(),
        team_name: v.string(),
        company_name: v.optional(v.string()),
        members: v.optional(v.array(v.string())), // emails
        created_by: v.optional(v.string()),
        created_date: v.optional(v.string()),
        is_sample: v.optional(v.string()),
    }).index("by_company", ["company_email"]),

    // Tasks (legacy - keeping for compatibility)
    tasks: defineTable({
        cantiere_id: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.string(),
        priority: v.string(),
        scadenza: v.optional(v.string()),
        created_by: v.optional(v.string()),
        created_date: v.optional(v.string()),
    }).index("by_cantiere", ["cantiere_id"]),

    // Chat Channels (team/cantiere chats)
    chat_channels: defineTable({
        company_email: v.optional(v.string()),
        name: v.string(),
        type: v.string(), // generale, team, cantiere
        linked_id: v.optional(v.string()),
        members: v.array(v.string()),
        last_message: v.optional(v.string()),
        last_message_date: v.optional(v.string()),
        created_by: v.optional(v.string()),
    }),

    // Channel Messages
    channel_messages: defineTable({
        channel_id: v.string(),
        sender_email: v.string(),
        sender_name: v.string(),
        content: v.string(),
        attachments: v.optional(v.array(v.object({
            file_url: v.string(),
            file_name: v.string(),
            file_type: v.string(),
        }))),
        created_date: v.string(),
        likes: v.optional(v.array(v.string())),
        message_type: v.optional(v.string()),
        is_ephemeral: v.optional(v.boolean()),
        ephemeral_expires_at: v.optional(v.string()),
        file_url: v.optional(v.string()),
        file_name: v.optional(v.string()),
        poll_id: v.optional(v.id("quote_polls")), // Linked Poll
    }).index("by_channel", ["channel_id"]),

    // Cantiere Team Members (for invitations)
    cantiere_team_members: defineTable({
        cantiere_id: v.id("cantieri"),
        email: v.string(),
        role: v.string(), // admin
        status: v.string(), // pending, accepted, declined
        invited_by: v.string(),
        invited_date: v.string(),
        accepted_date: v.optional(v.string()),
    }).index("by_cantiere", ["cantiere_id"]).index("by_email", ["email"]),

    // Conversations - NEW (CEO/Admin ↔ Client direct messaging)
    conversations: defineTable({
        client_email: v.string(),
        admin_email: v.string(), // CEO or Admin
        client_name: v.optional(v.string()),
        admin_name: v.optional(v.string()),
        last_message: v.optional(v.string()),
        last_message_date: v.optional(v.string()),
        unread_client: v.optional(v.number()),
        unread_admin: v.optional(v.number()),
        created_date: v.string(),
    }).index("by_client", ["client_email"]).index("by_admin", ["admin_email"]),

    // Conversation Messages - NEW
    conversation_messages: defineTable({
        conversation_id: v.id("conversations"),
        sender_email: v.string(),
        sender_name: v.string(),
        content: v.string(),
        attachments: v.optional(v.array(v.object({
            file_url: v.string(),
            file_name: v.string(),
            file_type: v.string(),
        }))),
        created_date: v.string(),
        read: v.boolean(),
        poll_id: v.optional(v.id("quote_polls")), // Linked Poll
    }).index("by_conversation", ["conversation_id"]),

    // Activity Log - NEW (track user actions)
    activity_log: defineTable({
        user_email: v.string(),
        user_name: v.optional(v.string()),
        action: v.string(), // created, updated, completed, assigned, etc.
        entity_type: v.string(), // cantiere, task, document, appointment, etc.
        entity_id: v.string(),
        entity_name: v.optional(v.string()),
        details: v.optional(v.string()),
        created_date: v.string(),
    }).index("by_user", ["user_email"]).index("by_entity", ["entity_type", "entity_id"]).index("by_date", ["created_date"]),

    // Notifications
    notifications: defineTable({
        user_email: v.string(),
        type: v.string(),
        priority: v.optional(v.string()),
        read: v.boolean(),
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()),
        created_date: v.string(),
        sender_email: v.optional(v.string()),
        created_by: v.optional(v.string()),
    }).index("by_user", ["user_email"]),

    // Quotes (Preventivi)
    quotes: defineTable({
        title: v.optional(v.string()),
        full_name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        notes: v.optional(v.string()),
        status: v.string(), // draft, sent, accepted, rejected, scaduto, in_lavorazione
        quote_type: v.string(),
        estimated_price: v.optional(v.number()),
        files: v.optional(v.array(v.string())),
        created_date: v.string(),
        window_config: v.optional(v.any()),
        project_config: v.optional(v.any()),
        client_id: v.optional(v.id("clients")), // NEW: Link to client
        cantiere_id: v.optional(v.id("cantieri")), // NEW: Link to cantiere
        // Scadenza preventivo cliente (impostata dall'Admin quando invia il preventivo al cliente)
        client_quote_expires_at: v.optional(v.string()), // ISO date
        client_quote_expires_days: v.optional(v.number()), // giorni di validità impostati dall'Admin
        expiry_notified_24h: v.optional(v.boolean()), // true after 24h warning sent
        // Piano pagamenti personalizzato per preventivo
        acconto_percentage: v.optional(v.number()), // % acconto per questo specifico preventivo
        payment_plan: v.optional(v.array(v.object({
            type: v.string(), // acconto | rata | saldo
            percentage: v.number(),
            description: v.string(),
            due_days: v.optional(v.number()), // giorni dall'accettazione
        }))),
        client_selected_version_doc_id: v.optional(v.id("documents")), // versione scelta dal cliente (dalla piattaforma)
        request_title: v.optional(v.string()),     // Titolo esplicito della richiesta (es. "Rifacimento finestre salone")
        material_category: v.optional(v.string()), // Categoria materiale (es. "PVC", "Alluminio", "Legno", "Edilizia")
        attachment_photos: v.optional(v.array(v.string())), // Storage IDs foto allegate dal cliente
    }).index("by_status", ["status"]).index("by_type", ["quote_type"]).index("by_email", ["email"]).index("by_client", ["client_id"]),

    // Quote Polls (ClientChat)
    quote_polls: defineTable({
        conversation_id: v.string(), // CHANGED: v.id("conversations") -> v.string() to support channel IDs
        quote_id: v.optional(v.id("quotes")),
        document_id: v.optional(v.id("documents")), // Linked Document
        title: v.string(),
        description: v.optional(v.string()),
        options: v.array(v.string()),
        votes: v.optional(v.array(v.object({
            user_email: v.string(),
            option: v.string(),
            voted_at: v.string(),
            note: v.optional(v.string()), // For counter-proposals
            proposed_price: v.optional(v.number()), // NEW: Negotiation support
        }))),
        status: v.string(), // active, completed
        created_by: v.string(),
        created_date: v.string(),
    }).index("by_conversation", ["conversation_id"]),

    // Documents
    documents: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        category: v.string(),
        file_url: v.string(),
        file_name: v.string(),
        file_type: v.optional(v.string()),
        file_size: v.number(),
        is_public: v.optional(v.string()),
        created_by: v.string(),
        created_date: v.string(),
        shared_with: v.optional(v.array(v.string())), // NEW: emails of users to share with
        client_id: v.optional(v.id("clients")), // Link to client
        cantiere_id: v.optional(v.id("cantieri")), // Link to cantiere
        quote_id: v.optional(v.id("quotes")), // Link to quote
        order_id: v.optional(v.id("supplier_orders")), // NEW: Link to order
        delivery_id: v.optional(v.id("supplier_deliveries")), // NEW: Link to delivery
        status: v.optional(v.string()), // draft, definitive
    }).index("by_creator", ["created_by"]).index("by_client", ["client_id"]).index("by_cantiere", ["cantiere_id"]).index("by_quote", ["quote_id"]).index("by_status", ["status"]),

    // Blog Posts
    blog_posts: defineTable({
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
    }).index("by_slug", ["slug"]).index("by_published", ["published"]),

    // ============ FORNITORI (Suppliers) ============

    // Supplier Registry
    suppliers: defineTable({
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        piva: v.optional(v.string()), // P.IVA
        type: v.string(), // subprod (infissi) | subeng (edilizia)
        status: v.string(), // active | inactive | archived
        notes: v.optional(v.string()),
        user_id: v.optional(v.id("users")), // linked user account
        // Invitation system — generate code, supplier uses it to register & link account
        invitation_code: v.optional(v.string()),
        invitation_status: v.optional(v.string()), // pending | accepted | expired
        invitation_sent_date: v.optional(v.string()),
        contact_person: v.optional(v.string()), // Name of primary contact at supplier
        // Task 1: WhatsApp onboarding — unique link, expires after first use OR 48h
        whatsapp_link: v.optional(v.string()),
        whatsapp_link_expires: v.optional(v.string()), // ISO date — 48h from generation
        whatsapp_link_used: v.optional(v.boolean()), // true after first use
        supplier_password: v.optional(v.string()), // Admin-set password (not auto-generated)
        // Task 7: Unique supplier code (usable by multiple emails of same supplier)
        supplier_code: v.optional(v.string()), // format: KRN-XXXXX (unique supplier code)
        created_by: v.string(),
        created_date: v.string(),
    }).index("by_email", ["email"]).index("by_type", ["type"]).index("by_status", ["status"]).index("by_user", ["user_id"]).index("by_invitation", ["invitation_code"]).index("by_supplier_code", ["supplier_code"]).index("by_whatsapp_link", ["whatsapp_link"]),

    // Supplier Requests (Richieste) — standardized forms with fixture specs
    supplier_requests: defineTable({
        supplier_id: v.id("suppliers"),
        title: v.string(),
        description: v.optional(v.string()),
        // Moduli infissi predefiniti
        fixture_type: v.optional(v.string()), // finestra, porta, portafinestra, persiana, etc.
        fixture_specs: v.optional(v.any()), // flexible JSON: dimensions, material, color, glass type
        photos: v.optional(v.array(v.string())), // storage IDs for attached images
        documents: v.optional(v.array(v.string())), // attached documents
        status: v.string(), // draft | sent | received | quoted | accepted | rejected
        quoted_price: v.optional(v.number()),
        supplier_notes: v.optional(v.string()),
        cantiere_id: v.optional(v.id("cantieri")),
        client_id: v.optional(v.id("clients")),
        // Task 9: Expanded request fields
        urgency: v.optional(v.string()), // normal | urgent
        quantity: v.optional(v.number()),
        quote_id: v.optional(v.id("quotes")), // Added for Quote-to-Order flow
        dimensions: v.optional(v.any()), // JSON: { width, height, depth }
        material: v.optional(v.string()),
        color: v.optional(v.string()),
        glass_type: v.optional(v.string()),
        budget_estimate: v.optional(v.number()),
        // Task 10: Fixture categories — Finestre, Porte, Portefinestre, Veneziane, Tapparelle, Zanzariere, etc.
        fixture_category: v.optional(v.string()), // top-level category
        fixture_subcategory: v.optional(v.string()), // subcategory/profile
        preliminary_quote: v.optional(v.number()),
        // Phase 8: Refined Quote Workflow
        supplier_quote_doc_id: v.optional(v.id("documents")), // Doc from supplier
        platform_margin_price: v.optional(v.number()), // Final price with platform margin applied
        platform_final_doc_id: v.optional(v.id("documents")), // Final doc for client (platform version)
        // Scadenza: fornitore verso Admin e Admin verso Cliente
        supplier_quote_expires_at: v.optional(v.string()), // ISO date — scadenza preventivo fornitore
        supplier_quote_expires_days: v.optional(v.number()), // giorni validità preventivo fornitore
        supplier_expiry_notified: v.optional(v.boolean()), // 24h warning inviato
        // Controproposta Admin → Fornitore
        counterproposal_price: v.optional(v.number()), // prezzo proposto dall'Admin
        counterproposal_notes: v.optional(v.string()),
        counterproposal_status: v.optional(v.string()), // pending | accepted | rejected
        counterproposal_date: v.optional(v.string()),
        counterproposal_response_date: v.optional(v.string()),
        counterproposal_rejection_notes: v.optional(v.string()),
        // Quante volte il fornitore ha rifatto il preventivo
        quote_revision_count: v.optional(v.number()),
        // Termini di pagamento richiesti dal fornitore (obbligatori al preventivo)
        supplier_acconto_percentage: v.optional(v.number()), // % acconto richiesto dal fornitore
        supplier_payment_plan: v.optional(v.any()), // piano di pagamento proposto dal fornitore
        created_by: v.string(),
        created_date: v.string(),
        updated_date: v.optional(v.string()),
    }).index("by_supplier", ["supplier_id"]).index("by_status", ["status"]).index("by_cantiere", ["cantiere_id"]).index("by_quote", ["quote_id"]),

    // Supplier Orders (Ordini Confermati) — modifiable ONLY by supplier
    supplier_orders: defineTable({
        supplier_id: v.id("suppliers"),
        request_id: v.id("supplier_requests"),
        order_number: v.optional(v.string()),
        items: v.optional(v.any()), // JSON array of order items
        total_amount: v.optional(v.number()),
        status: v.string(), // confirmed | in_production | ready | shipped | delivered
        delivery_date: v.optional(v.string()),
        notes: v.optional(v.string()),
        supplier_notes: v.optional(v.string()),
        cantiere_id: v.optional(v.id("cantieri")),
        quote_id: v.optional(v.id("quotes")), // Added for Quote-to-Order flow
        // Workflow 9 passi — state machine fields
        workflow_step: v.optional(v.number()), // 1-9 current step
        workflow_status: v.optional(v.string()), // step status label
        locked: v.optional(v.boolean()), // LOCK after production starts — no modifications allowed
        produzione_sbloccata: v.optional(v.boolean()), // true when step 9 complete and fornitore confirms
        acconto_paid: v.optional(v.boolean()), // gate: production only when acconto received
        acconto_payment_id: v.optional(v.id("payments")), // linked acconto payment
        acconto_percentage: v.optional(v.number()), // % of total
        quote_pdf_url: v.optional(v.string()), // PDF preventivo fornitore (step ③)
        client_quote_pdf_url: v.optional(v.string()), // PDF inviato al cliente (step ⑤)
        production_started_date: v.optional(v.string()), // Triggered when fornitore confirms payment
        production_phase: v.optional(v.number()), // 0-N current phase index
        // Workflow history log — every step change recorded
        workflow_history: v.optional(v.array(v.object({
            step: v.number(),
            label: v.string(),
            action: v.string(),
            user: v.string(),
            timestamp: v.string(),
        }))),
        created_date: v.string(),
        updated_date: v.optional(v.string()),
        updated_by: v.optional(v.string()),
        payment_proposal: v.optional(v.array(v.object({
            amount: v.number(),
            due_date: v.string(),
            description: v.string(),
        }))),
        payment_proposal_notes: v.optional(v.string()),
        payment_proposal_status: v.optional(v.string()), // pending | accepted | rejected
        material_cost: v.optional(v.number()), // NEW: Material costs for this order
        withholding_tax: v.optional(v.number()), // NEW: Withholding tax amount
    }).index("by_supplier", ["supplier_id"])
        .index("by_request", ["request_id"])
        .index("by_status", ["status"])
        .index("by_cantiere", ["cantiere_id"])
        .index("by_quote", ["quote_id"]),

    // Supplier Production (Produzione) — timeline linked to confirmed order
    supplier_production: defineTable({
        order_id: v.id("supplier_orders"),
        supplier_id: v.id("suppliers"),
        phase: v.string(), // materiali_ricevuti | taglio | assemblaggio | controllo_qualita | pronto
        status: v.string(), // pending | in_progress | completed
        started_date: v.optional(v.string()),
        completed_date: v.optional(v.string()),
        estimated_completion: v.optional(v.string()),
        notes: v.optional(v.string()),
        progress_percentage: v.optional(v.number()), // 0-100
        updated_by: v.optional(v.string()),
        updated_date: v.optional(v.string()),
    }).index("by_order", ["order_id"]).index("by_supplier", ["supplier_id"]).index("by_status", ["status"]),

    // Supplier Deliveries (Consegne) — 3 states: partito, in_transito, consegnato
    supplier_deliveries: defineTable({
        order_id: v.id("supplier_orders"),
        supplier_id: v.id("suppliers"),
        status: v.string(), // partito | in_transito | consegnato
        departure_date: v.optional(v.string()),
        estimated_arrival: v.optional(v.string()),
        delivery_date: v.optional(v.string()),
        delivery_confirmed_by: v.optional(v.string()), // Platform admin confirms receipt
        tracking_number: v.optional(v.string()),
        // Driver info — for contacting the delivery driver
        driver_name: v.optional(v.string()),
        driver_phone: v.optional(v.string()),
        driver_vehicle: v.optional(v.string()), // Vehicle plate/description
        documents: v.optional(v.array(v.string())), // delivery documents (storage IDs)
        notes: v.optional(v.string()),
        cantiere_id: v.optional(v.id("cantieri")),
        // Task 13: Calendar fields — date progression: estimated → confirmed → client
        confirmed_arrival: v.optional(v.string()), // fornitore confirms this date
        client_delivery_date: v.optional(v.string()), // Admin sets this with the client
        delivery_type: v.optional(v.string()), // edilizia | infissi
        // Advance notification flags
        advance_notified_24h: v.optional(v.boolean()),
        advance_notified_48h: v.optional(v.boolean()),
        advance_notified_1w: v.optional(v.boolean()),
        created_date: v.string(),
        updated_date: v.optional(v.string()),
    }).index("by_order", ["order_id"]).index("by_supplier", ["supplier_id"]).index("by_status", ["status"]).index("by_cantiere", ["cantiere_id"]),

    // ============ COLLABORATORI ============

    // Collaborator Registry
    collaborators: defineTable({
        user_id: v.optional(v.id("users")), // linked user account
        full_name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        type: v.string(), // internal | external
        job_title: v.string(),
        status: v.string(), // active | inactive | on_leave
        live_status: v.optional(v.string()), // in_cantiere | in_ufficio | disponibile | non_disponibile
        live_location: v.optional(v.string()), // coordinate gps o nome cantiere
        assigned_cantieri: v.optional(v.array(v.id("cantieri"))),
        fiscal_code: v.optional(v.string()),
        contract_type: v.optional(v.string()), // tempo_pieno | tempo_parziale | freelance | subappalto
        hourly_rate: v.optional(v.number()),
        salary: v.optional(v.number()), // monthly for internal
        payment_frequency: v.optional(v.string()), // monthly
        location_type: v.optional(v.string()), // site | showroom
        onboarding_token: v.optional(v.string()), // for WhatsApp link onboarding
        onboarding_expires: v.optional(v.string()), // expiration date
        temporary_password: v.optional(v.string()), // NEW: Temporary password for first activation
        notes: v.optional(v.string()),
        iban: v.optional(v.string()), // NEW: Collaborator IBAN
        iban_name: v.optional(v.string()), // NEW: Collaborator IBAN Holder Name
        documents: v.optional(v.array(v.string())), // storage IDs
        contract_start_date: v.optional(v.string()),
        contract_end_date: v.optional(v.string()),
        created_by: v.string(),
        created_date: v.string(),
    }).index("by_email", ["email"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_user", ["user_id"])
    .index("by_onboarding", ["onboarding_token"]),

    // Job Titles Registry - NEW
    job_titles: defineTable({
        title: v.string(),
        category: v.string(), // construction | office | other
        created_by: v.string(),
        created_date: v.string(),
    }).index("by_category", ["category"]).index("by_title", ["title"]),

    // Collaborator Hours Tracking
    collaborator_hours: defineTable({
        collaborator_id: v.id("collaborators"),
        cantiere_id: v.optional(v.id("cantieri")),
        date: v.string(),
        hours_worked: v.number(),
        description: v.optional(v.string()),
        approved: v.optional(v.boolean()),
        approved_by: v.optional(v.string()),
        created_date: v.string(),
    }).index("by_collaborator", ["collaborator_id"]).index("by_cantiere", ["cantiere_id"]).index("by_date", ["date"]),

    // ============ CERTIFICATI (Certificates) ============

    certificates: defineTable({
        title: v.string(),
        category: v.string(), // edilizia | infissi | documenti
        subcategory: v.optional(v.string()), // conformita, permessi, collaudi, CE, trasmittanza, acustica
        description: v.optional(v.string()),
        file_url: v.string(), // storage ID
        file_name: v.string(),
        file_type: v.optional(v.string()),
        file_size: v.optional(v.number()),
        issue_date: v.optional(v.string()),
        expiry_date: v.optional(v.string()),
        status: v.string(), // valid | expiring | expired
        cantiere_id: v.optional(v.id("cantieri")),
        collaborator_id: v.optional(v.id("collaborators")),
        supplier_id: v.optional(v.id("suppliers")),
        client_id: v.optional(v.id("clients")),
        created_by: v.string(),
        created_date: v.string(),
        alert_sent: v.optional(v.boolean()),
    }).index("by_category", ["category"]).index("by_status", ["status"]).index("by_expiry", ["expiry_date"]).index("by_cantiere", ["cantiere_id"]).index("by_collaborator", ["collaborator_id"]),

    // ============ PAGAMENTI (Payments) ============

    payments: defineTable({
        type: v.string(), // supplier | collaborator | client
        reference_id: v.string(), // ID of supplier/collaborator/client
        reference_name: v.optional(v.string()),
        // Linked entities
        supplier_id: v.optional(v.id("suppliers")),
        collaborator_id: v.optional(v.id("collaborators")),
        client_id: v.optional(v.id("clients")),
        order_id: v.optional(v.id("supplier_orders")),
        cantiere_id: v.optional(v.id("cantieri")),
        quote_id: v.optional(v.id("quotes")),
        // Payment details
        description: v.string(),
        amount: v.number(),
        payment_type: v.optional(v.string()), // acconto | saldo | rata | fattura
        due_date: v.optional(v.string()),
        paid_date: v.optional(v.string()),
        status: v.string(), // in_attesa | in_verifica | pagato | in_ritardo | parziale
        invoice_number: v.optional(v.string()),
        invoice_url: v.optional(v.string()), // storage ID
        proof_url: v.optional(v.string()), // storage ID of payment proof (photo/screenshot)
        confirmation_notes: v.optional(v.string()), // Notes from the verifier
        recipient_notes: v.optional(v.string()), // Notes from the recipient
        sender_role: v.optional(v.string()), // who should pay and upload proof (client | admin)
        notes: v.optional(v.string()),
        sent_at: v.optional(v.string()), // When admin marked as paid
        received_at: v.optional(v.string()), // When recipient marked as received
        // Partial payment tracking
        confirmed_amount: v.optional(v.number()), // actual amount confirmed by verifier
        partial_amount: v.optional(v.number()), // amount actually paid (if partial)
        remaining_amount: v.optional(v.number()), // dovuto - pagato
        // PDF documents
        pdf_invoice_url: v.optional(v.string()), // generated invoice PDF
        pdf_receipt_url: v.optional(v.string()), // generated receipt PDF
        // Rejection tracking
        rejection_reason: v.optional(v.string()),
        rejection_notes: v.optional(v.string()),
        rejected_at: v.optional(v.string()),
        rejected_by: v.optional(v.string()),
        created_by: v.string(),
        created_date: v.string(),
        updated_date: v.optional(v.string()),
    }).index("by_type", ["type"]).index("by_status", ["status"]).index("by_supplier", ["supplier_id"]).index("by_collaborator", ["collaborator_id"]).index("by_client", ["client_id"]).index("by_cantiere", ["cantiere_id"]).index("by_due_date", ["due_date"]),

    // ============ COMUNICAZIONI INTERNE (Internal Messages) ============

    internal_messages: defineTable({
        // Channel — who is this conversation with
        channel_type: v.string(), // supplier | collaborator | delivery
        channel_id: v.string(), // ID of the supplier/collaborator/delivery
        channel_name: v.optional(v.string()), // Display name for the channel
        // Message content
        sender_email: v.string(),
        sender_name: v.optional(v.string()),
        sender_role: v.optional(v.string()), // admin | supplier | collaborator | driver
        message: v.string(),
        message_type: v.optional(v.string()), // text | system | alert | file | voice
        attachments: v.optional(v.array(v.string())), // storage IDs
        // Task 6: Media/file support for advanced chat
        file_url: v.optional(v.string()), // File/media URL from Convex storage
        file_name: v.optional(v.string()), // Original filename
        file_type: v.optional(v.string()), // image | video | voice | document
        file_size: v.optional(v.number()), // Size in bytes
        // Status
        read: v.optional(v.boolean()),
        read_date: v.optional(v.string()),
        created_date: v.string(),
    }).index("by_channel", ["channel_type", "channel_id"])
        .index("by_sender", ["sender_email"])
        .index("by_read", ["channel_type", "channel_id", "read"]),

    // ============ IMPOSTAZIONI SISTEMA PAGAMENTI ============

    payment_settings: defineTable({
        // Global split percentages
        acconto_b2c_pct: v.optional(v.number()), // default acconto % for B2C
        acconto_b2b_pct: v.optional(v.number()), // default acconto % for B2B
        intermedio_pct: v.optional(v.number()), // intermediate payment %
        saldo_pct: v.optional(v.number()), // final balance %
        // Per-client overrides
        custom_client_overrides: v.optional(v.array(v.object({
            client_id: v.string(),
            acconto_pct: v.number(),
            intermedio_pct: v.optional(v.number()),
            saldo_pct: v.number(),
        }))),
        // Per-supplier overrides
        custom_supplier_overrides: v.optional(v.array(v.object({
            supplier_id: v.string(),
            acconto_pct: v.number(),
            saldo_pct: v.number(),
        }))),
        created_by: v.string(),
        updated_date: v.string(),
    }),

    // ============ REFERRAL CODES (Marketing) ============
    referral_codes: defineTable({
        code: v.string(),
        description: v.optional(v.string()),
        discount_percent: v.number(),
        is_active: v.boolean(),
        max_uses: v.optional(v.number()),
        uses_count: v.number(),
        created_by: v.string(),
        created_date: v.string(),
    }).index("by_code", ["code"]).index("by_active", ["is_active"]),

    // Rate Limiting
    rate_limits: defineTable({
        key: v.string(), // action:identifier
        count: v.number(),
        window_start: v.number(),
    }).index("by_key", ["key"]),

    // ============ PREZZI EDILIZIA (Admin-configurable) ============
    edilizia_prices: defineTable({
        // Base price per MQ
        price_per_mq: v.number(),
        // Location multipliers
        multiplier_nord: v.number(),
        multiplier_centro: v.number(),
        multiplier_sud: v.number(),
        // Property type multipliers
        multiplier_villa: v.number(),
        multiplier_casale: v.number(),
        multiplier_appartamento: v.number(),
        // Conservation multipliers
        multiplier_media: v.number(),
        multiplier_degradato: v.number(),
        // Tramezzi (extra per MQ)
        tramezzi_20: v.number(),
        tramezzi_50: v.number(),
        tramezzi_100: v.number(),
        // Electrical (per MQ)
        elettrico_piccole: v.number(),
        elettrico_standard: v.number(),
        elettrico_domotico: v.number(),
        // Heating (per MQ, only adeguamento)
        riscaldamento_adeguamento: v.number(),
        // Quality extra multiplier (0.20 = +20%)
        finiture_alta_qualita_extra: v.number(),
        // Completamento
        controsoffittature_mq: v.number(),
        porta_unit: v.number(),
        finestra_unit: v.number(),
        parquet_mq: v.number(),
        marmo_mq: v.number(),
        monocottura_mq: v.number(),
        resina_mq: v.number(),
        bagno_unit: v.number(),
        pittura_mq: v.number(),
        updated_by: v.optional(v.string()),
        updated_date: v.string(),
    }).index("by_date", ["updated_date"]),
});
