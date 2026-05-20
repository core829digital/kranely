import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, requireAnyAuth, getCallerInfo } from "./rbac";
import { internal } from "./_generated/api";

// ═══════════════════════════════════════════
// SUPPLIER REGISTRY (Anagrafica Fornitori)
// ═══════════════════════════════════════════

export const list = query({
    args: {},
    handler: async (ctx) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        // Suppliers see only themselves (3-tier: user_id → exact email → case-insensitive)
        if (caller.role === "supplier") {
            // Tier 1: by user_id
            const byUser = await ctx.db.query("suppliers")
                .withIndex("by_user", (q: any) => q.eq("user_id", caller.userId))
                .collect();
            if (byUser.length > 0) return byUser;
            // Tier 2: exact email
            const byEmail = await ctx.db.query("suppliers")
                .withIndex("by_email", (q: any) => q.eq("email", caller.email))
                .collect();
            if (byEmail.length > 0) return byEmail;
            // Tier 3: case-insensitive scan
            const all = await ctx.db.query("suppliers").collect();
            return all.filter(s => s.email.toLowerCase() === caller.email.toLowerCase());
        }
        // Admin/CEO see all
        if (caller.role === "admin" || caller.role === "superadmin") {
            return await ctx.db.query("suppliers").collect();
        }
        return [];
    },
});

export const getById = query({
    args: { id: v.id("suppliers") },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;
        const supplier = await ctx.db.get(args.id);
        if (!supplier) return null;
        // Suppliers can only see themselves; admin sees all
        if (caller.role === "admin" || caller.role === "superadmin") return supplier;
        if (caller.role === "supplier" && supplier.email === caller.email) return supplier;
        return null;
    },
});

// RBAC: Get supplier record linked to a user account (for supplier self-view)
export const getByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;
        // Primary lookup: by user_id (set during onboarding)
        let supplier = await ctx.db.query("suppliers")
            .withIndex("by_user", (q: any) => q.eq("user_id", args.userId))
            .first();
        // Fallback: by email (works even if onboarding wasn't completed via code)
        if (!supplier && caller.email) {
            supplier = await ctx.db.query("suppliers")
                .withIndex("by_email", (q: any) => q.eq("email", caller.email))
                .first();
        }
        // Case-insensitive fallback: admin may have stored email with different casing
        if (!supplier && caller.email) {
            const all = await ctx.db.query("suppliers").collect();
            supplier = all.find(s => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
        }
        if (!supplier) return null;
        // Only admin or the supplier themselves can see this record
        if (caller.role === "admin" || caller.role === "superadmin") return supplier;
        if (caller.role === "supplier" && supplier.email.toLowerCase() === caller.email.toLowerCase()) return supplier;
        return null;
    },
});

// Zero-arg version: returns the current supplier's own record without requiring userId param.
// 3-tier lookup: user_id index → exact email index → case-insensitive full scan.
// This is the most reliable way for a supplier to fetch their own record.
export const getByCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;
        // Only meaningful for supplier role — admins use getById/list
        if (caller.role !== "supplier") return null;

        // Tier 1: by user_id (fastest — set during onboarding or auto-link)
        let supplier = await ctx.db.query("suppliers")
            .withIndex("by_user", (q: any) => q.eq("user_id", caller.userId))
            .first();
        // Tier 2: exact email index
        if (!supplier) {
            supplier = await ctx.db.query("suppliers")
                .withIndex("by_email", (q: any) => q.eq("email", caller.email))
                .first();
        }
        // Tier 3: case-insensitive full scan (admin may have stored email with different casing)
        if (!supplier) {
            const all = await ctx.db.query("suppliers").collect();
            supplier = all.find(s => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
        }
        return supplier ?? null;
    },
});

// Diagnostic query — returns supplier record + request count for the current user.
// Helps identify whether the issue is "no record found" or "record found but no requests".
export const getMyDiagnostics = query({
    args: {},
    handler: async (ctx) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return { error: "not_authenticated", email: null, role: null, supplier: null, requestCount: 0 };

        // 3-tier lookup (same as getByCurrentUser but without role restriction)
        let supplier: any = await ctx.db.query("suppliers")
            .withIndex("by_user", (q: any) => q.eq("user_id", caller.userId))
            .first();
        if (!supplier) {
            supplier = await ctx.db.query("suppliers")
                .withIndex("by_email", (q: any) => q.eq("email", caller.email))
                .first();
        }
        if (!supplier) {
            const all = await ctx.db.query("suppliers").collect();
            supplier = all.find((s: any) => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
        }

        const requestCount = supplier
            ? (await ctx.db.query("supplier_requests")
                .withIndex("by_supplier", (q: any) => q.eq("supplier_id", supplier._id))
                .collect()).length
            : 0;

        return {
            email: caller.email,
            role: caller.role,
            userId: caller.userId,
            supplier: supplier ? { _id: supplier._id, name: supplier.name, email: supplier.email, user_id: supplier.user_id ?? null } : null,
            requestCount,
        };
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        piva: v.optional(v.string()),
        type: v.string(),
        notes: v.optional(v.string()),
        contact_person: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);

        // Task 7: Generate a unique supplier code (e.g. IWH-XXXXXX)
        const codeSuffix = Array.from({ length: 6 }, () =>
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
        ).join("");
        const supplier_code = `IWH-${codeSuffix}`;

        const id = await ctx.db.insert("suppliers", {
            ...args,
            status: "active",
            supplier_code,
            created_by: caller.email,
            created_date: new Date().toISOString(),
        });
        // Log activity
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "created",
            entity_type: "supplier",
            entity_id: id,
            entity_name: args.name,
            details: `Fornitore "${args.name}" creato con codice ${supplier_code}`,
            created_date: new Date().toISOString(),
        });
        return id;
    },
});

// Task 1: Generate a WhatsApp Invite token and set admin password
export const generateWhatsAppInvite = mutation({
    args: {
        supplierId: v.id("suppliers"),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        const supplier = await ctx.db.get(args.supplierId);
        if (!supplier) throw new Error("Fornitore non trovato");

        // Generate token and 48h expiration
        const token = Array.from({ length: 16 }, () =>
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]
        ).join("");

        const now = new Date();
        now.setHours(now.getHours() + 48); // 48h expiration

        await ctx.db.patch(args.supplierId, {
            whatsapp_link: token,
            whatsapp_link_expires: now.toISOString(),
            whatsapp_link_used: false,
            supplier_password: args.password,
        });

        return { token, supplier_code: supplier.supplier_code };
    }
});

export const update = mutation({
    args: {
        id: v.id("suppliers"),
        data: v.object({
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            phone: v.optional(v.string()),
            address: v.optional(v.string()),
            piva: v.optional(v.string()),
            type: v.optional(v.string()),
            status: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.patch(args.id, args.data);
    },
});

export const remove = mutation({
    args: { id: v.id("suppliers") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);

        const supplier = await ctx.db.get(args.id);
        if (!supplier) throw new Error("Fornitore non trovato");

        // 1. Find user by email and downgrade role
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", supplier.email))
            .first();

        if (user) {
            await ctx.db.patch(user._id, { role: "user" });

            // 2. Add notification for the user
            await ctx.db.insert("notifications", {
                user_email: supplier.email,
                type: "alert",
                priority: "high",
                read: false,
                title: "Accesso Fornitore Revocato",
                message: "Il tuo account fornitore è stato rimosso dall'amministrazione. Non hai più accesso alla dashboard fornitore.",
                created_date: new Date().toISOString(),
            });
        }

        // 3. Delete the supplier record
        await ctx.db.delete(args.id);
    },
});

// Generate invitation code for a supplier to register and link their account
export const generateInvitation = mutation({
    args: { id: v.id("suppliers") },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const code = `IWHOME-SUP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        await ctx.db.patch(args.id, {
            invitation_code: code,
            invitation_status: "pending",
            invitation_sent_date: new Date().toISOString(),
        });
        // Notify supplier by email notification
        const supplier = await ctx.db.get(args.id);
        if (supplier) {
            await ctx.db.insert("notifications", {
                user_email: supplier.email,
                type: "invitation",
                title: "Invito a IWHome",
                message: `Sei stato invitato a collaborare con IWHome. Codice invito: ${code}`,
                link: "/Fornitori",
                read: false,
                created_date: new Date().toISOString(),
                sender_email: caller.email,
            });
        }
        return code;
    },
});

// ═══════════════════════════════════════════
// SUPPLIER REQUESTS (Richieste)
// ═══════════════════════════════════════════

export const listRequests = query({
    args: { supplier_id: v.optional(v.id("suppliers")) },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];

        if (args.supplier_id) {
            return await ctx.db.query("supplier_requests").withIndex("by_supplier", (q: any) => q.eq("supplier_id", args.supplier_id)).collect();
        }

        if (caller.role === "admin" || caller.role === "superadmin") {
            return await ctx.db.query("supplier_requests").collect();
        }

        // Supplier without explicit supplier_id: auto-find their linked record via user_id, fallback to email
        if (caller.role === "supplier") {
            let supplierRecord = await ctx.db.query("suppliers")
                .withIndex("by_user", (q: any) => q.eq("user_id", caller.userId))
                .first();
            if (!supplierRecord && caller.email) {
                supplierRecord = await ctx.db.query("suppliers")
                    .withIndex("by_email", (q: any) => q.eq("email", caller.email))
                    .first();
            }
            // Case-insensitive fallback
            if (!supplierRecord && caller.email) {
                const all = await ctx.db.query("suppliers").collect();
                supplierRecord = all.find(s => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
            }
            if (!supplierRecord) return [];
            return await ctx.db.query("supplier_requests")
                .withIndex("by_supplier", (q: any) => q.eq("supplier_id", supplierRecord._id))
                .collect();
        }

        return [];
    },
});

export const createRequest = mutation({
    args: {
        supplier_id: v.id("suppliers"),
        title: v.string(),
        description: v.optional(v.string()),
        fixture_type: v.optional(v.string()),
        fixture_specs: v.optional(v.any()),
        photos: v.optional(v.array(v.string())),
        documents: v.optional(v.array(v.string())),
        cantiere_id: v.optional(v.id("cantieri")),
        client_id: v.optional(v.id("clients")),
        // Extended fields for Task 9/10
        urgency: v.optional(v.string()),
        quantity: v.optional(v.number()),
        dimensions: v.optional(v.any()), // { width, height, depth }
        material: v.optional(v.string()),
        color: v.optional(v.string()),
        glass_type: v.optional(v.string()),
        budget_estimate: v.optional(v.number()),
        fixture_category: v.optional(v.string()),
        fixture_subcategory: v.optional(v.string()),
        preliminary_quote: v.optional(v.number()),
        quote_id: v.optional(v.id("quotes")),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const id = await ctx.db.insert("supplier_requests", {
            ...args,
            status: "sent",
            created_by: caller.email,
            created_date: new Date().toISOString(),
        });

        // Update linked client quote status to 'in_lavorazione' (prevents client response before admin finalizes)
        if (args.quote_id) {
            await ctx.db.patch(args.quote_id, {
                status: "in_lavorazione"
            });
        }

        // Notify supplier
        const supplier = await ctx.db.get(args.supplier_id);
        if (supplier) {
            await ctx.db.insert("notifications", {
                user_email: supplier.email,
                type: "supplier_request",
                title: "Nuova Richiesta",
                message: `Hai ricevuto una nuova richiesta: ${args.title}`,
                link: "/Fornitori",
                read: false,
                created_date: new Date().toISOString(),
                sender_email: caller.email,
            });
        }
        return id;
    },
});

export const updateRequest = mutation({
    args: {
        id: v.id("supplier_requests"),
        data: v.object({
            status: v.optional(v.string()),
            quoted_price: v.optional(v.number()),
            preliminary_quote: v.optional(v.number()),
            supplier_notes: v.optional(v.string()),
            fixture_specs: v.optional(v.any()),
            supplier_quote_doc_id: v.optional(v.id("documents")),
            supplier_acconto_percentage: v.optional(v.number()),
            supplier_payment_plan: v.optional(v.any()),
        }),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const callerInfo = await getCallerInfo(ctx);
        const prevRequest = await ctx.db.get(args.id);

        await ctx.db.patch(args.id, {
            ...args.data,
            updated_date: new Date().toISOString(),
        });

        // If a supplier just quoted the request, notify all admins
        if (prevRequest && prevRequest.status !== 'preventivato' && args.data.status === 'preventivato') {
            const supplier = await ctx.db.get(prevRequest.supplier_id);
            const supplierName = supplier ? supplier.name : 'Un fornitore';

            const admins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
            for (const admin of admins) {
                if (!admin.email) continue;
                await ctx.db.insert("notifications", {
                    user_email: admin.email,
                    type: "supplier_quote",
                    title: "Nuovo Preventivo Fornitore",
                    message: `${supplierName} ha inviato un preventivo per: ${prevRequest.title}`,
                    link: "/Fornitori",
                    read: false,
                    created_date: new Date().toISOString(),
                    sender_email: callerInfo?.email || caller.email,
                });
            }
        }
    },
});

export const removeRequest = mutation({
    args: { id: v.id("supplier_requests") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.delete(args.id);
    },
});

// ═══════════════════════════════════════════
// SUPPLIER ORDERS (Ordini Confermati)
// ═══════════════════════════════════════════

export const listOrders = query({
    args: { supplier_id: v.optional(v.id("suppliers")) },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];

        if (args.supplier_id) {
            return await ctx.db.query("supplier_orders").withIndex("by_supplier", (q: any) => q.eq("supplier_id", args.supplier_id)).collect();
        }

        if (caller.role === "admin" || caller.role === "superadmin") {
            return await ctx.db.query("supplier_orders").collect();
        }

        // Supplier without explicit supplier_id: auto-find their linked record via user_id, fallback to email
        if (caller.role === "supplier") {
            let supplierRecord = await ctx.db.query("suppliers")
                .withIndex("by_user", (q: any) => q.eq("user_id", caller.userId))
                .first();
            if (!supplierRecord && caller.email) {
                supplierRecord = await ctx.db.query("suppliers")
                    .withIndex("by_email", (q: any) => q.eq("email", caller.email))
                    .first();
            }
            // Case-insensitive fallback
            if (!supplierRecord && caller.email) {
                const all = await ctx.db.query("suppliers").collect();
                supplierRecord = all.find(s => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
            }
            if (!supplierRecord) return [];
            return await ctx.db.query("supplier_orders")
                .withIndex("by_supplier", (q: any) => q.eq("supplier_id", supplierRecord._id))
                .collect();
        }

        return [];
    },
});

export const createOrder = mutation({
    args: {
        supplier_id: v.id("suppliers"),
        request_id: v.id("supplier_requests"),
        order_number: v.optional(v.string()),
        items: v.optional(v.any()),
        total_amount: v.optional(v.number()),
        delivery_date: v.optional(v.string()),
        notes: v.optional(v.string()),
        cantiere_id: v.optional(v.id("cantieri")),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const id = await ctx.db.insert("supplier_orders", {
            ...args,
            status: "confirmed",
            workflow_step: 7, // Default to Step 7: Deal Chiuso for manually created orders
            workflow_status: "Deal Chiuso",
            created_date: new Date().toISOString(),
            updated_by: caller.email,
        });
        // Update request status
        await ctx.db.patch(args.request_id, { status: "accepted" });

        // ═══ PHASE TRIGGER: Update client quote → 'ordine_confermato' ═══
        const reqForPhase = await ctx.db.get(args.request_id);
        if (reqForPhase?.quote_id) {
            await ctx.db.patch(reqForPhase.quote_id, { status: "ordine_confermato" });
        }

        // ═══ AUTO-TRIGGER: Create pending payment for confirmed order ═══
        const supplier = await ctx.db.get(args.supplier_id);
        if (args.total_amount && args.total_amount > 0) {
            await ctx.db.insert("payments", {
                type: "supplier",
                reference_id: args.supplier_id,
                reference_name: supplier?.name || "Fornitore",
                supplier_id: args.supplier_id,
                order_id: id,
                cantiere_id: args.cantiere_id,
                description: `Ordine #${args.order_number || id.slice(-6)} — ${supplier?.name || 'Fornitore'}`,
                amount: args.total_amount,
                payment_type: "fattura",
                due_date: args.delivery_date,
                status: "in_attesa",
                created_by: caller.email,
                created_date: new Date().toISOString(),
            });
            // Activity log for auto-payment
            await ctx.db.insert("activity_log", {
                user_email: caller.email,
                action: "auto_created",
                entity_type: "payment",
                entity_id: id,
                entity_name: `Ordine #${args.order_number || id.slice(-6)}`,
                details: `Pagamento automatico di €${args.total_amount} creato per ordine fornitore ${supplier?.name || 'N/D'}`,
                created_date: new Date().toISOString(),
            });
        }

        // Notify all admins dynamically
        const admins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.db.insert("notifications", {
                user_email: admin.email,
                type: "supplier_order",
                title: "Nuovo Ordine Confermato",
                message: `Ordine #${args.order_number || id} confermato${args.total_amount ? ` — €${args.total_amount}` : ''} — Pagamento automatico creato`,
                link: "/Fornitori",
                read: false,
                created_date: new Date().toISOString(),
                sender_email: caller.email,
            });
        }
        return id;
    },
});

export const createOrderFromQuote = mutation({
    args: {
        supplier_id: v.id("suppliers"),
        request_id: v.id("supplier_requests"),
        quote_id: v.id("quotes"),
        cantiere_id: v.optional(v.id("cantieri")),
        total_amount: v.optional(v.number()), // usually the quoted_price from the request
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);

        // Genera un numero d'ordine basato sul counter o random per ora
        const order_number = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

        const orderId = await ctx.db.insert("supplier_orders", {
            supplier_id: args.supplier_id,
            request_id: args.request_id,
            cantiere_id: args.cantiere_id,
            quote_id: args.quote_id,
            order_number,
            total_amount: args.total_amount,
            status: "confirmed",
            workflow_step: 7, // Step 7: Deal Chiuso (since it was derived from an accepted quote)
            workflow_status: "Deal Chiuso",
            created_date: new Date().toISOString(),
            updated_by: caller.email,
        });

        // Aggiorna lo stato della richiesta fornitore associata
        await ctx.db.patch(args.request_id, {
            status: "accepted",
            quote_id: args.quote_id
        });

        // ═══ PHASE TRIGGER: Update client quote → 'ordine_confermato' ═══
        await ctx.db.patch(args.quote_id, { status: "ordine_confermato" });

        // Invia notifica al fornitore
        const supplier = await ctx.db.get(args.supplier_id);
        if (supplier) {
            await ctx.db.insert("notifications", {
                user_email: supplier.email,
                type: "order_created",
                title: "Nuovo Ordine da Preventivo",
                message: `L'amministratore ha confermato l'ordine ${order_number} derivato dal tuo preventivo elaborato per IWHome.`,
                link: "/Fornitori",
                read: false,
                created_date: new Date().toISOString(),
                sender_email: caller.email,
            });
        }

        // Genera pagamento automatico per il saldo (acconto o totale)
        if (args.total_amount && args.total_amount > 0) {
            await ctx.db.insert("payments", {
                type: "supplier",
                reference_id: args.supplier_id,
                reference_name: supplier?.name || "Fornitore",
                supplier_id: args.supplier_id,
                order_id: orderId,
                cantiere_id: args.cantiere_id,
                description: `Ordine #${order_number} — ${supplier?.name || 'Fornitore'}`,
                amount: args.total_amount,
                payment_type: "fattura",
                due_date: new Date().toISOString(), // da pagare ASAP
                status: "in_attesa",
                created_by: caller.email,
                created_date: new Date().toISOString(),
            });

            // Activity log for auto-payment
            await ctx.db.insert("activity_log", {
                user_email: caller.email,
                action: "auto_created",
                entity_type: "payment",
                entity_id: orderId,
                entity_name: `Ordine #${order_number}`,
                details: `Pagamento automatico di €${args.total_amount} creato da trasformazione preventivo in ordine per ${supplier?.name || 'N/D'}`,
                created_date: new Date().toISOString(),
            });
        }

        // Link existing client acconto payment (created at quote acceptance) to this new order
        const existingClientPayment = await ctx.db
            .query("payments")
            .filter((q: any) => q.and(
                q.eq(q.field("quote_id"), args.quote_id),
                q.eq(q.field("type"), "client"),
            ))
            .first();
        if (existingClientPayment && !existingClientPayment.order_id) {
            await ctx.db.patch(existingClientPayment._id, { order_id: orderId });
        }

        return orderId;
    }
});

// CRITICAL: Only suppliers can modify their own orders
export const updateOrder = mutation({
    args: {
        id: v.id("supplier_orders"),
        data: v.object({
            items: v.optional(v.any()),
            total_amount: v.optional(v.number()),
            status: v.optional(v.string()),
            delivery_date: v.optional(v.string()),
            notes: v.optional(v.string()),
            supplier_notes: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const order = await ctx.db.get(args.id);
        if (!order) throw new Error("Ordine non trovato");
        // Task 12 LOCK: once in production, no modifications allowed
        if (order.locked) {
            throw new Error("⚠️ Ordine BLOCCATO — in produzione. Nessuna modifica è permessa.");
        }
        // Check: supplier can only edit their own, admin/superadmin can edit all (3-tier lookup)
        if (caller.role === "supplier") {
            let supplier: any = await ctx.db.query("suppliers").withIndex("by_user", (q: any) => q.eq("user_id", caller.userId)).first();
            if (!supplier) supplier = await ctx.db.query("suppliers").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
            if (!supplier) {
                const _all = await ctx.db.query("suppliers").collect();
                supplier = _all.find(s => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
            }
            if (!supplier || supplier._id !== order.supplier_id) {
                throw new Error("Non puoi modificare ordini di altri fornitori.");
            }
        } else if (caller.role !== "admin") {
            // Se non è admin o supplier proprietario
            throw new Error("Solo il fornitore (o admin) può modificare l'ordine.");
        }

        // Task 12 Logic: Validations for moving to 'in_production'
        let additionalData: any = {};
        if (args.data.status === "in_production") {
            if (!order.acconto_paid) {
                throw new Error("Impossibile passare in produzione: Acconto non ancora ricevuto.");
            }
            // Quando va in produzione, l'ordine si blocca automaticamente
            additionalData.locked = true;
            additionalData.workflow_step = 10;
            additionalData.workflow_status = "In Produzione";
            additionalData.production_started_date = new Date().toISOString();
        }

        await ctx.db.patch(args.id, {
            ...args.data,
            ...additionalData,
            updated_date: new Date().toISOString(),
            updated_by: caller.email,
        });
        // Notify all admins about update
        const adminsToNotify = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
        for (const adm of adminsToNotify) {
            if (!adm.email) continue;
            await ctx.db.insert("notifications", {
                user_email: adm.email,
                type: "supplier_order_update",
                title: "Ordine Fornitore Aggiornato",
                message: `Ordine #${order.order_number || args.id} aggiornato da ${caller.email}`,
                link: "/Fornitori",
                read: false,
                priority: "high",
                created_date: new Date().toISOString(),
                sender_email: caller.email,
            });
        }
    },
});

// ═══════════════════════════════════════════
// PRODUCTION (Produzione)
// ═══════════════════════════════════════════

export const listProduction = query({
    args: { order_id: v.optional(v.id("supplier_orders")), supplier_id: v.optional(v.id("suppliers")) },
    handler: async (ctx, args) => {
        if (args.order_id) {
            return await ctx.db.query("supplier_production").withIndex("by_order", (q: any) => q.eq("order_id", args.order_id)).collect();
        }
        if (args.supplier_id) {
            return await ctx.db.query("supplier_production").withIndex("by_supplier", (q: any) => q.eq("supplier_id", args.supplier_id)).collect();
        }
        return await ctx.db.query("supplier_production").collect();
    },
});

export const updateProduction = mutation({
    args: {
        id: v.id("supplier_production"),
        data: v.object({
            status: v.optional(v.string()),
            progress_percentage: v.optional(v.number()),
            notes: v.optional(v.string()),
            completed_date: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        await ctx.db.patch(args.id, {
            ...args.data,
            updated_by: caller.email,
            updated_date: new Date().toISOString(),
        });
    },
});

export const createProductionPhase = mutation({
    args: {
        order_id: v.id("supplier_orders"),
        supplier_id: v.id("suppliers"),
        phase: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        return await ctx.db.insert("supplier_production", {
            ...args,
            status: "pending",
            updated_by: caller.email,
            updated_date: new Date().toISOString(),
        });
    },
});

// ═══════════════════════════════════════════
// DELIVERIES (Consegne)
// ═══════════════════════════════════════════

export const listDeliveries = query({
    args: { supplier_id: v.optional(v.id("suppliers")), order_id: v.optional(v.id("supplier_orders")) },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];

        if (args.order_id) {
            return await ctx.db.query("supplier_deliveries").withIndex("by_order", (q: any) => q.eq("order_id", args.order_id)).collect();
        }

        if (args.supplier_id) {
            return await ctx.db.query("supplier_deliveries").withIndex("by_supplier", (q: any) => q.eq("supplier_id", args.supplier_id)).collect();
        }

        if (caller.role === "admin" || caller.role === "superadmin") {
            return await ctx.db.query("supplier_deliveries").collect();
        }

        // Supplier without explicit supplier_id: auto-find their linked record via user_id, fallback to email
        if (caller.role === "supplier") {
            let supplierRecord = await ctx.db.query("suppliers")
                .withIndex("by_user", (q: any) => q.eq("user_id", caller.userId))
                .first();
            if (!supplierRecord && caller.email) {
                supplierRecord = await ctx.db.query("suppliers")
                    .withIndex("by_email", (q: any) => q.eq("email", caller.email))
                    .first();
            }
            // Case-insensitive fallback
            if (!supplierRecord && caller.email) {
                const all = await ctx.db.query("suppliers").collect();
                supplierRecord = all.find(s => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
            }
            if (!supplierRecord) return [];
            return await ctx.db.query("supplier_deliveries")
                .withIndex("by_supplier", (q: any) => q.eq("supplier_id", supplierRecord._id))
                .collect();
        }

        return [];
    },
});

export const createDelivery = mutation({
    args: {
        order_id: v.id("supplier_orders"),
        supplier_id: v.id("suppliers"),
        departure_date: v.optional(v.string()),
        estimated_arrival: v.optional(v.string()),
        tracking_number: v.optional(v.string()),
        driver_name: v.optional(v.string()),
        driver_phone: v.optional(v.string()),
        driver_vehicle: v.optional(v.string()),
        documents: v.optional(v.array(v.string())),
        notes: v.optional(v.string()),
        cantiere_id: v.optional(v.id("cantieri")),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const id = await ctx.db.insert("supplier_deliveries", {
            ...args,
            status: "partito",
            created_date: new Date().toISOString(),
        });

        // ═══ AUTO-TRIGGER: Update order status to 'shipped' ═══
        await ctx.db.patch(args.order_id, {
            status: "shipped",
            updated_date: new Date().toISOString(),
            updated_by: caller.email,
        });

        // ═══ PHASE TRIGGER: Update client quote → 'in_consegna' ═══
        const orderForQuotePhase = await ctx.db.get(args.order_id);
        if (orderForQuotePhase?.quote_id) {
            await ctx.db.patch(orderForQuotePhase.quote_id, { status: "in_consegna" });
            // Notify client
            const clientQuoteForDelivery = await ctx.db.get(orderForQuotePhase.quote_id);
            if (clientQuoteForDelivery?.email) {
                await ctx.db.insert("notifications", {
                    user_email: clientQuoteForDelivery.email,
                    type: "delivery_shipped",
                    title: "Il tuo ordine è in consegna 🚚",
                    message: `Il tuo ordine è partito ed è in viaggio verso di te. Tieniti pronto per la consegna!`,
                    link: "/AreaPrivata",
                    read: false,
                    priority: "high",
                    created_date: new Date().toISOString(),
                    sender_email: caller.email,
                });
            }
        }

        // Auto-create system message in channel
        const supplier = await ctx.db.get(args.supplier_id);
        await ctx.db.insert("internal_messages", {
            channel_type: "delivery",
            channel_id: id,
            channel_name: `Consegna - ${supplier?.name || 'Fornitore'}`,
            sender_email: caller.email,
            sender_name: "Sistema IWHome",
            sender_role: "system",
            message: `Consegna creata. Autista: ${args.driver_name || 'N/D'}, Tel: ${args.driver_phone || 'N/D'}${args.driver_vehicle ? ', Veicolo: ' + args.driver_vehicle : ''}`,
            message_type: "system",
            read: false,
            created_date: new Date().toISOString(),
        });

        // ═══ AUTO-TRIGGER: Notify ALL Admins ═══
        const deliveryAdmins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
        for (const adm of deliveryAdmins) {
            if (!adm.email) continue;
            await ctx.db.insert("notifications", {
                user_email: adm.email,
                type: "delivery_shipped",
                title: "🚚 Nuova Consegna in Partenza",
                message: `Il fornitore ${supplier?.name} ha spedito l'ordine. Arrivo stimato: ${args.estimated_arrival || 'N/D'}${args.driver_name ? ` — Autista: ${args.driver_name}` : ""}`,
                link: "/Fornitori",
                read: false,
                priority: "high",
                created_date: new Date().toISOString(),
                sender_email: caller.email,
            });
        }

        return id;
    },
});

export const updateDelivery = mutation({
    args: {
        id: v.id("supplier_deliveries"),
        data: v.object({
            status: v.optional(v.string()),
            delivery_date: v.optional(v.string()),
            estimated_arrival: v.optional(v.string()),
            confirmed_arrival: v.optional(v.string()),
            client_delivery_date: v.optional(v.string()),
            delivery_confirmed_by: v.optional(v.string()),
            tracking_number: v.optional(v.string()),
            notes: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const deliveryBefore = await ctx.db.get(args.id);
        await ctx.db.patch(args.id, {
            ...args.data,
            updated_date: new Date().toISOString(),
        });

        // ═══ Notify admins when status changes to in_transito ═══
        if (args.data.status === "in_transito" && deliveryBefore?.status !== "in_transito") {
            const orderForDelivery = deliveryBefore ? await ctx.db.get(deliveryBefore.order_id) : null;
            const supplierForDelivery = deliveryBefore ? await ctx.db.get(deliveryBefore.supplier_id) : null;
            await ctx.scheduler.runAfter(0, internal.notifications.triggerDeliveryStatusUpdate, {
                delivery_id: args.id,
                order_id: deliveryBefore?.order_id ?? "",
                order_number: orderForDelivery?.order_number,
                supplier_name: supplierForDelivery?.name ?? "Fornitore",
                supplier_email: supplierForDelivery?.email ?? caller.email,
                new_status: "in_transito",
                driver_name: deliveryBefore?.driver_name,
                estimated_arrival: args.data.estimated_arrival ?? deliveryBefore?.estimated_arrival,
            });
        }

        // If status is "consegnato", cascade updates
        if (args.data.status === "consegnato") {
            const delivery = await ctx.db.get(args.id);
            if (delivery) {
                // ═══ AUTO-TRIGGER: Update order → 'delivered' ═══
                await ctx.db.patch(delivery.order_id, {
                    status: "delivered",
                    updated_date: new Date().toISOString(),
                    updated_by: caller.email,
                });

                // ═══ PHASE TRIGGER: Update client quote → 'completato' ═══
                const orderForCompletato = await ctx.db.get(delivery.order_id);
                if (orderForCompletato?.quote_id) {
                    await ctx.db.patch(orderForCompletato.quote_id, { status: "completato" });
                }

                // Activity log
                const supplier = await ctx.db.get(delivery.supplier_id);
                await ctx.db.insert("activity_log", {
                    user_email: caller.email,
                    action: "delivery_confirmed",
                    entity_type: "delivery",
                    entity_id: args.id,
                    entity_name: `Consegna ${supplier?.name || ''}`,
                    details: `Consegna confermata. Ordine aggiornato a 'delivered'. Pagamento annotato.`,
                    created_date: new Date().toISOString(),
                });

                // ═══ AUTO-TRIGGER: Mark linked payment as payable (update notes) ═══
                const linkedPayments = await ctx.db.query("payments")
                    .withIndex("by_supplier", (q: any) => q.eq("supplier_id", delivery.supplier_id))
                    .collect();
                const orderPayment = linkedPayments.find((p: any) => p.order_id && p.order_id === delivery.order_id && p.status === "in_attesa");
                if (orderPayment) {
                    await ctx.db.patch(orderPayment._id, {
                        notes: `${orderPayment.notes || ''} | Consegna confermata il ${new Date().toLocaleDateString('it-IT')} — Pronto per il pagamento`.trim(),
                        updated_date: new Date().toISOString(),
                    });
                }

                // Send system message in delivery channel
                await ctx.db.insert("internal_messages", {
                    channel_type: "supplier",
                    channel_id: delivery.supplier_id,
                    channel_name: "",
                    sender_email: caller.email,
                    sender_name: "Sistema IWHome",
                    sender_role: "system",
                    message: `✅ Consegna confermata ricevuta. Ordine completato. Pagamento in elaborazione.`,
                    message_type: "system",
                    read: false,
                    created_date: new Date().toISOString(),
                });

                if (supplier) {
                    // Notify supplier
                    await ctx.db.insert("notifications", {
                        user_email: supplier.email,
                        type: "delivery_confirmed",
                        title: "Consegna Confermata ✅",
                        message: `La consegna è stata confermata da IWHome. Pagamento in elaborazione.`,
                        link: "/Fornitori",
                        read: false,
                        created_date: new Date().toISOString(),
                        sender_email: caller.email,
                    });
                    // Notify ALL admins
                    const orderForNotify = await ctx.db.get(delivery.order_id);
                    await ctx.scheduler.runAfter(0, internal.notifications.triggerDeliveryStatusUpdate, {
                        delivery_id: args.id,
                        order_id: delivery.order_id,
                        order_number: orderForNotify?.order_number,
                        supplier_name: supplier.name,
                        supplier_email: supplier.email,
                        new_status: "consegnato",
                    });
                }

                // T17: Notify client via their cantiere link
                const orderForClient = await ctx.db.get(delivery.order_id);
                if (orderForClient?.cantiere_id) {
                    const cantiere = await ctx.db.get(orderForClient.cantiere_id);
                    if (cantiere?.client_id) {
                        const clientRecord = await ctx.db.get(cantiere.client_id);
                        if (clientRecord?.email) {
                            await ctx.db.insert("notifications", {
                                user_email: clientRecord.email,
                                type: "delivery_arrived",
                                title: "Il tuo ordine è arrivato! 📦",
                                message: `La consegna è stata confermata. Il tuo progetto è in fase di completamento. Contatta IWHome per i prossimi passi.`,
                                link: "/Pagamenti",
                                read: false,
                                priority: "high",
                                created_date: new Date().toISOString(),
                            });
                        }
                    }

                    // PRATICA CHIUSA — mark cantiere as completato on confirmed delivery
                    await ctx.db.patch(orderForClient.cantiere_id, { status: "completato" });
                    const practiceAdmins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
                    for (const adm of practiceAdmins) {
                        if (!adm.email) continue;
                        await ctx.db.insert("notifications", {
                            user_email: adm.email,
                            type: "pratica_chiusa",
                            title: "Pratica Chiusa 🎉",
                            message: `La consegna è stata confermata. Il cantiere è stato chiuso automaticamente.`,
                            link: "/Cantieri",
                            read: false,
                            priority: "normal",
                            created_date: new Date().toISOString(),
                            sender_email: caller.email,
                        });
                    }
                }
            }
        }
    },
});

export const removeOrder = mutation({
    args: { id: v.id("supplier_orders") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.delete(args.id);
    },
});

export const removeDelivery = mutation({
    args: { id: v.id("supplier_deliveries") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.delete(args.id);
    },
});

// ═══════════════════════════════════════════
// TASK 1: WHATSAPP ONBOARDING
// ═══════════════════════════════════════════

// Generate unique WhatsApp link for supplier onboarding. Link expires after first use OR 48h.
export const generateWhatsAppLink = mutation({
    args: {
        id: v.id("suppliers"),
        password: v.string(), // Admin-set password (not auto-generated by supplier)
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const supplier = await ctx.db.get(args.id);
        if (!supplier) throw new Error("Fornitore non trovato");

        // Generate unique link token
        const linkToken = `WA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

        // Expires in 48 hours
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        await ctx.db.patch(args.id, {
            whatsapp_link: linkToken,
            whatsapp_link_expires: expiresAt,
            whatsapp_link_used: false,
            supplier_password: args.password,
            invitation_status: "pending",
            invitation_sent_date: new Date().toISOString(),
        });

        // Activity log
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "whatsapp_link_generated",
            entity_type: "supplier",
            entity_id: args.id,
            entity_name: supplier.name,
            details: `Link WhatsApp generato per "${supplier.name}". Scade: ${new Date(expiresAt).toLocaleString('it-IT')}`,
            created_date: new Date().toISOString(),
        });

        // Notify supplier
        await ctx.db.insert("notifications", {
            user_email: supplier.email,
            type: "whatsapp_onboarding",
            title: "Link di Accesso IWHome",
            message: `Hai ricevuto un link per accedere all'area privata IWHome. Il link scade tra 48 ore.`,
            link: "/Fornitori",
            read: false,
            created_date: new Date().toISOString(),
            sender_email: caller.email,
        });

        return linkToken;
    },
});

// Validate a WhatsApp link — check if it's still valid (not used, not expired)
export const validateWhatsAppLink = query({
    args: { linkToken: v.string() },
    handler: async (ctx, args) => {
        const suppliers = await ctx.db.query("suppliers")
            .withIndex("by_whatsapp_link", (q: any) => q.eq("whatsapp_link", args.linkToken))
            .collect();
        const supplier = suppliers[0];
        if (!supplier) return { valid: false, reason: "Link non trovato" };

        // Check if already used
        if (supplier.whatsapp_link_used) {
            return { valid: false, reason: "Link già utilizzato" };
        }

        // Check if expired (48h)
        if (supplier.whatsapp_link_expires) {
            const expiryDate = new Date(supplier.whatsapp_link_expires);
            if (new Date() > expiryDate) {
                return { valid: false, reason: "Link scaduto" };
            }
        }

        return {
            valid: true,
            supplier_name: supplier.name,
            supplier_email: supplier.email,
            supplier_id: supplier._id,
        };
    },
});

// Complete WhatsApp onboarding — marks link as used, links user account
export const completeWhatsAppOnboarding = mutation({
    args: {
        linkToken: v.string(),
        user_email: v.string(),
    },
    handler: async (ctx, args) => {
        const suppliers = await ctx.db.query("suppliers")
            .withIndex("by_whatsapp_link", (q: any) => q.eq("whatsapp_link", args.linkToken))
            .collect();
        const supplier = suppliers[0];
        if (!supplier) throw new Error("Link non trovato");

        // Validate again
        if (supplier.whatsapp_link_used) throw new Error("Link già utilizzato");
        if (supplier.whatsapp_link_expires && new Date() > new Date(supplier.whatsapp_link_expires)) {
            throw new Error("Link scaduto");
        }

        // Mark link as used
        await ctx.db.patch(supplier._id, {
            whatsapp_link_used: true,
            invitation_status: "accepted",
        });

        // Log activation
        await ctx.db.insert("activity_log", {
            user_email: args.user_email,
            action: "whatsapp_onboarding_completed",
            entity_type: "supplier",
            entity_id: supplier._id,
            entity_name: supplier.name,
            details: `Onboarding via WhatsApp completato da ${args.user_email}`,
            created_date: new Date().toISOString(),
        });

        // Notify all admins dynamically
        await ctx.scheduler.runAfter(0, internal.notifications.notifyAllAdmins, {
            title: "Fornitore Onboarded",
            message: `${supplier.name} ha completato l'onboarding via WhatsApp.`,
            type: "supplier_onboarded",
            link: "/Fornitori",
            sender_email: args.user_email,
        });

        return { success: true, supplier_name: supplier.name };
    },
});

// ═══════════════════════════════════════════
// TASK 7: CODICE UNIVOCO FORNITORE
// ═══════════════════════════════════════════

// Generate unique supplier code (format: IWH-XXXXX, usable from multiple emails)
export const generateSupplierCode = mutation({
    args: { id: v.id("suppliers") },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const supplier = await ctx.db.get(args.id);
        if (!supplier) throw new Error("Fornitore non trovato");

        // If already has a code, return it
        if (supplier.supplier_code) return supplier.supplier_code;

        // Generate unique code: IWH-XXXXX
        const code = `IWH-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        await ctx.db.patch(args.id, { supplier_code: code });

        // Activity log
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "supplier_code_generated",
            entity_type: "supplier",
            entity_id: args.id,
            entity_name: supplier.name,
            details: `Codice univoco "${code}" generato per "${supplier.name}"`,
            created_date: new Date().toISOString(),
        });

        return code;
    },
});

// Lookup supplier by unique code
export const lookupByCode = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        const suppliers = await ctx.db.query("suppliers")
            .withIndex("by_supplier_code", (q: any) => q.eq("supplier_code", args.code))
            .collect();
        const supplier = suppliers[0];
        if (!supplier) return null;
        return {
            supplier_id: supplier._id,
            name: supplier.name,
            email: supplier.email,
            status: supplier.status,
        };
    },
});

// ═══════════════════════════════════════════
// TASK 8: WORKFLOW CREAZIONE ACCOUNT FORNITORE
// ═══════════════════════════════════════════

// Redeem supplier code — validates code, links user account, assigns 'Fornitore' role
export const redeemSupplierCode = mutation({
    args: {
        code: v.optional(v.string()),
        whatsapp_token: v.optional(v.string()),
        password: v.optional(v.string()),
        user_email: v.string(),
    },
    handler: async (ctx, args) => {
        let supplier = null;

        if (args.whatsapp_token) {
            const suppliers = await ctx.db.query("suppliers")
                .withIndex("by_whatsapp_link", (q: any) => q.eq("whatsapp_link", args.whatsapp_token))
                .collect();
            supplier = suppliers[0];

            if (!supplier) throw new Error("Link di invito non valido o inesistente.");
            if (supplier.whatsapp_link_used) throw new Error("Questo link Whatsapp è già stato utilizzato.");

            if (supplier.whatsapp_link_expires && new Date(supplier.whatsapp_link_expires) < new Date()) {
                throw new Error("Questo link Whatsapp è scaduto (validità 48h).");
            }

            if (supplier.supplier_password && supplier.supplier_password !== args.password) {
                throw new Error("Password non corretta.");
            }

            // Mark as used
            await ctx.db.patch(supplier._id, { whatsapp_link_used: true });
        } else if (args.code) {
            const suppliers = await ctx.db.query("suppliers")
                .withIndex("by_supplier_code", (q: any) => q.eq("supplier_code", args.code))
                .collect();
            supplier = suppliers[0];

            if (!supplier) {
                throw new Error("Codice non valido. Contatta l'amministratore IWHome per assistenza.");
            }
        } else {
            throw new Error("Devi fornire un codice o un link Whatsapp valido.");
        }

        if (supplier.status === "archived") {
            throw new Error("Questo fornitore è stato archiviato. Contatta l'amministratore IWHome.");
        }

        // Link user account if exists
        // Use .first() instead of .unique() to safely handle any duplicate user records
        const user = await ctx.db.query("users")
            .withIndex("by_email", (q: any) => q.eq("email", args.user_email))
            .first();

        if (user) {
            // Update user role to supplier
            await ctx.db.patch(user._id, { role: "supplier" });
            // Link supplier to user
            await ctx.db.patch(supplier._id, {
                user_id: user._id,
                invitation_status: "accepted",
            });
        }

        // Log activation with timestamp
        await ctx.db.insert("activity_log", {
            user_email: args.user_email,
            action: "supplier_code_redeemed",
            entity_type: "supplier",
            entity_id: supplier._id,
            entity_name: supplier.name,
            details: args.whatsapp_token ? `Link Whatsapp riscattato da ${args.user_email}. Ruolo 'Fornitore' assegnato.` : `Codice "${args.code}" riscattato da ${args.user_email}. Ruolo 'Fornitore' assegnato.`,
            created_date: new Date().toISOString(),
        });

        // Notify all admins dynamically
        await ctx.scheduler.runAfter(0, internal.notifications.notifyAllAdmins, {
            title: "Codice Fornitore Riscattato",
            message: args.whatsapp_token ? `${supplier.name}: link Whatsapp riscattato da ${args.user_email}.` : `${supplier.name}: codice "${args.code}" riscattato da ${args.user_email}.`,
            type: "supplier_code_redeemed",
            link: "/Fornitori",
            sender_email: args.user_email,
        });

        return { success: true, supplier_name: supplier.name, supplier_id: supplier._id };
    },
});

// ─── Self-service: auto-assign supplier role if email matches an active supplier record ───
// Called by the frontend on mount when a logged-in user visits the supplier area.
// Safe: only upgrades "client"/"user" roles — never demotes admins or changes already-supplier accounts.
export const syncSupplierRole = mutation({
    args: {},
    handler: async (ctx) => {
        const caller = await getCallerInfo(ctx);
        if (!caller || !caller.email) return false;
        // Already supplier/admin — nothing to do
        if (caller.role === "supplier" || caller.role === "admin" || caller.role === "superadmin") return false;
        // Only upgrade from client/user
        if (caller.role !== "client" && caller.role !== "user") return false;

        // Find matching active supplier record (3-tier)
        let supplier = await ctx.db.query("suppliers")
            .withIndex("by_email", (q: any) => q.eq("email", caller.email))
            .first();
        if (!supplier) {
            const all = await ctx.db.query("suppliers").collect();
            supplier = all.find((s: any) => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
        }
        if (!supplier || supplier.status !== "active") return false;

        // Use caller.userId directly — this is the exact record the auth token belongs to.
        // Do NOT look up by email: if duplicate user records exist, the email lookup may
        // find a different record than the one used by getCallerInfo (tokenIdentifier),
        // causing the role update to silently apply to the wrong record.
        await ctx.db.patch(caller.userId as any, { role: "supplier" });
        if (!supplier.user_id) {
            await ctx.db.patch(supplier._id, { user_id: caller.userId as any, invitation_status: "accepted" });
        }
        return true;
    },
});

// ─── Admin force-link: assigns role=supplier and links user_id ───────────────
export const adminLinkSupplierUser = mutation({
    args: {
        supplier_id: v.id("suppliers"),
        user_email: v.string(),
    },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);

        const supplier = await ctx.db.get(args.supplier_id);
        if (!supplier) throw new Error("Fornitore non trovato.");

        const user = await ctx.db.query("users")
            .withIndex("by_email", (q: any) => q.eq("email", args.user_email))
            .first();
        if (!user) throw new Error("Nessun utente trovato con quell'email. Verifica che il fornitore abbia effettuato la registrazione.");

        await ctx.db.patch(user._id, { role: "supplier" });
        await ctx.db.patch(supplier._id, {
            user_id: user._id,
            invitation_status: "accepted",
        });

        await ctx.db.insert("activity_log", {
            user_email: args.user_email,
            action: "supplier_admin_linked",
            entity_type: "supplier",
            entity_id: supplier._id,
            entity_name: supplier.name,
            details: `Account ${args.user_email} collegato manualmente a fornitore "${supplier.name}" dall'amministratore.`,
            created_date: new Date().toISOString(),
        });

        return { success: true, supplier_name: supplier.name };
    },
});

// ═══════════════════════════════════════════
// TASK 12: WORKFLOW 9 PASSI — STATE MACHINE
// ═══════════════════════════════════════════

const WORKFLOW_STEPS: Record<number, string> = {
    1: "Richiesta Cliente",
    2: "Richiesta al Fornitore",
    3: "Preventivo Fornitore",
    4: "Valutazione Admin",
    5: "Preventivo al Cliente",
    6: "Risposta Cliente",
    7: "Deal Chiuso",
    8: "In Attesa Pagamento Cliente",
    9: "IWHome ha Pagato il Fornitore",
    10: "In Produzione",
};

// Advance order through the 9-step workflow
export const advanceWorkflow = mutation({
    args: {
        order_id: v.id("supplier_orders"),
        target_step: v.number(), // which step to advance to
        quote_pdf_url: v.optional(v.string()), // PDF at step 3 or 5
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const order = await ctx.db.get(args.order_id);
        if (!order) throw new Error("Ordine non trovato");

        const targetStep = args.target_step;
        const isAdmin = caller.role === "admin" || caller.role === "superadmin";
        const isSupplier = caller.role === "supplier";

        // Enforce LOCK: once in production (step 10), no changes allowed
        if (order.locked) {
            throw new Error("⚠️ Impossibile modificare: la produzione è già iniziata.");
        }

        const currentStep = order.workflow_step || 0;
        if (targetStep <= currentStep) {
            throw new Error(`Step ${targetStep} già completato.`);
        }

        // ─── Gate RBAC per step ──────────────────────────
        // Step 2 (Invia al Fornitore): solo admin/superadmin
        if (targetStep === 2 && !isAdmin) {
            throw new Error("Solo l'Admin può inviare la richiesta al Fornitore (Step 2).");
        }
        // Step 3 (Preventivo Fornitore): solo supplier
        if (targetStep === 3 && !isSupplier && !isAdmin) {
            throw new Error("Solo il Fornitore può inviare il preventivo (Step 3).");
        }
        // Step 3: PDF obbligatorio
        if (targetStep === 3 && !args.quote_pdf_url && !order.quote_pdf_url) {
            throw new Error("⚠️ Il PDF del preventivo è obbligatorio per procedere al Step 3.");
        }
        // Step 4 (Valutazione Admin): solo admin
        if (targetStep === 4 && !isAdmin) {
            throw new Error("Solo l'Admin può valutare il preventivo (Step 4).");
        }
        // Step 5 (Preventivo al Cliente): solo admin
        if (targetStep === 5 && !isAdmin) {
            throw new Error("Solo l'Admin può inviare il preventivo al Cliente (Step 5).");
        }
        // Step 7 (Deal Chiuso): solo admin
        if (targetStep === 7 && !isAdmin) {
            throw new Error("Solo l'Admin può chiudere il deal (Step 7).");
        }
        // Step 8 (Fornitore accetta ordine): solo supplier
        if (targetStep === 8 && !isSupplier && !isAdmin) {
            throw new Error("Solo il Fornitore può accettare l'ordine (Step 8).");
        }
        // Step 9 (IWHome paga Fornitore): solo admin
        if (targetStep === 9 && !isAdmin) {
            throw new Error("Solo l'Admin può avanzare al pagamento Fornitore (Step 9).");
        }
        // Step 10 gate: richiede acconto pagato
        if (targetStep === 10) {
            if (!order.acconto_paid) {
                throw new Error("⚠️ L'acconto del cliente deve essere verificato prima di avviare la produzione.");
            }
        }

        const now = new Date().toISOString();
        const stepLabel = WORKFLOW_STEPS[targetStep] || `Step ${targetStep}`;

        const updateData: any = {
            workflow_step: targetStep,
            workflow_status: stepLabel,
            updated_date: now,
            updated_by: caller.email,
        };

        // Step 3: save supplier quote PDF
        if (targetStep === 3 && args.quote_pdf_url) {
            updateData.quote_pdf_url = args.quote_pdf_url;
        }

        // Step 5: save client quote PDF
        if (targetStep === 5 && args.quote_pdf_url) {
            updateData.client_quote_pdf_url = args.quote_pdf_url;
        }

        // Step 8: ordine confermato
        if (targetStep === 8) {
            updateData.status = "confirmed";
        }

        // Step 10: In Produzione -> LOCK + set start date + produzione_sbloccata
        if (targetStep === 10) {
            updateData.locked = true;
            updateData.produzione_sbloccata = true;
            updateData.status = "in_production";
            updateData.production_started_date = now;
        }

        // Append to workflow_history
        const historyEntry = { step: targetStep, label: stepLabel, action: `Avanzato a Step ${targetStep}`, user: caller.email, timestamp: now };
        const existingHistory = order.workflow_history || [];
        updateData.workflow_history = [...existingHistory, historyEntry];

        await ctx.db.patch(args.order_id, updateData);

        // Activity log
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "workflow_advanced",
            entity_type: "supplier_order",
            entity_id: args.order_id,
            entity_name: `Ordine #${order.order_number || args.order_id.slice(-6)}`,
            details: `Workflow avanzato a Step ${targetStep}: ${stepLabel}`,
            created_date: now,
        });

        // ─── Notifiche per step ──────────────────────────
        const supplier = await ctx.db.get(order.supplier_id);
        const admins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();

        const notifyUser = async (email: string, title: string, message: string, link: string) => {
            await ctx.db.insert("notifications", {
                user_email: email,
                type: "workflow_update",
                title,
                message,
                link,
                read: false,
                created_date: now,
                sender_email: caller.email,
            });
        };

        const orderRef = `Ordine #${order.order_number || args.order_id.slice(-6)}`;

        if (targetStep === 2 && supplier) {
            await notifyUser(supplier.email, "Nuova Richiesta da IWHome", `${orderRef}: hai ricevuto una nuova richiesta.`, "/Fornitori");
        }
        if (targetStep === 3) {
            for (const admin of admins) await notifyUser(admin.email, "Preventivo Ricevuto dal Fornitore", `${orderRef}: nuovo preventivo da verificare.`, "/Fornitori");
        }
        if (targetStep === 5) {
            // Notify client — find quote to get client email
            if (order.quote_id) {
                const quote = await ctx.db.get(order.quote_id);
                if (quote?.email) await notifyUser(quote.email, "Il tuo preventivo è pronto", `${orderRef}: IWHome ti ha inviato un preventivo.`, "/Preventivi");
            }
        }
        if (targetStep === 7 && supplier) {
            await notifyUser(supplier.email, "Ordine Bozza da Confermare", `${orderRef}: IWHome ha chiuso il deal. Conferma l'ordine.`, "/Fornitori");
        }
        if (targetStep === 8) {
            for (const admin of admins) await notifyUser(admin.email, "Ordine Confermato dal Fornitore", `${orderRef}: il fornitore ha accettato l'ordine.`, "/Fornitori");
            // Notify client: time to pay the acconto
            if (order.quote_id) {
                const quote = await ctx.db.get(order.quote_id);
                if (quote?.email) {
                    await notifyUser(quote.email, "Ordine Confermato — Paga l'Acconto 💳", `${orderRef}: il fornitore ha confermato l'ordine. Procedi con il pagamento dell'acconto per avviare la produzione.`, "/Preventivi");
                }
            }
        }
        if (targetStep === 10) {
            for (const admin of admins) await notifyUser(admin.email, "Produzione Sbloccata 🚀", `${orderRef}: la produzione è ufficialmente iniziata.`, "/Fornitori");
            if (order.quote_id) {
                // ═══ PHASE TRIGGER: Update client quote → 'in_produzione' ═══
                await ctx.db.patch(order.quote_id, { status: "in_produzione" });
                const quote = await ctx.db.get(order.quote_id);
                if (quote?.email) await notifyUser(quote.email, "Pagamento Confermato ✅", `${orderRef}: il tuo pagamento è stato verificato. La produzione è iniziata.`, "/AreaPrivata");
            }
        }

        return { step: targetStep, status: stepLabel };
    },
});

// Mark acconto as paid — gate for production (Step 9)
export const markAccontoPaid = mutation({
    args: {
        order_id: v.id("supplier_orders"),
        payment_id: v.optional(v.id("payments")),
        acconto_percentage: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const order = await ctx.db.get(args.order_id);
        if (!order) throw new Error("Ordine non trovato");

        await ctx.db.patch(args.order_id, {
            acconto_paid: true,
            acconto_payment_id: args.payment_id,
            acconto_percentage: args.acconto_percentage,
            updated_date: new Date().toISOString(),
            updated_by: caller.email,
        });

        // Activity log
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "acconto_confirmed",
            entity_type: "supplier_order",
            entity_id: args.order_id,
            entity_name: `Ordine #${order.order_number || args.order_id.slice(-6)}`,
            details: `Acconto confermato (${args.acconto_percentage || 'N/D'}%). Produzione sbloccata.`,
            created_date: new Date().toISOString(),
        });

        return { success: true };
    },
});

export const finalizeIWHomeQuote = mutation({
    args: {
        request_id: v.id("supplier_requests"),
        margin_price: v.number(),
        final_doc_id: v.id("documents"),
        // Scadenza preventivo per il cliente (in giorni)
        expires_days: v.optional(v.number()),
        // Piano pagamenti personalizzato per questo preventivo
        acconto_percentage: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const request = await ctx.db.get(args.request_id);
        if (!request) throw new Error("Richiesta non trovata");

        // 1. Update the supplier request with final IWHome data
        await ctx.db.patch(args.request_id, {
            iwhome_margin_price: args.margin_price,
            iwhome_final_doc_id: args.final_doc_id,
            status: "accepted",
        });

        // 2. Update the original client quote if it exists
        if (request.quote_id) {
            const clientQuote = await ctx.db.get(request.quote_id);
            if (!clientQuote) return { success: true };

            // Calcola la data di scadenza se fornita
            const expiresAt = args.expires_days
                ? new Date(Date.now() + args.expires_days * 24 * 60 * 60 * 1000).toISOString()
                : undefined;

            const quoteUpdate: any = {
                estimated_price: args.margin_price,
                status: "sent",
            };
            if (expiresAt) {
                quoteUpdate.client_quote_expires_at = expiresAt;
                quoteUpdate.client_quote_expires_days = args.expires_days;
            }
            if (args.acconto_percentage) {
                quoteUpdate.acconto_percentage = args.acconto_percentage;
            }
            await ctx.db.patch(request.quote_id, quoteUpdate);

            // 3. Notify the client with expiry info
            if (clientQuote.email) {
                const expiryMsg = expiresAt
                    ? ` Il preventivo è valido fino al ${new Date(expiresAt).toLocaleDateString('it-IT')}.`
                    : '';
                await ctx.db.insert("notifications", {
                    user_email: clientQuote.email,
                    type: "quote_ready",
                    priority: "high",
                    title: "Preventivo Pronto 📋",
                    message: `Il tuo preventivo da €${args.margin_price.toLocaleString('it-IT')} è pronto per la valutazione.${expiryMsg} Accedi alla sezione Preventivi per accettare o rifiutare.`,
                    link: "/Preventivi",
                    read: false,
                    created_date: new Date().toISOString(),
                    sender_email: caller.email,
                });
            }
        }
        return { success: true };
    },
});

// ═══════════════════════════════════════════
// CONTROPROPOSTA ADMIN → FORNITORE
// ═══════════════════════════════════════════

export const sendCounterproposal = mutation({
    args: {
        request_id: v.id("supplier_requests"),
        proposed_price: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const request = await ctx.db.get(args.request_id);
        if (!request) throw new Error("Richiesta non trovata");
        if (request.status !== "preventivato") {
            throw new Error("La controproposta è possibile solo su preventivi in stato 'preventivato'.");
        }

        const now = new Date().toISOString();
        await ctx.db.patch(args.request_id, {
            counterproposal_price: args.proposed_price,
            counterproposal_notes: args.notes,
            counterproposal_status: "pending",
            counterproposal_date: now,
            status: "counterproposal_sent",
            updated_date: now,
        });

        // Notifica il fornitore
        const supplier = await ctx.db.get(request.supplier_id);
        if (supplier) {
            await ctx.db.insert("notifications", {
                user_email: supplier.email,
                type: "counterproposal_received",
                priority: "high",
                read: false,
                title: "Controproposta da IWHome 🔄",
                message: `IWHome ha proposto un prezzo alternativo di €${args.proposed_price.toLocaleString('it-IT')} per la richiesta "${request.title}".${args.notes ? ` Note: ${args.notes}` : ''} Accedi all'area Fornitori per accettare o rifiutare.`,
                link: "/Fornitori",
                created_date: now,
                sender_email: caller.email,
            });
        }

        return { success: true };
    },
});

export const respondToCounterproposal = mutation({
    args: {
        request_id: v.id("supplier_requests"),
        decision: v.string(), // "accepted" | "rejected"
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAnyAuth(ctx);
        const callerInfo = await getCallerInfo(ctx);
        const request = await ctx.db.get(args.request_id);
        if (!request) throw new Error("Richiesta non trovata");
        if (request.counterproposal_status !== "pending") {
            throw new Error("Nessuna controproposta in attesa su questa richiesta.");
        }

        const now = new Date().toISOString();

        if (args.decision === "accepted") {
            // Il fornitore accetta → aggiorna il prezzo e avanza lo stato
            await ctx.db.patch(args.request_id, {
                quoted_price: request.counterproposal_price,
                counterproposal_status: "accepted",
                counterproposal_response_date: now,
                status: "preventivato", // Torna a preventivato con il nuovo prezzo
                updated_date: now,
            });

            // Notifica admin: fornitore ha accettato la controproposta
            const admins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
            for (const adm of admins) {
                if (!adm.email) continue;
                await ctx.db.insert("notifications", {
                    user_email: adm.email,
                    type: "counterproposal_accepted",
                    priority: "high",
                    read: false,
                    title: "Controproposta Accettata ✅",
                    message: `Il fornitore ha accettato il prezzo proposto di €${request.counterproposal_price?.toLocaleString('it-IT')} per "${request.title}". Puoi procedere con la finalizzazione.`,
                    link: "/Preventivi",
                    created_date: now,
                    sender_email: callerInfo?.email || "",
                });
            }
        } else {
            // Il fornitore rifiuta → torna in stato per nuovo preventivo
            const revisionCount = (request.quote_revision_count || 0) + 1;
            await ctx.db.patch(args.request_id, {
                counterproposal_status: "rejected",
                counterproposal_response_date: now,
                counterproposal_rejection_notes: args.notes,
                status: "sent", // Torna a "inviato" — il fornitore può fare un nuovo preventivo
                quote_revision_count: revisionCount,
                updated_date: now,
            });

            // Notifica admin: fornitore ha rifiutato, aspetta nuovo preventivo
            const admins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
            for (const adm of admins) {
                if (!adm.email) continue;
                await ctx.db.insert("notifications", {
                    user_email: adm.email,
                    type: "counterproposal_rejected",
                    priority: "high",
                    read: false,
                    title: "Controproposta Rifiutata ❌",
                    message: `Il fornitore ha rifiutato il prezzo proposto per "${request.title}".${args.notes ? ` Motivo: ${args.notes}` : ''} Il fornitore invierà un nuovo preventivo.`,
                    link: "/Fornitori",
                    created_date: now,
                    sender_email: callerInfo?.email || "",
                });
            }
        }

        return { success: true, decision: args.decision };
    },
});

export const rejectSupplierQuote = mutation({
    args: {
        request_id: v.id("supplier_requests"),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const request = await ctx.db.get(args.request_id);
        if (!request) throw new Error("Richiesta non trovata");

        const now = new Date().toISOString();
        const revisionCount = (request.quote_revision_count || 0) + 1;

        await ctx.db.patch(args.request_id, {
            status: "sent", // Torna a "inviato" per nuovo preventivo
            quote_revision_count: revisionCount,
            updated_date: now,
        });

        // Notifica il fornitore del rifiuto con le note
        const supplier = await ctx.db.get(request.supplier_id);
        if (supplier) {
            await ctx.db.insert("notifications", {
                user_email: supplier.email,
                type: "quote_rejected_by_admin",
                priority: "high",
                read: false,
                title: "Preventivo Rifiutato da IWHome ❌",
                message: `IWHome ha rifiutato il tuo preventivo per "${request.title}".${args.notes ? ` Motivo: ${args.notes}.` : ''} Puoi inviare un preventivo rivisto.`,
                link: "/Fornitori",
                created_date: now,
                sender_email: caller.email,
            });
        }

        return { success: true };
    },
});

// ═══════════════════════════════════════════
// SCADENZA AUTOMATICA PREVENTIVI
// ═══════════════════════════════════════════

export const checkExpiredQuotes = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = new Date();
        const nowIso = now.toISOString();

        // Trova i preventivi inviati al cliente con scadenza
        const sentQuotes = await ctx.db
            .query("quotes")
            .withIndex("by_status", (q: any) => q.eq("status", "sent"))
            .collect();

        for (const quote of sentQuotes) {
            if (!quote.client_quote_expires_at) continue;
            const expiresAt = new Date(quote.client_quote_expires_at);

            // ─── Scaduto ─────────────────────────────
            if (expiresAt <= now) {
                await ctx.db.patch(quote._id, { status: "scaduto" });

                // Notifica il cliente
                if (quote.email) {
                    await ctx.db.insert("notifications", {
                        user_email: quote.email,
                        type: "quote_expired",
                        priority: "normal",
                        read: false,
                        title: "Preventivo Scaduto ⏰",
                        message: `Il tuo preventivo è scaduto. Effettua una nuova richiesta per ricevere un preventivo aggiornato.`,
                        link: "/Preventivi",
                        created_date: nowIso,
                    });
                }

                // Notifica admin
                const expiryAdmins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
                for (const adm of expiryAdmins) {
                    if (!adm.email) continue;
                    await ctx.db.insert("notifications", {
                        user_email: adm.email,
                        type: "quote_expired_admin",
                        priority: "normal",
                        read: false,
                        title: "Preventivo Scaduto",
                        message: `Il preventivo di €${quote.estimated_price} per ${quote.full_name || quote.email} è scaduto senza risposta del cliente.`,
                        link: "/Preventivi",
                        created_date: nowIso,
                    });
                }
                continue;
            }

            // ─── Avviso 24h prima ────────────────────
            const hoursLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursLeft <= 24 && !quote.expiry_notified_24h) {
                await ctx.db.patch(quote._id, { expiry_notified_24h: true });
                if (quote.email) {
                    await ctx.db.insert("notifications", {
                        user_email: quote.email,
                        type: "quote_expiring_soon",
                        priority: "high",
                        read: false,
                        title: "⚠️ Preventivo in Scadenza",
                        message: `Il tuo preventivo da €${quote.estimated_price} scade domani. Accedi alla sezione Preventivi per accettarlo o rifiutarlo prima che scada.`,
                        link: "/Preventivi",
                        created_date: nowIso,
                    });
                }
            }
        }
    },
});

export const listClientOrders = query({
    args: { client_email: v.string() },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];

        // Find quotes by this client
        const myQuotes = await ctx.db
            .query("quotes")
            .withIndex("by_email", (q) => q.eq("email", args.client_email))
            .collect();

        if (myQuotes.length === 0) return [];

        const quoteIds = myQuotes.map(q => q._id);

        // Find orders for these quotes
        const orders = [];
        for (const quoteId of quoteIds) {
            const quoteOrders = await ctx.db
                .query("supplier_orders")
                .withIndex("by_quote", (q) => q.eq("quote_id", quoteId))
                .collect();
            orders.push(...quoteOrders);
        }

        // Strip sensitive supplier information (like total_amount) before returning to client
        const sanitizedOrders = orders.map(o => ({
            _id: o._id,
            _creationTime: o._creationTime,
            order_number: o.order_number,
            quote_id: o.quote_id,
            cantiere_id: o.cantiere_id,
            status: o.status,
            workflow_status: o.workflow_status,
            delivery_date: o.delivery_date,
            // NO total_amount, NO supplier details, NO internal notes
        }));

        return sanitizedOrders;
    },
});

// Task 12.3: Supplier Payment Plan Proposal
export const proposePaymentPlan = mutation({
    args: {
        order_id: v.id("supplier_orders"),
        proposal: v.array(v.object({
            amount: v.number(),
            due_date: v.string(),
            description: v.string(),
        })),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const order = await ctx.db.get(args.order_id);
        if (!order) throw new Error("Ordine non trovato");

        let supplierName = "Un fornitore";

        // Verify caller is the supplier of this order (or an admin)
        if (caller.role !== "admin") {
            let supplier = await ctx.db.query("suppliers")
                .withIndex("by_user", q => q.eq("user_id", caller.userId as any))
                .first();
            if (!supplier) {
                supplier = await ctx.db.query("suppliers")
                    .withIndex("by_email", q => q.eq("email", caller.email))
                    .first();
            }
            if (!supplier) {
                const _allS = await ctx.db.query("suppliers").collect();
                supplier = _allS.find(s => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
            }

            if (!supplier || supplier._id !== order.supplier_id) {
                throw new Error("Non autorizzato a proporre un piano pagamenti per questo ordine");
            }
            supplierName = supplier.name;
        }

        // Update order with proposal
        await ctx.db.patch(args.order_id, {
            payment_proposal: args.proposal,
            payment_proposal_notes: args.notes,
            payment_proposal_status: "pending",
            updated_date: new Date().toISOString(),
            updated_by: caller.email,
        });

        // Notify ALL admins
        const paymentPlanAdmins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
        for (const adm of paymentPlanAdmins) {
            if (!adm.email) continue;
            await ctx.db.insert("notifications", {
                user_email: adm.email,
                type: "payment_proposal",
                title: "💰 Nuova Proposta Piano Pagamenti",
                message: `Il fornitore ${supplierName} ha proposto un piano pagamenti per l'ordine #${order.order_number || args.order_id.slice(-6)}`,
                link: "/Fornitori",
                read: false,
                priority: "high",
                created_date: new Date().toISOString(),
                sender_email: caller.email,
            });
        }
    },
});


export const updateProductionPhase = mutation({
    args: {
        order_id: v.id("supplier_orders"),
        phase_index: v.number(),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const order = await ctx.db.get(args.order_id);
        if (!order) throw new Error("Ordine non trovato");

        // Verify caller is authorized (Admin or the Supplier of the order) — 3-tier lookup
        if (caller.role !== "admin") {
            let _sup: any = await ctx.db.query("suppliers")
                .withIndex("by_user", q => q.eq("user_id", caller.userId as any))
                .first();
            if (!_sup) _sup = await ctx.db.query("suppliers")
                .withIndex("by_email", q => q.eq("email", caller.email))
                .first();
            if (!_sup) {
                const _allPP = await ctx.db.query("suppliers").collect();
                _sup = _allPP.find(s => s.email.toLowerCase() === caller.email.toLowerCase()) ?? null;
            }
            if (!_sup || _sup._id !== order.supplier_id) throw new Error("Non autorizzato");
        }

        const updateData: any = {
            production_phase: args.phase_index,
            updated_date: new Date().toISOString(),
            updated_by: caller.email,
        };

        // If it's the last phase (Pronto - index 4 since we removed Verniciatura), update order status
        // Phase list: ['Materiali', 'Taglio', 'Assemblaggio', 'Controllo Qualità', 'Pronto']
        if (args.phase_index === 4) {
            updateData.status = "ready";
            updateData.workflow_status = "Pronto per la Consegna";
        }

        await ctx.db.patch(args.order_id, updateData);

        // ═══ Notify admins about production phase update ═══
        const supplierForPhase = await ctx.db.get(order.supplier_id);
        await ctx.scheduler.runAfter(0, internal.notifications.triggerProductionPhaseUpdate, {
            order_id: args.order_id,
            order_number: order.order_number,
            supplier_name: supplierForPhase?.name ?? "Fornitore",
            supplier_email: supplierForPhase?.email ?? caller.email,
            phase_index: args.phase_index,
        });

        // Activity log
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "production_phase_updated",
            entity_type: "supplier_order",
            entity_id: args.order_id,
            entity_name: `Ordine #${order.order_number || args.order_id.slice(-6)}`,
            details: `Fase di produzione aggiornata a indice ${args.phase_index}`,
            created_date: new Date().toISOString(),
        });

        return { success: true };
    },
});

// ═══════════════════════════════════════════
// CRON: Anticipo Notifiche Consegna (1w / 48h / 24h)
// ═══════════════════════════════════════════

export const checkDeliveryAdvanceNotifications = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = new Date();

        // All deliveries not yet delivered and with a confirmed/estimated arrival date
        const pendingDeliveries = await ctx.db
            .query("supplier_deliveries")
            .collect();

        for (const delivery of pendingDeliveries) {
            if (delivery.status === "consegnato") continue;

            const arrivalDateStr = delivery.confirmed_arrival ?? delivery.estimated_arrival;
            if (!arrivalDateStr) continue;

            const arrivalDate = new Date(arrivalDateStr);
            const diffMs = arrivalDate.getTime() - now.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            const supplier = await ctx.db.get(delivery.supplier_id);
            const order = await ctx.db.get(delivery.order_id);
            const supplierName = supplier?.name ?? "Fornitore";
            const orderNumber = order?.order_number;
            const deliveryDateFormatted = arrivalDate.toLocaleDateString("it-IT");

            // 1 week (7 days) — check between 6.5 and 7.5 days
            if (!delivery.advance_notified_1w && diffDays >= 6.5 && diffDays < 7.5) {
                await ctx.scheduler.runAfter(0, internal.notifications.triggerDeliveryAdvanceNotification, {
                    delivery_id: delivery._id,
                    order_number: orderNumber,
                    supplier_name: supplierName,
                    delivery_date: deliveryDateFormatted,
                    advance_type: "1w",
                });
            }

            // 48 hours — check between 1.75 and 2.25 days
            if (!delivery.advance_notified_48h && diffDays >= 1.75 && diffDays < 2.25) {
                await ctx.scheduler.runAfter(0, internal.notifications.triggerDeliveryAdvanceNotification, {
                    delivery_id: delivery._id,
                    order_number: orderNumber,
                    supplier_name: supplierName,
                    delivery_date: deliveryDateFormatted,
                    advance_type: "48h",
                });
            }

            // 24 hours — check between 0.75 and 1.25 days
            if (!delivery.advance_notified_24h && diffDays >= 0.75 && diffDays < 1.25) {
                await ctx.scheduler.runAfter(0, internal.notifications.triggerDeliveryAdvanceNotification, {
                    delivery_id: delivery._id,
                    order_number: orderNumber,
                    supplier_name: supplierName,
                    delivery_date: deliveryDateFormatted,
                    advance_type: "24h",
                });
            }
        }
    },
});

