import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { checkAdminOrCeo } from "./util/auth";
import { api } from "./_generated/api";
import { checkRateLimit, RATE_LIMITS } from "./util/rateLimit";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const quotes = await ctx.db
            .query("quotes")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .order("desc")
            .collect();

        return await Promise.all(quotes.map(async (q) => ({
            ...q,
            files: q.files ? await Promise.all(q.files.map(async (f) =>
                (f && !f.startsWith('http')) ? (await ctx.storage.getUrl(f as Id<"_storage">) ?? f) : f
            )) : []
        })));
    },

});

export const getByUser = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        // Require authentication; only admin or the user themselves may query
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const isSelf = identity.email === args.email;
        if (!isSelf) {
            const requester = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();
            const isAdmin = requester?.role === "admin" || requester?.role === "superadmin";
            if (!isAdmin) return [];
        }

        const quotes = await ctx.db
            .query("quotes")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .order("desc")
            .collect();

        return await Promise.all(quotes.map(async (q) => ({
            ...q,
            files: q.files ? await Promise.all(q.files.map(async (f) =>
                (f && !f.startsWith('http')) ? (await ctx.storage.getUrl(f as Id<"_storage">) ?? f) : f
            )) : []
        })));
    },
});

// Get quotes linked to a cantiere
export const getByCantiere = query({
    args: { cantiere_id: v.id("cantieri") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Only admin or the client linked to this cantiere may view its quotes
        const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
        const isAdmin = user?.role === "admin" || user?.role === "superadmin";
        if (!isAdmin) {
            const cantiere = await ctx.db.get(args.cantiere_id);
            if (!cantiere) return [];
            // Check caller is the linked client
            if (cantiere.client_email && cantiere.client_email !== identity.email) return [];
        }

        const quotes = await ctx.db
            .query("quotes")
            .filter((q) => q.eq(q.field("cantiere_id"), args.cantiere_id))
            .order("desc")
            .collect();

        return await Promise.all(quotes.map(async (q) => ({
            ...q,
            files: q.files ? await Promise.all(q.files.map(async (f) =>
                (f && !f.startsWith('http')) ? (await ctx.storage.getUrl(f as Id<"_storage">) ?? f) : f
            )) : []
        })));
    },
});

// Get all quotes for admin view
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        try { await checkAdminOrCeo(ctx); } catch { return []; }

        const quotes = await ctx.db
            .query("quotes")
            .order("desc")
            .collect();

        return await Promise.all(quotes.map(async (q) => ({
            ...q,
            files: q.files ? await Promise.all(q.files.map(async (f) =>
                (f && !f.startsWith('http')) ? (await ctx.storage.getUrl(f as Id<"_storage">) ?? f) : f
            )) : []
        })));
    },
});

export const getById = query({
    args: { id: v.id("quotes") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const quote = await ctx.db.get(args.id);
        if (!quote) return null;
        // Admin sees all; users only their own quotes
        const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
        if (user?.role === "admin" || user?.role === "superadmin") return quote;
        if (quote.email === identity.email) return quote;
        return null;
    },
});

export const updateStatus = mutation({
    args: { id: v.id("quotes"), status: v.string() },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Role check
        await ctx.db.patch(args.id, { status: args.status });

        // Fetch quote to get email
        const quote = await ctx.db.get(args.id);
        if (quote) {
            if (quote.email) {
                await ctx.scheduler.runAfter(0, api.actions.sendEmail, {
                    to: quote.email,
                    subject: `Aggiornamento Preventivo: ${args.status}`,
                    html: `<p>Il tuo preventivo è stato aggiornato allo stato: <strong>${args.status}</strong>.</p>`
                });
                // T05: In-app notification to client when quote is sent
                if (args.status === "sent") {
                    await ctx.db.insert("notifications", {
                        user_email: quote.email,
                        type: "quote_sent",
                        priority: "high",
                        read: false,
                        title: "Preventivo Disponibile 📋",
                        message: `Il tuo preventivo è pronto. Accedi a IWHome per visualizzarlo e rispondere.`,
                        link: "/Preventivi",
                        created_date: new Date().toISOString(),
                    });
                }
            }

            // Activity Log
            const identity = await ctx.auth.getUserIdentity();
            if (identity) {
                await ctx.db.insert("activity_log", {
                    action: "updated",
                    entity_type: "quote",
                    entity_id: args.id,
                    entity_name: quote.full_name || "Preventivo",
                    user_name: identity.name || identity.email!,
                    user_email: identity.email!,
                    details: `Stato preventivo aggiornato a: ${args.status}`,
                    created_date: new Date().toISOString(),
                });
            }
        }
    },
});

// Link a quote to a cantiere
export const linkToCantiere = mutation({
    args: {
        quote_id: v.id("quotes"),
        cantiere_id: v.id("cantieri"),
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Role check

        // Update quote with cantiere link
        await ctx.db.patch(args.quote_id, { cantiere_id: args.cantiere_id });

        // Update cantiere with quote in preventivi_collegati
        const cantiere = await ctx.db.get(args.cantiere_id);
        if (cantiere) {
            const existing = cantiere.preventivi_collegati || [];
            if (!existing.includes(args.quote_id)) {
                await ctx.db.patch(args.cantiere_id, {
                    preventivi_collegati: [...existing, args.quote_id]
                });
            }
        }
    },
});

// Unlink a quote from cantiere
export const unlinkFromCantiere = mutation({
    args: { quote_id: v.id("quotes") },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Role check

        const quote = await ctx.db.get(args.quote_id);
        if (!quote || !quote.cantiere_id) return;

        const cantiereId = quote.cantiere_id;

        // Remove link from quote
        await ctx.db.patch(args.quote_id, { cantiere_id: undefined });

        // Remove from cantiere's preventivi_collegati
        const cantiere = await ctx.db.get(cantiereId);
        if (cantiere && cantiere.preventivi_collegati) {
            await ctx.db.patch(cantiereId, {
                preventivi_collegati: cantiere.preventivi_collegati.filter(id => id !== args.quote_id)
            });
        }
    },
});

export const createRequest = mutation({
    args: {
        title: v.optional(v.string()),
        full_name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        notes: v.optional(v.string()),
        quote_type: v.string(), // infissi, ristrutturazione, etc.
        files: v.optional(v.array(v.string())),
        request_title: v.optional(v.string()),
        material_category: v.optional(v.string()),
        attachment_photos: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Rate limit: 3 quote requests per hour per user
        await checkRateLimit(ctx, "create_quote_request", identity.email!, RATE_LIMITS.CREATE_QUOTE_REQUEST);

        // 1. Find user and ensure client role (or upgrade if basic user)
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (user && user.role === "user") {
            await ctx.db.patch(user._id, { role: "client" });
        }

        // 2. Insert as a quote with status 'request'
        const id = await ctx.db.insert("quotes", {
            title: args.title,
            full_name: args.full_name,
            email: args.email,
            phone: args.phone,
            notes: args.notes,
            status: "request",
            quote_type: args.quote_type,
            files: args.files,
            request_title: args.request_title,
            material_category: args.material_category,
            attachment_photos: args.attachment_photos,
            created_date: new Date().toISOString(),
        });

        // 3. Activity Log
        await ctx.db.insert("activity_log", {
            action: "created",
            entity_type: "quote_request",
            entity_id: id,
            entity_name: `Richiesta da ${args.full_name}`,
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Nuova richiesta preventivo inviata dal cliente`,
            created_date: new Date().toISOString(),
        });

        // 4. Send Notifications (Client confirmation + Admin alert)
        await ctx.scheduler.runAfter(0, api.actions.sendEmail, {
            to: args.email,
            subject: `Conferma Ricezione Richiesta Preventivo - IwHome`,
            html: `<p>Ciao <strong>${args.full_name}</strong>,</p><p>La tua richiesta di preventivo è stata inviata con successo. Sarai contattato presto dal nostro team.</p>`
        });

        // Notify all admins dynamically
        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.scheduler.runAfter(0, api.actions.sendEmail, {
                to: admin.email,
                subject: `Nuova Richiesta Preventivo: ${args.full_name}`,
                html: `<p>È stata ricevuta una nuova richiesta di preventivo da <strong>${args.full_name}</strong> (${args.email}).</p><p>Tipo: ${args.quote_type}</p><p>Telefono: ${args.phone || 'Non specificato'}</p><p>Note: ${args.notes || 'Nessuna nota'}</p>`
            });
        }

        return id;
    },
});

// Public quote submission — no auth required (used by Calcolatore for all users).
// email, phone and full_name are mandatory so admin can follow up.
export const createPublic = mutation({
    args: {
        full_name: v.string(),
        email: v.string(),
        phone: v.string(),
        notes: v.optional(v.string()),
        quote_type: v.string(),
        estimated_price: v.optional(v.number()),
        window_config: v.optional(v.any()),
        project_config: v.optional(v.any()),
        request_title: v.optional(v.string()),
        material_category: v.optional(v.string()),
        attachment_photos: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        // CRITICAL: Insert the quote record.
        // Explicit field mapping — never spread args into insert (mutation types differ from schema).
        // Conditional spread avoids explicit `undefined` values, which are not valid Convex values.
        const id = await ctx.db.insert("quotes", {
            full_name: args.full_name,
            email: args.email,
            phone: args.phone,
            status: "draft",
            quote_type: args.quote_type,
            created_date: new Date().toISOString(),
            ...(args.notes !== undefined && { notes: args.notes }),
            ...(args.estimated_price !== undefined && { estimated_price: args.estimated_price }),
            ...(args.window_config !== undefined && { window_config: args.window_config }),
            ...(args.project_config !== undefined && { project_config: args.project_config }),
            ...(args.request_title !== undefined && { request_title: args.request_title }),
            ...(args.material_category !== undefined && { material_category: args.material_category }),
            ...(args.attachment_photos !== undefined && { attachment_photos: args.attachment_photos }),
        });

        // NON-CRITICAL: Schedule confirmation email.
        // Wrapped in try/catch — email failure must never crash the quote submission.
        // Convex scheduler args must not contain `undefined` (not a valid Convex value) — use null.
        try {
            await ctx.scheduler.runAfter(0, api.actions.sendCalculatorEmail, {
                to: args.email,
                quoteDetails: {
                    full_name: args.full_name,
                    phone: args.phone,
                    quote_type: args.quote_type,
                    estimated_price: args.estimated_price ?? null,
                    notes: args.notes ?? null,
                    window_config: args.window_config ?? null,
                    project_config: args.project_config ?? null,
                },
            });
        } catch (e) {
            console.error("[createPublic] email schedule failed:", e);
        }

        // NON-CRITICAL: Notify all admins in-app.
        // Wrapped in try/catch — notification failure must never crash the quote submission.
        try {
            const admins = await ctx.db
                .query("users")
                .withIndex("by_role", (q) => q.eq("role", "admin"))
                .collect();
            for (const admin of admins) {
                if (!admin.email) continue;
                await ctx.db.insert("notifications", {
                    user_email: admin.email,
                    type: "quote_request",
                    priority: "high",
                    read: false,
                    title: "Nuova Richiesta Preventivo",
                    message: `${args.full_name} (${args.email}) ha inviato una richiesta di preventivo dal calcolatore.`,
                    link: "/Preventivi",
                    sender_email: args.email,
                    created_date: new Date().toISOString(),
                });
            }
        } catch (e) {
            console.error("[createPublic] admin notifications failed:", e);
        }

        return id;
    },
});

export const create = mutation({
    args: {
        full_name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        notes: v.optional(v.string()),
        status: v.string(),
        quote_type: v.string(),
        estimated_price: v.optional(v.number()),
        files: v.optional(v.array(v.string())),
        created_date: v.string(),
        window_config: v.optional(v.any()), // accepting any JSON object
        project_config: v.optional(v.any()),
        cantiere_id: v.optional(v.id("cantieri")),
        client_id: v.optional(v.id("clients")),
    },
    handler: async (ctx, args) => {
        // Require authentication — public quote requests use quotes.createRequest instead
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const id = await ctx.db.insert("quotes", args);

        if (args.email) await ctx.scheduler.runAfter(0, api.actions.sendCalculatorEmail, {
            to: args.email,
            quoteDetails: {
                full_name: args.full_name,
                phone: args.phone,
                quote_type: args.quote_type,
                estimated_price: args.estimated_price,
                notes: args.notes,
                window_config: args.window_config,
                project_config: args.project_config,
            }
        });

        // If cantiere_id is provided, link it in cantieri table too
        // SECURITY: Only allow this if user is Admin/CEO
        if (args.cantiere_id) {
            let isAdmin = false;
            try {
                await checkAdminOrCeo(ctx);
                isAdmin = true;
            } catch (e) { isAdmin = false; }

            if (isAdmin) {
                const cantiere = await ctx.db.get(args.cantiere_id);
                if (cantiere) {
                    const existing = cantiere.preventivi_collegati || [];
                    if (!existing.includes(id)) {
                        await ctx.db.patch(args.cantiere_id, {
                            preventivi_collegati: [...existing, id]
                        });
                    }
                }
            }
        }

        if (identity) {
            await ctx.db.insert("activity_log", {
                action: "created",
                entity_type: "quote",
                entity_id: id,
                entity_name: args.full_name || "Nuovo Preventivo",
                user_name: identity.name || identity.email!,
                user_email: identity.email!,
                details: `Nuovo preventivo creato per: ${args.email}`,
                created_date: new Date().toISOString(),
            });
        }

        return id;
    },
});

// Link a quote to a client
export const linkToClient = mutation({
    args: {
        quote_id: v.id("quotes"),
        client_id: v.id("clients"),
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx);
        await ctx.db.patch(args.quote_id, { client_id: args.client_id });
    },
});

// Unlink a quote from a client
export const unlinkFromClient = mutation({
    args: { quote_id: v.id("quotes") },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx);
        await ctx.db.patch(args.quote_id, { client_id: undefined });
    },
});

// Client selects their preferred IWHome quote version
export const selectQuoteVersion = mutation({
    args: {
        quote_id: v.id("quotes"),
        doc_id: v.id("documents"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");
        const quote = await ctx.db.get(args.quote_id);
        if (!quote) throw new Error("Quote not found");
        if (quote.email !== identity.email) throw new Error("Unauthorized");
        await ctx.db.patch(args.quote_id, { client_selected_version_doc_id: args.doc_id });
    },
});

// Client responds to a quote (accept/reject) - no admin required
export const respondToQuote = mutation({
    args: {
        quote_id: v.id("quotes"),
        response: v.union(v.literal("accepted"), v.literal("rejected")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const quote = await ctx.db.get(args.quote_id);
        if (!quote) throw new Error("Quote not found");

        // Only the quote owner can respond
        if (quote.email !== identity.email) {
            throw new Error("Unauthorized: You can only respond to your own quotes");
        }

        // Only allow responding to sent quotes
        if (quote.status !== "sent") {
            throw new Error("This quote is not available for response");
        }

        await ctx.db.patch(args.quote_id, { status: args.response });

        // Task 7: Create payment record when client accepts
        if (args.response === "accepted" && quote.estimated_price && quote.estimated_price > 0) {
            // Find client record by email
            const clientRecord = await ctx.db
                .query("clients")
                .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
                .first();

            // Check no payment already exists for this quote
            const existingPayment = await ctx.db
                .query("payments")
                .filter((q: any) => q.eq(q.field("quote_id"), args.quote_id))
                .first();

            if (!existingPayment) {
                // Acconto: use admin-set percentage if available, else 40% B2B / 30% B2C
                const isB2B = clientRecord?.client_type === "b2b";
                const accontoPct = (quote as any).acconto_percentage ?? (isB2B ? 40 : 30);
                const accontoAmount = Math.round((quote.estimated_price * accontoPct) / 100 * 100) / 100;

                await ctx.db.insert("payments", {
                    type: "client",
                    reference_id: identity.email!,
                    reference_name: quote.full_name || identity.email!,
                    client_id: clientRecord?._id || quote.client_id,
                    quote_id: args.quote_id,
                    description: `Acconto ${accontoPct}% — ${quote.full_name || identity.email!}`,
                    amount: accontoAmount,
                    payment_type: "acconto",
                    status: "in_attesa",
                    created_by: "system",
                    created_date: new Date().toISOString(),
                });

                // Notify CLIENT: informational — not "pay now urgency"
                await ctx.db.insert("notifications", {
                    user_email: identity.email!,
                    type: "quote_accepted_confirmation",
                    priority: "normal",
                    read: false,
                    title: "Preventivo Accettato ✅",
                    message: `Hai accettato il preventivo. IWHome ti contatterà per il pagamento dell'acconto di €${accontoAmount.toFixed(2)}.`,
                    link: "/Preventivi",
                    created_date: new Date().toISOString(),
                });

                // Notify ADMINS: client accepted, acconto pending
                const accontoAdmins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
                for (const adm of accontoAdmins) {
                    if (!adm.email) continue;
                    await ctx.db.insert("notifications", {
                        user_email: adm.email,
                        type: "quote_accepted",
                        priority: "high",
                        read: false,
                        title: "Preventivo Accettato dal Cliente 🎉",
                        message: `${quote.full_name || identity.email!} ha accettato il preventivo da €${quote.estimated_price}. Acconto richiesto: €${accontoAmount.toFixed(2)} (${accontoPct}%).`,
                        link: "/Preventivi",
                        created_date: new Date().toISOString(),
                        sender_email: identity.email!,
                    });
                }
            }
        }

        // Auto-create admin→supplier payment when client accepts
        if (args.response === "accepted") {
            const linkedRequest = await ctx.db
                .query("supplier_requests")
                .withIndex("by_quote", (q: any) => q.eq("quote_id", args.quote_id))
                .filter((q: any) => q.eq(q.field("status"), "accepted"))
                .first();

            if (linkedRequest && linkedRequest.quoted_price && linkedRequest.quoted_price > 0) {
                const existingSupplierPayment = await ctx.db
                    .query("payments")
                    .filter((q: any) =>
                        q.and(
                            q.eq(q.field("type"), "supplier"),
                            q.eq(q.field("quote_id"), args.quote_id)
                        )
                    )
                    .first();

                if (!existingSupplierPayment) {
                    const supplier = await ctx.db.get(linkedRequest.supplier_id);
                    const supplierAccontoPct = (linkedRequest as any).supplier_acconto_percentage ?? 50;
                    const supplierAccontoAmt = Math.round(linkedRequest.quoted_price * supplierAccontoPct / 100 * 100) / 100;

                    await ctx.db.insert("payments", {
                        type: "supplier",
                        reference_id: supplier?.email || linkedRequest.supplier_id.toString(),
                        reference_name: supplier?.name,
                        supplier_id: linkedRequest.supplier_id,
                        quote_id: args.quote_id,
                        description: `Acconto Fornitore ${supplierAccontoPct}% — ${supplier?.name || "Fornitore"}`,
                        amount: supplierAccontoAmt,
                        payment_type: "acconto",
                        status: "in_attesa",
                        created_by: "system",
                        created_date: new Date().toISOString(),
                    });

                    // Alert admins about the supplier payment to manage
                    const payAdmins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
                    for (const adm of payAdmins) {
                        if (!adm.email) continue;
                        await ctx.db.insert("notifications", {
                            user_email: adm.email,
                            type: "supplier_payment_pending",
                            priority: "high",
                            read: false,
                            title: "Pagamento Fornitore Creato 💳",
                            message: `${quote.full_name || identity.email!} ha accettato. Pagamento creato per ${supplier?.name || "fornitore"}: €${supplierAccontoAmt.toFixed(2)} (acconto ${supplierAccontoPct}%). Vai in Pagamenti per gestirlo.`,
                            link: "/Pagamenti",
                            created_date: new Date().toISOString(),
                        });
                    }
                }
            }
        }

        // Notify all admins dynamically
        const admins = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).collect();
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.scheduler.runAfter(0, api.actions.sendEmail, {
                to: admin.email,
                subject: `Preventivo ${args.response === "accepted" ? "Accettato" : "Rifiutato"} - ${quote.full_name || quote.email}`,
                html: `<p>Il cliente <strong>${quote.full_name || quote.email}</strong> ha <strong>${args.response === "accepted" ? "accettato" : "rifiutato"}</strong> il preventivo.</p>`
            });
        }

        await ctx.db.insert("activity_log", {
            action: args.response,
            entity_type: "quote",
            entity_id: args.quote_id,
            entity_name: quote.full_name || "Preventivo",
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Preventivo ${args.response === "accepted" ? "accettato" : "rifiutato"} dal cliente`,
            created_date: new Date().toISOString(),
        });

        return { success: true };
    },
});

// Respond to quote - end of previous function

export const deleteQuote = mutation({
    args: {
        id: v.id("quotes"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const quote = await ctx.db.get(args.id);
        if (!quote) throw new Error("Quote not found");

        // Authorization: admin can delete any quote; non-admin can only delete their own
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        const isAdmin = user?.role === "admin" || user?.role === "superadmin";
        const isOwner = quote.email === identity.email;
        if (!isAdmin && !isOwner) {
            throw new Error("Unauthorized: you can only delete your own quotes");
        }

        // Unlink from Cantiere if exists
        if (quote.cantiere_id) {
            const cantiere = await ctx.db.get(quote.cantiere_id);
            if (cantiere && cantiere.preventivi_collegati) {
                await ctx.db.patch(quote.cantiere_id, {
                    preventivi_collegati: cantiere.preventivi_collegati.filter(id => id !== args.id)
                });
            }
        }

        // Unlink from Linked Documents (optional, or just leave them)
        // Ideally should remove `quote_id` from documents
        /*
        const docs = await ctx.db.query("documents").withIndex("by_quote", q => q.eq("quote_id", args.id)).collect();
        for (const doc of docs) {
            await ctx.db.patch(doc._id, { quote_id: undefined });
        }
        */

        await ctx.db.delete(args.id);

        // Activity Log
        await ctx.db.insert("activity_log", {
            action: "deleted",
            entity_type: "quote",
            entity_id: args.id,
            entity_name: quote.full_name || "Preventivo",
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Preventivo eliminato per: ${quote.email}`,
            created_date: new Date().toISOString(),
        });
    },
});

export const finalizeQuote = mutation({
    args: {
        document_id: v.id("documents"),
        quote_id: v.optional(v.id("quotes")), // If updating existing
        client_email: v.string(),
        client_name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await checkAdminOrCeo(ctx); // Admin/CEO only — clients must not self-finalize
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // 1. Mark document as definitive
        await ctx.db.patch(args.document_id, { status: "definitive" });
        const doc = await ctx.db.get(args.document_id);
        if (!doc) throw new Error("Document not found");

        // 2. Find or Create Client
        const existingClient = await ctx.db
            .query("clients")
            .withIndex("by_email", (q) => q.eq("email", args.client_email))
            .first();

        let clientId = existingClient?._id;

        if (!existingClient) {
            // Check if they are a user
            const user = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", args.client_email))
                .first();

            if (user) {
                clientId = await ctx.db.insert("clients", {
                    full_name: user.fullName || args.client_name || args.client_email,
                    email: args.client_email,
                    status: "lead",
                    created_by: identity.email!,
                    created_date: new Date().toISOString(),
                });
            } else {
                clientId = await ctx.db.insert("clients", {
                    full_name: args.client_name || args.client_email,
                    email: args.client_email,
                    status: "lead",
                    created_by: identity.email!,
                    created_date: new Date().toISOString(),
                });
            }
        }

        // 3. Create or Update Quote
        let quoteId = args.quote_id;

        if (quoteId) {
            await ctx.db.patch(quoteId, {
                status: "accepted",
                client_id: clientId,
            });
        } else {
            // Create new Quote entry derived from Document
            quoteId = await ctx.db.insert("quotes", {
                full_name: args.client_name || args.client_email,
                email: args.client_email,
                status: "accepted",
                quote_type: "custom", // Generic type
                created_date: new Date().toISOString(),
                client_id: clientId,
                files: [doc.file_url],
                notes: `Generato da negoziazione: ${doc.title}`
            });
        }

        // Link document back to quote
        await ctx.db.patch(args.document_id, { quote_id: quoteId, client_id: clientId });

        // Log activity
        await ctx.db.insert("activity_log", {
            action: "finalized",
            entity_type: "quote",
            entity_id: quoteId,
            entity_name: doc.title,
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Preventivo accettato e finalizzato via chat`,
            created_date: new Date().toISOString(),
        });

        return quoteId;
    }
});
