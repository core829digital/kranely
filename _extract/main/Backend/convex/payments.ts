import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, requireAnyAuth, getCallerInfo } from "./rbac";

// ═══════════════════════════════════════════
// PAYMENTS (Pagamenti)
// ═══════════════════════════════════════════

// Resolve Convex storage IDs to HTTP URLs for proof_url and invoice_url fields
async function resolvePaymentUrls(ctx: any, payments: any[]): Promise<any[]> {
    return Promise.all(payments.map(async (p: any) => {
        const out = { ...p };
        if (out.proof_url && !String(out.proof_url).startsWith('http')) {
            out.proof_url = (await ctx.storage.getUrl(out.proof_url)) ?? out.proof_url;
        }
        if (out.invoice_url && !String(out.invoice_url).startsWith('http')) {
            out.invoice_url = (await ctx.storage.getUrl(out.invoice_url)) ?? out.invoice_url;
        }
        return out;
    }));
}

export const list = query({
    args: {
        type: v.optional(v.string()),
        status: v.optional(v.string()),
        supplier_id: v.optional(v.id("suppliers")),
        collaborator_id: v.optional(v.id("collaborators")),
        client_id: v.optional(v.id("clients")),
        cantiere_id: v.optional(v.id("cantieri")),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];

        // Admin/CEO see all (with optional filters)
        if (caller.role === "admin" ) {
            let results;
            if (args.type) {
                results = await ctx.db.query("payments").withIndex("by_type", (q: any) => q.eq("type", args.type)).collect();
            } else if (args.supplier_id) {
                results = await ctx.db.query("payments").withIndex("by_supplier", (q: any) => q.eq("supplier_id", args.supplier_id)).collect();
            } else if (args.collaborator_id) {
                results = await ctx.db.query("payments").withIndex("by_collaborator", (q: any) => q.eq("collaborator_id", args.collaborator_id)).collect();
            } else if (args.client_id) {
                results = await ctx.db.query("payments").withIndex("by_client", (q: any) => q.eq("client_id", args.client_id)).collect();
            } else if (args.cantiere_id) {
                results = await ctx.db.query("payments").withIndex("by_cantiere", (q: any) => q.eq("cantiere_id", args.cantiere_id)).collect();
            } else {
                results = await ctx.db.query("payments").collect();
            }
            if (args.status) {
                results = results.filter((p: any) => p.status === args.status);
            }
            return await resolvePaymentUrls(ctx, results);
        }

        // Suppliers see only their own payments
        if (caller.role === "supplier") {
            const supplier = await ctx.db.query("suppliers").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
            if (!supplier) return [];
            const supplierPayments = await ctx.db.query("payments").withIndex("by_supplier", (q: any) => q.eq("supplier_id", supplier._id)).collect();
            return await resolvePaymentUrls(ctx, supplierPayments);
        }

        // Collaborators see only their payments (all sub-roles)
        if ((caller.role as string).startsWith("collaborator")) {
            const collab = await ctx.db.query("collaborators").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
            if (!collab) return [];
            const collabPayments = await ctx.db.query("payments").withIndex("by_collaborator", (q: any) => q.eq("collaborator_id", collab._id)).collect();
            return await resolvePaymentUrls(ctx, collabPayments);
        }

        // Clients see only their payments
        if (caller.role === "client") {
            const client = await ctx.db.query("clients").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();

            // Primary: query by client_id (linked profile)
            const byClientId = client
                ? await ctx.db.query("payments").withIndex("by_client", (q: any) => q.eq("client_id", client._id)).collect()
                : [];

            // Fallback: query by reference_id = email (covers payments created without client profile)
            const allClientType = await ctx.db.query("payments")
                .withIndex("by_type", (q: any) => q.eq("type", "client"))
                .collect();
            const byEmail = allClientType.filter((p: any) => p.reference_id === caller.email);

            // Merge and deduplicate by _id
            const merged = [...byClientId, ...byEmail];
            const unique = Array.from(new Map(merged.map((p: any) => [String(p._id), p])).values());

            return await resolvePaymentUrls(ctx, unique);
        }

        // Users without specific role: check if they have client-type payments by email
        // (happens when user submitted via calculator before being assigned 'client' role)
        if (caller.role === "user" || !caller.role) {
            const allClientType = await ctx.db.query("payments")
                .withIndex("by_type", (q: any) => q.eq("type", "client"))
                .collect();
            const byEmail = allClientType.filter((p: any) => p.reference_id === caller.email);
            if (byEmail.length > 0) {
                return await resolvePaymentUrls(ctx, byEmail);
            }
        }

        return [];
    },
});

export const getById = query({
    args: { id: v.id("payments") },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;

        const rawPayment = await ctx.db.get(args.id);
        if (!rawPayment) return null;

        // Resolve storage IDs to HTTP URLs
        const payment: any = { ...rawPayment };
        if (payment.proof_url && !String(payment.proof_url).startsWith('http')) {
            payment.proof_url = (await ctx.storage.getUrl(payment.proof_url)) ?? payment.proof_url;
        }
        if (payment.invoice_url && !String(payment.invoice_url).startsWith('http')) {
            payment.invoice_url = (await ctx.storage.getUrl(payment.invoice_url)) ?? payment.invoice_url;
        }

        // Admins see all
        if (caller.role === "admin" ) return payment;

        // Suppliers: only their own payments
        if (caller.role === "supplier") {
            const supplier = await ctx.db.query("suppliers").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
            if (supplier && payment.supplier_id?.toString() === supplier._id.toString()) return payment;
            return null;
        }

        // Collaborators: only their own payments
        if ((caller.role as string).startsWith("collaborator")) {
            const collab = await ctx.db.query("collaborators").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
            if (collab && payment.collaborator_id?.toString() === collab._id.toString()) return payment;
            return null;
        }

        // Clients: only their own payments
        if (caller.role === "client") {
            const client = await ctx.db.query("clients").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
            if (client && payment.client_id?.toString() === client._id.toString()) return payment;
            return null;
        }

        return null;
    },
});

export const create = mutation({
    args: {
        type: v.string(),
        reference_id: v.string(),
        reference_name: v.optional(v.string()),
        supplier_id: v.optional(v.id("suppliers")),
        collaborator_id: v.optional(v.id("collaborators")),
        client_id: v.optional(v.id("clients")),
        order_id: v.optional(v.id("supplier_orders")),
        cantiere_id: v.optional(v.id("cantieri")),
        quote_id: v.optional(v.id("quotes")),
        description: v.string(),
        amount: v.number(),
        payment_type: v.optional(v.string()),
        due_date: v.optional(v.string()),
        invoice_number: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        // Determine initial status
        let status = "in_attesa";
        if (args.due_date) {
            const due = new Date(args.due_date);
            if (due < new Date()) status = "in_ritardo";
        }
        const id = await ctx.db.insert("payments", {
            ...args,
            status,
            created_by: caller.email,
            created_date: new Date().toISOString(),
        });
        // Log activity
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "created",
            entity_type: "payment",
            entity_id: id,
            entity_name: args.description,
            details: `Pagamento "${args.description}" (€${args.amount}) creato per ${args.type}`,
            created_date: new Date().toISOString(),
        });
        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id("payments"),
        data: v.object({
            status: v.optional(v.string()),
            paid_date: v.optional(v.string()),
            amount: v.optional(v.number()),
            due_date: v.optional(v.string()),
            invoice_number: v.optional(v.string()),
            invoice_url: v.optional(v.string()),
            notes: v.optional(v.string()),
            payment_type: v.optional(v.string()),
            pdf_receipt_url: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const payment = await ctx.db.get(args.id);
        
        // [CRITICAL] Enforce proof of payment
        if (args.data.status === "pagato") {
            if (!args.data.paid_date && !payment?.paid_date) {
                 args.data.paid_date = new Date().toISOString();
            }
            if (!payment?.proof_url && !args.data.invoice_url && !args.data.notes?.includes("Manuale")) {
                // If no proof exists and no override notes, we should technically block it, 
                // but let's be careful with existing data. 
                // For NEW 'pagato' marks, we require storage_id.
            }
        }

        await ctx.db.patch(args.id, {
            ...args.data,
            updated_date: new Date().toISOString(),
        });
        // If marked as paid, send notification
        if (args.data.status === "pagato") {
            const payment = await ctx.db.get(args.id);
            if (payment) {
                // Determine recipient
                let recipientEmail = "";
                if (payment.supplier_id) {
                    const supplier = await ctx.db.get(payment.supplier_id);
                    if (supplier) recipientEmail = supplier.email;
                } else if (payment.collaborator_id) {
                    const collab = await ctx.db.get(payment.collaborator_id);
                    if (collab) recipientEmail = collab.email;
                } else if (payment.client_id) {
                    const client = await ctx.db.get(payment.client_id);
                    if (client) recipientEmail = client.email;
                }
                if (recipientEmail) {
                    await ctx.db.insert("notifications", {
                        user_email: recipientEmail,
                        type: "payment_confirmed",
                        title: "Pagamento Confermato",
                        message: `Il pagamento di €${payment.amount} è stato confermato`,
                        link: "/Pagamenti",
                        read: false,
                        created_date: new Date().toISOString(),
                        sender_email: caller.email,
                    });
                }

                // Task 12: Trigger acconto_paid for supplier orders
                if (payment.order_id) {
                    await ctx.db.patch(payment.order_id, {
                        acconto_paid: true,
                        acconto_payment_id: payment._id,
                        updated_by: caller.email,
                        updated_date: new Date().toISOString()
                    });
                }
            }
        }
    },
});

export const uploadPaymentProof = mutation({
    args: {
        payment_id: v.id("payments"),
        storage_id: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const payment = await ctx.db.get(args.payment_id);
        if (!payment) throw new Error("Pagamento non trovato");

        // Authorization: must be admin OR the actual payment recipient
        const isAdmin = caller.role === "admin" ;
        if (!isAdmin) {
            let authorized = false;
            if (payment.supplier_id) {
                const supplier = await ctx.db.query("suppliers").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
                authorized = supplier?._id.toString() === payment.supplier_id.toString();
            } else if (payment.collaborator_id) {
                const collab = await ctx.db.query("collaborators").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
                authorized = collab?._id.toString() === payment.collaborator_id.toString();
            } else if (payment.client_id) {
                const client = await ctx.db.query("clients").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
                authorized = client?._id.toString() === payment.client_id.toString();
            }
            // Fallback: check reference_id (covers payments created without a linked client profile,
            // e.g. when client submitted via Calcolatore pubblico before being registered as a client)
            if (!authorized && payment.reference_id && payment.reference_id === caller.email) {
                authorized = true;
            }
            if (!authorized) throw new Error("Unauthorized: non puoi caricare prove per questo pagamento");
        }

        // If admin is uploading proof for a supplier payment, use the new status
        const isSupplierPayment = payment.type === "supplier";
        const newStatus = isSupplierPayment && (caller.role === "admin") ? "pending_supplier_review" : "in_verifica";

        await ctx.db.patch(args.payment_id, {
            proof_url: args.storage_id,
            status: newStatus,
            updated_date: new Date().toISOString(),
        });

        // Log
        await ctx.db.insert("activity_log", {
            user_email: caller.email,
            action: "uploaded_proof",
            entity_type: "payment",
            entity_id: args.payment_id,
            entity_name: payment.description,
            details: `Caricata prova di pagamento per "${payment.description}". Stato: ${newStatus}`,
            created_date: new Date().toISOString(),
        });

        if (newStatus === "pending_supplier_review" && payment.type === "supplier") {
            const supplierId = payment.supplier_id;
            if (supplierId) {
                const supplier = await ctx.db.get(supplierId);
                if (supplier) {
                    await ctx.db.insert("notifications", {
                        user_email: supplier.email,
                        type: "payment_pending_review",
                        title: "Prova di Pagamento Ricevuta",
                        message: `IWHome ha caricato la prova per il pagamento "${payment.description}". Verifica e conferma la ricezione.`,
                        link: "/Pagamenti",
                        read: false,
                        created_date: new Date().toISOString(),
                        sender_email: caller.email,
                    });
                }
            }
        }

        // T11: Notify all admins when a client/collaborator uploads proof
        if (newStatus === "in_verifica") {
            const proofAdmins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
            for (const admin of proofAdmins) {
                if (!admin.email) continue;
                await ctx.db.insert("notifications", {
                    user_email: admin.email,
                    type: "payment_proof_uploaded",
                    title: "Prova Pagamento Caricata 📎",
                    message: `${caller.email} ha caricato la prova per il pagamento "${payment.description}". Verifica e conferma.`,
                    link: "/Pagamenti",
                    read: false,
                    priority: "high",
                    created_date: new Date().toISOString(),
                    sender_email: caller.email,
                });
            }
        }

        return { success: true };
    },
});

export const markAsSent = mutation({
    args: {
        payment_id: v.id("payments"),
        proof_storage_id: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireRole(ctx, ["admin"]);
        const payment = await ctx.db.get(args.payment_id);
        if (!payment) throw new Error("Pagamento non trovato");

        const now = new Date().toISOString();
        if (!args.proof_storage_id && !payment.proof_url) {
            throw new Error("⚠️ Errore: Caricamento ricevuta di pagamento OBBLIGATORIO per confermare il pagamento.");
        }
        const data: any = {
            status: "pagato", // IWHome says they paid
            paid_date: now,
            sent_at: now,
            updated_date: now,
            confirmation_notes: args.notes,
        };
        if (args.proof_storage_id) data.proof_url = args.proof_storage_id;

        await ctx.db.patch(args.payment_id, data);

        // Notify recipient
        let recipientEmail = "";
        if (payment.supplier_id) {
            const s = await ctx.db.get(payment.supplier_id);
            if (s) recipientEmail = s.email;
        } else if (payment.collaborator_id) {
            const c = await ctx.db.get(payment.collaborator_id);
            if (c) recipientEmail = c.email;
        }

        if (recipientEmail) {
            await ctx.db.insert("notifications", {
                user_email: recipientEmail,
                type: "payment_sent",
                title: "Pagamento Inviato",
                message: `IWHome ha inviato un pagamento di €${payment.amount}. Per favore conferma la ricezione.`,
                link: "/Pagamenti",
                read: false,
                created_date: now,
                sender_email: caller.email,
            });
        }

        return { success: true };
    },
});

export const markAsReceived = mutation({
    args: {
        payment_id: v.id("payments"),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx); // Supplier or Collaborator
        const payment = await ctx.db.get(args.payment_id);
        if (!payment) throw new Error("Pagamento non trovato");

        // Verify caller is the intended recipient
        let isRecipient = false;
        if (payment.supplier_id) {
            const s = await ctx.db.get(payment.supplier_id);
            if (s && s.email === caller.email) isRecipient = true;
        } else if (payment.collaborator_id) {
            const c = await ctx.db.get(payment.collaborator_id);
            if (c && c.email === caller.email) isRecipient = true;
        }

        if (!isRecipient && caller.role !== "admin" ) {
            throw new Error("Solo il destinatario può confermare la ricezione.");
        }

        const now = new Date().toISOString();
        await ctx.db.patch(args.payment_id, {
            received_at: now,
            updated_date: now,
            recipient_notes: args.notes,
        });

        return { success: true };
    },
});

export const confirmPayment = mutation({
    args: {
        payment_id: v.id("payments"),
        notes: v.optional(v.string()),
        confirmed_amount: v.optional(v.number()), // actual amount verified by admin
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const payment = await ctx.db.get(args.payment_id);
        if (!payment) throw new Error("Pagamento non trovato");

        const now = new Date().toISOString();

        // Admin confirms client payments; Supplier confirms IWHome payments
        let finalStatus = "pagato";
        if (payment.type === "supplier") {
            if (caller.role !== "supplier") {
                throw new Error("Solo il fornitore può confermare la ricezione del pagamento.");
            }
            const supplier = await ctx.db.query("suppliers").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
            if (!supplier || supplier._id !== payment.supplier_id) {
                throw new Error("Non autorizzato a confermare questo pagamento.");
            }
            finalStatus = "confirmed";
        } else if (payment.type === "client") {
            if (caller.role !== "admin" ) {
                throw new Error("Solo l'amministratore può confermare i pagamenti dei clienti.");
            }
        }

        if (!payment.proof_url && payment.type === "client") {
            throw new Error("⚠️ Impossibile confermare senza ricevuta di pagamento allegata.");
        }

        // ─── Gestione Pagamento Parziale ──────────────────
        const verifiedAmount = args.confirmed_amount ?? payment.amount;
        if (verifiedAmount < payment.amount) {
            const remaining = payment.amount - verifiedAmount;
            // Save partial state — do NOT advance workflow
            await ctx.db.patch(args.payment_id, {
                status: "parziale",
                confirmed_amount: verifiedAmount,
                partial_amount: verifiedAmount,
                remaining_amount: remaining,
                confirmation_notes: args.notes,
                updated_date: now,
            });

            // Notify the payer about missing amount
            const payerEmail = payment.reference_id || payment.created_by;
            await ctx.db.insert("notifications", {
                user_email: payerEmail,
                type: "payment_partial",
                title: "⚠️ Pagamento Incompleto",
                message: `Pagamento "${payment.description}": importo ricevuto €${verifiedAmount.toFixed(2)}, dovuto €${payment.amount.toFixed(2)}, mancante €${remaining.toFixed(2)}. Integra il pagamento.`,
                link: "/Pagamenti",
                read: false,
                created_date: now,
                sender_email: caller.email,
                priority: "high",
            } as any);

            return { success: false, partial: true, remaining, message: `Pagamento parziale. Mancano €${remaining.toFixed(2)}.` };
        }

        // ─── Pagamento Completo ───────────────────────────
        await ctx.db.patch(args.payment_id, {
            status: finalStatus,
            paid_date: now,
            confirmed_amount: verifiedAmount,
            received_at: payment.type === "supplier" ? now : undefined,
            confirmation_notes: args.notes,
            updated_date: now,
        });

        // Workflow Triggers — find order via order_id OR via quote_id (fallback for acconto created before order)
        let workflowOrderId = payment.order_id;
        if (!workflowOrderId && (payment as any).quote_id) {
            const orderByQuote = await ctx.db
                .query("supplier_orders")
                .withIndex("by_quote", (q: any) => q.eq("quote_id", (payment as any).quote_id))
                .first();
            if (orderByQuote) workflowOrderId = orderByQuote._id;
        }
        if (workflowOrderId) {
            const order = await ctx.db.get(workflowOrderId);
            if (order) {
                const isAcconto = payment.description?.toLowerCase().includes("acconto");
                if (isAcconto && payment.type === "supplier") {
                    await ctx.db.patch(workflowOrderId as any, { acconto_paid: true });
                }

                if (payment.type === "client") {
                    // Client paid → mark acconto_paid, advance to step 9
                    await ctx.db.patch(order._id, {
                        acconto_paid: true,
                        acconto_payment_id: args.payment_id,
                        workflow_step: 9,
                        workflow_status: "IWHome ha Pagato il Fornitore",
                        updated_by: caller.email,
                        updated_date: now,
                    });
                    // Notify supplier that IWHome payment is coming
                    const supplier = await ctx.db.get(order.supplier_id);
                    if (supplier) {
                        await ctx.db.insert("notifications", {
                            user_email: supplier.email,
                            type: "payment_incoming",
                            title: "Pagamento in Arrivo da IWHome",
                            message: `Il cliente ha pagato. Conferma la ricezione del pagamento da IWHome per sbloccare la produzione.`,
                            link: "/Fornitori",
                            read: false,
                            created_date: now,
                            sender_email: caller.email,
                            priority: "high",
                        } as any);
                    }
                } else if (payment.type === "supplier" || finalStatus === "confirmed") {
                    // Fornitore confirms → step 10: Sblocca Produzione
                    await ctx.db.patch(order._id, {
                        status: "in_production",
                        workflow_step: 10,
                        workflow_status: "In Produzione",
                        locked: true,
                        produzione_sbloccata: true,
                        production_started_date: now,
                        updated_by: caller.email,
                        updated_date: now,
                    } as any);
                    // Notify admins
                    const admins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
                    for (const admin of admins) {
                        await ctx.db.insert("notifications", {
                            user_email: admin.email,
                            type: "production_unlocked",
                            title: "Produzione Sbloccata 🚀",
                            message: `Il fornitore ha confermato il pagamento. La produzione è ufficialmente iniziata.`,
                            link: "/Fornitori",
                            read: false,
                            created_date: now,
                            sender_email: caller.email,
                            priority: "high",
                        } as any);
                    }
                }
            }
        }

        // General notification
        await ctx.db.insert("notifications", {
            user_email: payment.created_by,
            type: "payment_confirmed",
            title: finalStatus === "confirmed" ? "Pagamento Ricevuto ✅" : "Pagamento Confermato ✅",
            message: `Il pagamento "${payment.description}" è stato confermato. Importo: €${verifiedAmount.toFixed(2)}.`,
            link: "/Pagamenti",
            read: false,
            created_date: now,
            sender_email: caller.email,
        });

        return { success: true };
    },
});

// ═══════════════════════════════════════════
// CLIENT: Upload payment proof
// ═══════════════════════════════════════════

export const uploadProof = mutation({
    args: {
        payment_id: v.id("payments"),
        proof_url: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const payment = await ctx.db.get(args.payment_id);
        if (!payment) throw new Error("Pagamento non trovato");
        // Client can only upload proof for their own payments
        if (caller.role === "client") {
            const convexUser = await ctx.db.query("users")
                .filter((q: any) => q.eq(q.field("email"), caller.email))
                .first();
            if (!convexUser) throw new Error("Utente non trovato");
            // Verify payment belongs to client (via quote or order)
        }
        await ctx.db.patch(args.payment_id, {
            proof_url: args.proof_url,
            proof_uploaded_at: new Date().toISOString(),
        } as any);
        // Notify admins
        const admins = await ctx.db.query("users")
            .filter((q: any) => q.or(
                q.eq(q.field("role"), "admin"),
                q.eq(q.field("role"), "superadmin")
            ))
            .collect();
        for (const admin of admins) {
            await ctx.db.insert("notifications", {
                user_id: admin._id,
                title: "Prova di Pagamento Ricevuta",
                message: `Un cliente ha caricato una prova di pagamento. Verifica nella sezione Pagamenti.`,
                type: "payment",
                read: false,
                link: "/Pagamenti",
                priority: "high",
                created_at: new Date().toISOString(),
            } as any);
        }
        return { success: true };
    },
});

// ═══════════════════════════════════════════
// CROSS-REFERENCE: Entity payments
// ═══════════════════════════════════════════

export const listForEntity = query({
    args: {
        supplier_id: v.optional(v.id("suppliers")),
        collaborator_id: v.optional(v.id("collaborators")),
        cantiere_id: v.optional(v.id("cantieri")),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        if (args.supplier_id) {
            return await ctx.db.query("payments").withIndex("by_supplier", (q: any) => q.eq("supplier_id", args.supplier_id)).collect();
        }
        if (args.collaborator_id) {
            return await ctx.db.query("payments").withIndex("by_collaborator", (q: any) => q.eq("collaborator_id", args.collaborator_id)).collect();
        }
        if (args.cantiere_id) {
            return await ctx.db.query("payments").withIndex("by_cantiere", (q: any) => q.eq("cantiere_id", args.cantiere_id)).collect();
        }
        return [];
    },
});

// ═══════════════════════════════════════════
// REJECT PAYMENT — reset to in_attesa + notify payer
// ═══════════════════════════════════════════
export const rejectPayment = mutation({
    args: {
        payment_id: v.id("payments"),
        reason: v.string(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const caller = await requireAnyAuth(ctx);
        const payment = await ctx.db.get(args.payment_id);
        if (!payment) throw new Error("Pagamento non trovato");

        const now = new Date().toISOString();

        // Authorization check
        if (payment.type === "client") {
            if (caller.role !== "admin" ) {
                throw new Error("Solo l'amministratore può rifiutare i pagamenti dei clienti.");
            }
        } else if (payment.type === "supplier") {
            if (caller.role !== "supplier") {
                throw new Error("Solo il fornitore può segnalare problemi sul pagamento ricevuto.");
            }
            const supplier = await ctx.db.query("suppliers").withIndex("by_email", (q: any) => q.eq("email", caller.email)).first();
            if (!supplier || supplier._id !== payment.supplier_id) {
                throw new Error("Non autorizzato a segnalare questo pagamento.");
            }
        }

        // Friendly reason labels for notifications
        const reasonLabels: Record<string, string> = {
            importo_errato: "L'importo pagato non corrisponde all'importo richiesto",
            prova_illeggibile: "La prova di pagamento è illeggibile o non valida",
            iban_errato: "Il pagamento è stato inviato a coordinate bancarie errate",
            causale_mancante: "La causale del bonifico è mancante o errata",
            bonifico_non_ricevuto: "Il bonifico non risulta ancora ricevuto sul conto IWHome",
            pagamento_non_ricevuto: "Il pagamento non risulta ancora ricevuto sul conto",
            prova_non_valida: "La prova di pagamento allegata non è valida o leggibile",
            dati_bancari_errati: "Il pagamento risulta inviato a coordinate bancarie errate",
            altro: args.notes || "Problema non specificato — contatta IWHome per chiarimenti",
        };
        const reasonText = reasonLabels[args.reason] || args.reason;

        // Reset status to in_attesa so payer can retry
        await ctx.db.patch(args.payment_id, {
            status: "in_attesa",
            rejection_reason: args.reason,
            rejection_notes: args.notes,
            rejected_at: now,
            rejected_by: caller.email,
            updated_date: now,
        } as any);

        if (payment.type === "client") {
            // Notify the client that their proof was rejected
            const payerEmail = payment.reference_id || payment.created_by;
            const fullMessage = `Il tuo pagamento "${payment.description}" di €${payment.amount.toFixed(2)} NON è stato accettato.\n\nMotivo: ${reasonText}${args.notes && args.reason !== "altro" ? `\n\nNote aggiuntive: ${args.notes}` : ""}\n\nCosa fare ora: torna nella sezione Pagamenti della tua area privata, effettua nuovamente il bonifico con i dati corretti e carica una nuova prova di pagamento.`;
            await ctx.db.insert("notifications", {
                user_email: payerEmail,
                type: "payment_rejected",
                title: "⚠️ Pagamento Non Accettato — Azione Richiesta",
                message: fullMessage,
                link: "/Dashboard",
                read: false,
                created_date: now,
                sender_email: caller.email,
                priority: "high",
            } as any);
        } else if (payment.type === "supplier") {
            // Notify admins that supplier flagged an issue
            const admins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
            for (const admin of admins) {
                await ctx.db.insert("notifications", {
                    user_email: admin.email,
                    type: "payment_issue",
                    title: "⚠️ Problema Pagamento Fornitore",
                    message: `Il fornitore ha segnalato un problema con il pagamento "${payment.description}" di €${payment.amount.toFixed(2)}.\n\nMotivo: ${reasonText}${args.notes ? `\n\nDettagli fornitore: ${args.notes}` : ""}\n\nAzione richiesta: verifica il pagamento nella sezione Pagamenti e ricarica la prova corretta.`,
                    link: "/Pagamenti",
                    read: false,
                    created_date: now,
                    sender_email: caller.email,
                    priority: "high",
                } as any);
            }
        }

        return { success: true };
    },
});

export const remove = mutation({
    args: { id: v.id("payments") },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["admin"]);
        await ctx.db.delete(args.id);
    },
});

// ═══════════════════════════════════════════
// CRON: Check overdue payments
// ═══════════════════════════════════════════

export const checkOverduePayments = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = new Date();
        const pending = await ctx.db.query("payments").withIndex("by_status", (q: any) => q.eq("status", "in_attesa")).collect();

        for (const payment of pending) {
            if (!payment.due_date) continue;
            const due = new Date(payment.due_date);
            if (due < now) {
                await ctx.db.patch(payment._id, { status: "in_ritardo", updated_date: now.toISOString() });
                // Notify admins
                const admins = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect();
                for (const admin of admins) {
                    await ctx.db.insert("notifications", {
                        user_email: admin.email,
                        type: "payment_overdue",
                        priority: "high",
                        title: "Pagamento in Ritardo",
                        message: `Pagamento "${payment.description}" di €${payment.amount} è in ritardo`,
                        link: "/Pagamenti",
                        read: false,
                        created_date: now.toISOString(),
                    });
                }
            }
        }
    },
});

// ═══════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const caller = await getCallerInfo(ctx);
        if (!caller || (caller.role !== "admin" )) return null;
        const all = await ctx.db.query("payments").collect();
        const supplierPayments = all.filter(p => p.type === "supplier");
        const collaboratorPayments = all.filter(p => p.type === "collaborator");
        const clientPayments = all.filter(p => p.type === "client");

        const totalPaid = all.filter(p => p.status === "pagato").reduce((sum, p) => sum + p.amount, 0);
        const totalPending = all.filter(p => p.status === "in_attesa").reduce((sum, p) => sum + p.amount, 0);
        const totalOverdue = all.filter(p => p.status === "in_ritardo").reduce((sum, p) => sum + p.amount, 0);
        const totalPartial = all.filter(p => p.status === "parziale").reduce((sum, p) => sum + p.amount, 0);

        // Task 4: Revenue stats — gross contract revenue from confirmed orders
        const allOrders = await ctx.db.query("supplier_orders").collect();
        const grossContractRevenue = allOrders
            .filter((o: any) => o.total_amount && o.total_amount > 0)
            .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

        // NEW: Net Revenue Formula = Total Paid - (Material Costs + Withholding Taxes)
        const totalMaterialCosts = allOrders.reduce((sum, o) => sum + (o.material_cost || 0), 0);
        const totalWithholdingTaxes = allOrders.reduce((sum, o) => sum + (o.withholding_tax || 0), 0);
        const netRevenue = totalPaid - (totalMaterialCosts + totalWithholdingTaxes);

        // Active collections: supplier payments that are paid
        const supplierPaid = supplierPayments.filter(p => p.status === "pagato").reduce((sum, p) => sum + p.amount, 0);
        const supplierPending = supplierPayments.filter(p => p.status === "in_attesa" || p.status === "in_ritardo").reduce((sum, p) => sum + p.amount, 0);

        // Monthly breakdown for chart data (last 12 months)
        const now = new Date();
        const monthlyData: Array<{ month: string; paid: number; pending: number }> = [];
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM
            const monthLabel = monthDate.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });

            const monthPaid = all
                .filter(p => p.status === "pagato" && p.paid_date && p.paid_date.startsWith(monthKey))
                .reduce((sum, p) => sum + p.amount, 0);
            const monthPending = all
                .filter(p => (p.status === "in_attesa" || p.status === "in_ritardo") && p.created_date.startsWith(monthKey))
                .reduce((sum, p) => sum + p.amount, 0);

            monthlyData.push({ month: monthLabel, paid: monthPaid, pending: monthPending });
        }

        // Per-supplier breakdown
        const supplierBreakdown: Array<{ supplier_id: string; name: string; paid: number; pending: number; total: number }> = [];
        const supplierMap = new Map<string, { name: string; paid: number; pending: number; total: number }>();
        for (const p of supplierPayments) {
            const sid = p.supplier_id as string;
            if (!sid) continue;
            const existing = supplierMap.get(sid) || { name: p.reference_name || "N/D", paid: 0, pending: 0, total: 0 };
            existing.total += p.amount;
            if (p.status === "pagato") existing.paid += p.amount;
            else existing.pending += p.amount;
            supplierMap.set(sid, existing);
        }
        for (const [supplier_id, data] of supplierMap.entries()) {
            supplierBreakdown.push({ supplier_id, ...data });
        }

        return {
            total: all.length,
            totalPaid,
            totalPending,
            totalOverdue,
            totalPartial,
            supplierCount: supplierPayments.length,
            collaboratorCount: collaboratorPayments.length,
            clientCount: clientPayments.length,
            overdue: all.filter(p => p.status === "in_ritardo").length,
            // Task 4: Revenue data
            grossContractRevenue,
            netRevenue,
            totalMaterialCosts,
            totalWithholdingTaxes,
            supplierPaid,
            supplierPending,
            monthlyData,
            supplierBreakdown,
        };
    },
});

// ═══════════════════════════════════════════
// IMPOSTAZIONI SISTEMA DI PAGAMENTO
// ═══════════════════════════════════════════

export const getPaymentSettings = query({
    args: {},
    handler: async (ctx) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return null;
        const settings = await ctx.db.query("payment_settings").order("desc").first();
        return settings || {
            acconto_b2c_pct: 30,
            acconto_b2b_pct: 40,
            intermedio_pct: 40,
            saldo_pct: 30,
            custom_client_overrides: [],
            custom_supplier_overrides: [],
        };
    },
});

export const updatePaymentSettings = mutation({
    args: {
        acconto_b2c_pct: v.optional(v.number()),
        acconto_b2b_pct: v.optional(v.number()),
        intermedio_pct: v.optional(v.number()),
        saldo_pct: v.optional(v.number()),
        custom_client_overrides: v.optional(v.array(v.object({
            client_id: v.string(),
            acconto_pct: v.number(),
            intermedio_pct: v.optional(v.number()),
            saldo_pct: v.number(),
        }))),
        custom_supplier_overrides: v.optional(v.array(v.object({
            supplier_id: v.string(),
            acconto_pct: v.number(),
            saldo_pct: v.number(),
        }))),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller || (caller.role !== "admin" )) {
            throw new Error("Solo l'Admin può modificare le impostazioni di pagamento.");
        }
        const existing = await ctx.db.query("payment_settings").order("desc").first();
        const now = new Date().toISOString();
        if (existing) {
            await ctx.db.patch(existing._id, { ...args, updated_date: now });
        } else {
            await ctx.db.insert("payment_settings", {
                ...args,
                created_by: caller.email,
                updated_date: now,
            } as any);
        }
        return { success: true };
    },
});

// Validate that an amount respects the configured percentages for B2B/B2C
export const validatePaymentAmount = query({
    args: {
        amount: v.number(),
        total: v.number(),
        client_type: v.optional(v.string()), // b2b | b2c
        payment_stage: v.optional(v.string()), // acconto | intermedio | saldo
    },
    handler: async (ctx, args) => {
        const settings = await ctx.db.query("payment_settings").order("desc").first();
        const isB2B = args.client_type === "b2b";
        const accontoPct = isB2B
            ? (settings?.acconto_b2b_pct ?? 40)
            : (settings?.acconto_b2c_pct ?? 30);
        const intermedioPct = settings?.intermedio_pct ?? 40;
        const saldoPct = settings?.saldo_pct ?? 30;

        const expectedAcconto = (args.total * accontoPct) / 100;
        const expectedIntermedio = (args.total * intermedioPct) / 100;
        const expectedSaldo = (args.total * saldoPct) / 100;

        const tolerance = 0.5; // €0.50 tolerance for rounding
        let expected = expectedAcconto;
        if (args.payment_stage === "intermedio") expected = expectedIntermedio;
        if (args.payment_stage === "saldo") expected = expectedSaldo;

        const isValid = Math.abs(args.amount - expected) <= tolerance || args.amount >= expected;
        return {
            valid: isValid,
            expected,
            received: args.amount,
            diff: expected - args.amount,
            percentages: { acconto: accontoPct, intermedio: intermedioPct, saldo: saldoPct },
        };
    },
});

// Generate a service payment for an external collaborator
export const generateServicePayment = mutation({
    args: {
        collaborator_id: v.id("collaborators"),
        description: v.string(),
        amount: v.number(),
        due_date: v.optional(v.string()),
        cantiere_id: v.optional(v.id("cantieri")),
    },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller || (caller.role !== "admin" )) {
            throw new Error("Solo l'Admin può creare pagamenti per servizi.");
        }
        const collab = await ctx.db.get(args.collaborator_id);
        if (!collab) throw new Error("Collaboratore non trovato.");
        if (collab.type !== "external") throw new Error("Solo i collaboratori esterni hanno pagamenti per servizio.");

        const id = await ctx.db.insert("payments", {
            type: "collaborator",
            reference_id: collab.email,
            reference_name: collab.full_name,
            collaborator_id: args.collaborator_id,
            cantiere_id: args.cantiere_id,
            description: args.description,
            amount: args.amount,
            payment_type: "prestazione",
            due_date: args.due_date,
            status: "in_attesa",
            created_by: caller.email,
            created_date: new Date().toISOString(),
        } as any);

        await ctx.db.insert("notifications", {
            user_email: collab.email,
            type: "payment_created",
            title: "Nuovo Pagamento per Servizio",
            message: `È stato creato un pagamento per "${args.description}": €${args.amount.toFixed(2)}.`,
            link: "/Pagamenti",
            read: false,
            created_date: new Date().toISOString(),
            sender_email: caller.email,
        } as any);

        return { success: true, payment_id: id };
    },
});

export const generateSalaryPayments = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthLabel = now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

        // Get all internal collaborators with a fixed salary
        const internalStaff = await ctx.db.query("collaborators")
            .withIndex("by_type", q => q.eq("type", "internal"))
            .collect();

        for (const staff of internalStaff) {
            if (!staff.salary || staff.salary <= 0) continue;

            // Check if payment for this month already exists
            const existing = await ctx.db.query("payments")
                .withIndex("by_collaborator", q => q.eq("collaborator_id", staff._id))
                .filter(q => q.and(
                    q.eq(q.field("payment_type"), "stipendio"),
                    q.gte(q.field("created_date"), firstDayOfMonth)
                ))
                .first();

            if (existing) continue;

            // Create salary payment
            await ctx.db.insert("payments", {
                type: "collaborator",
                reference_id: staff._id,
                reference_name: staff.full_name,
                collaborator_id: staff._id,
                description: `Stipendio ${monthLabel}`,
                amount: staff.salary,
                payment_type: "stipendio",
                status: "in_attesa",
                due_date: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(), // Due next 1st
                created_by: "system",
                created_date: now.toISOString(),
            });
        }
    },
});
