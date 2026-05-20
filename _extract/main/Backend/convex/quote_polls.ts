import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const createPoll = mutation({
    args: {
        conversation_id: v.string(), // Changed to string to support both types
        quote_id: v.optional(v.id("quotes")),
        document_id: v.optional(v.id("documents")),
        title: v.string(),
        description: v.optional(v.string()),
        options: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const userEmail = identity.email!;
        const userName = identity.name || userEmail.split('@')[0];

        // Create the poll
        const pollId = await ctx.db.insert("quote_polls", {
            conversation_id: args.conversation_id,
            quote_id: args.quote_id,
            document_id: args.document_id,
            title: args.title,
            description: args.description,
            options: args.options,
            votes: [],
            status: "active",
            created_by: userEmail,
            created_date: new Date().toISOString(),
        });

        // Trigger: Initiate business scope
        if (args.quote_id) {
            await ctx.db.patch(args.quote_id, { status: "negotiating" });
        }

        // Determine where to post the message (Conversation or Channel)
        const convId = ctx.db.normalizeId("conversations", args.conversation_id);
        const channelId = ctx.db.normalizeId("chat_channels", args.conversation_id);

        if (convId) {
            // Add a message to the conversation linking the poll
            await ctx.db.insert("conversation_messages", {
                conversation_id: convId,
                sender_email: userEmail,
                sender_name: userName,
                content: `📊 Nuovo sondaggio: ${args.title}`,
                created_date: new Date().toISOString(),
                read: false,
                poll_id: pollId,
            });
        } else if (channelId) {
            // Add a message to the channel linking the poll
            await ctx.db.insert("channel_messages", {
                channel_id: args.conversation_id, // Store as string based on schema
                sender_email: userEmail,
                sender_name: userName,
                content: `📊 Nuovo sondaggio: ${args.title}`,
                created_date: new Date().toISOString(),
                poll_id: pollId,
            });
        }

        return pollId;
    },
});

export const votePoll = mutation({
    args: {
        poll_id: v.id("quote_polls"),
        option: v.string(),
        note: v.optional(v.string()),
        proposed_price: v.optional(v.number()), // NEW: Negotiation support
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const userEmail = identity.email!;

        const poll = await ctx.db.get(args.poll_id);
        if (!poll) throw new Error("Poll not found");

        if (poll.status !== "active") throw new Error("Poll is closed");

        // Trigger: If accepted, finalize the business quote
        if (args.option === "Accetto") {
            let quoteId = poll.quote_id;

            // Fallback: If no quote_id, check if document_id is linked to a quote
            if (!quoteId && poll.document_id) {
                const doc = await ctx.db.get(poll.document_id);
                if (doc) {
                    if (doc.quote_id) {
                        quoteId = doc.quote_id;
                    } else {
                        // CRITICAL: If no quote exists, CREATE ONE from the document
                        // This ensures it appears in /Preventivi

                        // Try to find client
                        let clientEmail = "";
                        let clientName = "";

                        if (poll.conversation_id) {
                            // Try to resolve as Conversation
                            // We use a query because conversation_id is a string, not necessarily an ID type in the schema definition for polls
                            const convs = await ctx.db.query("conversations").filter(q => q.eq(q.field("_id"), poll.conversation_id)).collect();
                            const conv = convs[0];

                            if (conv && conv.client_email) {
                                clientEmail = conv.client_email;
                                clientName = conv.client_name || "";
                            }
                        }

                        // Fallback to user who is voting if they are not admin
                        // If userEmail is not admin, they are client.
                        const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", userEmail)).first();
                        const isUserAdmin = user?.role === 'admin';

                        if (!isUserAdmin && !clientEmail) {
                            clientEmail = userEmail;
                            clientName = user?.fullName || "";
                        }

                        if (clientEmail) {
                            // Link to Client ID
                            const client = await ctx.db.query("clients").withIndex("by_email", (q) => q.eq("email", clientEmail)).first();
                            let clientId = client?._id;

                            if (!clientId) {
                                clientId = await ctx.db.insert("clients", {
                                    email: clientEmail,
                                    full_name: clientName || clientEmail,
                                    status: "lead",
                                    created_by: "system", // or poll.created_by
                                    created_date: new Date().toISOString()
                                });
                            }

                            quoteId = await ctx.db.insert("quotes", {
                                full_name: clientName || clientEmail,
                                email: clientEmail,
                                status: "accepted",
                                quote_type: "custom",
                                created_date: new Date().toISOString(),
                                client_id: clientId,
                                files: [doc.file_url],
                                notes: `Generato automaticamente da sondaggio: ${poll.title}`,
                                estimated_price: 0 // Will be updated if proposed_price exists?
                            });

                            // Link poll to new quote
                            await ctx.db.patch(args.poll_id, { quote_id: quoteId });
                        }
                    }
                }
            }

            if (quoteId) {
                const quote = await ctx.db.get(quoteId);
                await ctx.db.patch(quoteId, {
                    status: "accepted",
                    notes: (quote?.notes || "") + "\n[Sondaggio] Accettato dal cliente via chat."
                });

                // Task 27: Automatic Transition from Request to Order
                // Find any supplier request that was finalized (preventivato) for this quote
                const linkedRequest = await ctx.db
                    .query("supplier_requests")
                    .withIndex("by_status", (q) => q.eq("status", "preventivato"))
                    .filter((q) => q.eq(q.field("quote_id"), quoteId))
                    .first();

                if (linkedRequest) {
                    // Create Order automatically
                    const order_number = `ORD-AUTO-${Date.now().toString(36).toUpperCase()}`;
                    const orderId = await ctx.db.insert("supplier_orders", {
                        supplier_id: linkedRequest.supplier_id,
                        request_id: linkedRequest._id,
                        quote_id: quoteId,
                        cantiere_id: quote?.cantiere_id,
                        order_number,
                        total_amount: linkedRequest.quoted_price || quote?.estimated_price || 0,
                        status: "confirmed",
                        workflow_step: 8,
                        workflow_status: "In Attesa Pagamento Cliente",
                        created_date: new Date().toISOString(),
                        updated_by: "system_poll",
                    });

                    // Update Request status
                    await ctx.db.patch(linkedRequest._id, {
                        status: "accepted"
                    });

                    // 1. Create Supplier Payment (Cost)
                    await ctx.db.insert("payments", {
                        type: "supplier",
                        reference_id: linkedRequest.supplier_id,
                        reference_name: "Fornitore (Auto)",
                        supplier_id: linkedRequest.supplier_id,
                        order_id: orderId,
                        cantiere_id: quote?.cantiere_id,
                        description: `Pagamento Fornitore - Ordine #${order_number}`,
                        amount: linkedRequest.quoted_price || 0,
                        payment_type: "fattura",
                        due_date: new Date().toISOString(),
                        status: "in_attesa",
                        sender_role: "admin", // IWHome pays the supplier
                        created_by: "system_poll",
                        created_date: new Date().toISOString(),
                    });

                    // 2. Create Client Payment (Revenue)
                    await ctx.db.insert("payments", {
                        type: "client",
                        reference_id: quote?.client_id as string,
                        reference_name: quote?.full_name || "Cliente",
                        client_id: quote?.client_id,
                        order_id: orderId,
                        cantiere_id: quote?.cantiere_id,
                        description: `Pagamento Cliente - Ordine #${order_number}`,
                        amount: quote?.estimated_price || 0,
                        payment_type: "fattura",
                        due_date: new Date().toISOString(),
                        status: "in_attesa",
                        sender_role: "client", // Client pays IWHome
                        created_by: "system_poll",
                        created_date: new Date().toISOString(),
                    });

                    // Notify all admins dynamically
                    await ctx.scheduler.runAfter(0, internal.notifications.notifyAllAdmins, {
                        title: "Client Accettazione Poll",
                        message: `Il cliente ha accettato il preventivo. Ordine ${order_number} creato automaticamente.`,
                        type: "poll_accepted_order",
                        link: "/Fornitori",
                        sender_email: "system@iwhome.app",
                    });
                }

                // Link the document as the definitive quote if present
                if (poll.document_id) {
                    const doc = await ctx.db.get(poll.document_id);
                    if (doc) {
                        await ctx.db.patch(poll.document_id, {
                            quote_id: quoteId,
                            category: "preventivo",
                            status: "accepted" // User requested "Accettato" status/badge
                        });

                        // Also update quote files for frontend compatibility
                        if (doc.file_url) {
                            const currentFiles = quote?.files || [];
                            if (!currentFiles.includes(doc.file_url)) {
                                await ctx.db.patch(quoteId, {
                                    files: [...currentFiles, doc.file_url]
                                });
                            }
                        }
                    }
                }
            }
            // Optionally close poll automatically
            await ctx.db.patch(args.poll_id, { status: "completed" });
        }

        // Check if user already voted
        const existingVoteIndex = poll.votes?.findIndex(v => v.user_email === userEmail);
        let newVotes = poll.votes || [];

        const voteData: any = {
            user_email: userEmail,
            option: args.option,
            voted_at: new Date().toISOString(),
            note: args.note,
        };
        if (args.proposed_price !== undefined) voteData.proposed_price = args.proposed_price;

        if (existingVoteIndex !== undefined && existingVoteIndex >= 0) {
            newVotes[existingVoteIndex] = voteData;
        } else {
            newVotes.push(voteData);
        }

        await ctx.db.patch(args.poll_id, { votes: newVotes });
    },
});

export const getPoll = query({
    args: { poll_id: v.id("quote_polls") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.poll_id);
    },
});

export const getByConversation = query({
    args: { conversation_id: v.string() }, // Changed to string
    handler: async (ctx, args) => {
        return await ctx.db
            .query("quote_polls")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversation_id))
            .collect();
    },
});

export const closePoll = mutation({
    args: { poll_id: v.id("quote_polls") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const poll = await ctx.db.get(args.poll_id);
        if (!poll) throw new Error("Poll not found");

        if (poll.created_by !== identity.email) {
            // Optional: Allow admins to close any poll
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();

            if (user?.role !== "admin") {
                throw new Error("Unauthorized to close this poll");
            }
        }

        await ctx.db.patch(args.poll_id, { status: "completed" });
    },
});

// Admin accepts a counter-offer from a client
export const acceptCounterOffer = mutation({
    args: {
        poll_id: v.id("quote_polls"),
        vote_index: v.number(), // Index of the vote in the array
        proposed_price: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Verify Admin/CEO
        const user = await ctx.db.query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (user?.role !== "admin") {
            throw new Error("Unauthorized: Only admins can accept counter-offers");
        }

        const poll = await ctx.db.get(args.poll_id);
        if (!poll) throw new Error("Poll not found");

        let quoteId = poll.quote_id;

        // Fallback: If no quote_id, CREATE ONE from linked document
        if (!quoteId && poll.document_id) {
            const doc = await ctx.db.get(poll.document_id);
            if (doc) {
                if (doc.quote_id) {
                    quoteId = doc.quote_id;
                } else {
                    // Create new quote from document + poll info
                    // Find client from conversation if possible
                    let clientEmail = "";
                    let clientName = "";

                    if (poll.conversation_id) {
                        // Try to get conversation
                        const convs = await ctx.db.query("conversations").filter(q => q.eq(q.field("_id"), poll.conversation_id)).collect();
                        const conv = convs[0];
                        if (conv && conv.client_email) {
                            clientEmail = conv.client_email;
                            clientName = conv.client_name || "";
                        }
                    }
                    // If still empty, maybe use the last voter who is not admin? Or just the counter-offer proposer?
                    // The vote we are accepting has user_email!
                    if (!clientEmail && poll.votes && poll.votes[args.vote_index]) {
                        clientEmail = poll.votes[args.vote_index].user_email;
                    }

                    if (clientEmail) {
                        // Link/Create Client
                        const client = await ctx.db.query("clients").withIndex("by_email", q => q.eq("email", clientEmail)).first();
                        let clientId = client?._id;
                        if (!clientId) {
                            clientId = await ctx.db.insert("clients", {
                                email: clientEmail,
                                full_name: clientName || clientEmail,
                                status: "lead",
                                created_by: identity.email!,
                                created_date: new Date().toISOString()
                            });
                        }

                        quoteId = await ctx.db.insert("quotes", {
                            full_name: clientName || clientEmail,
                            email: clientEmail,
                            status: "accepted",
                            quote_type: "custom",
                            created_date: new Date().toISOString(),
                            client_id: clientId,
                            files: [doc.file_url],
                            notes: `Generato da negoziazione: ${doc.title}`,
                            estimated_price: args.proposed_price
                        });

                        // Update poll link
                        await ctx.db.patch(args.poll_id, { quote_id: quoteId });
                    }
                }
            }
        }

        // 1. Update Quote (if linked)
        if (quoteId) {
            const quote = await ctx.db.get(quoteId);
            if (quote) {
                await ctx.db.patch(quoteId, {
                    status: "accepted",
                    estimated_price: args.proposed_price,
                    notes: (quote.notes || "") + `\n[Negoziazione] Controproposta di €${args.proposed_price} accettata da ${identity.name || identity.email}.`
                });

                // Link the document as the definitive quote if present
                if (poll.document_id) {
                    const doc = await ctx.db.get(poll.document_id);
                    if (doc) {
                        await ctx.db.patch(poll.document_id, {
                            quote_id: quoteId, // Ensure it's linked
                            category: "preventivo",
                            status: "accepted" // User requested "Accettato" status
                        });

                        // Also update quote files for frontend compatibility
                        if (doc.file_url) {
                            const currentFiles = quote?.files || [];
                            if (!currentFiles.includes(doc.file_url)) {
                                await ctx.db.patch(quoteId, {
                                    files: [...currentFiles, doc.file_url]
                                });
                            }
                        }
                    }
                }
            }
        } else {
            console.warn("Poll accepted but no linked quote found or created.");
        }

        // 2. Update Poll Status
        await ctx.db.patch(args.poll_id, { status: "completed" });

        // 3. Log Activity
        await ctx.db.insert("activity_log", {
            action: "negotiation_accepted",
            entity_type: quoteId ? "quote" : "poll", // distinct type if no quote
            entity_id: quoteId || poll.document_id || args.poll_id, // Fallback to ensure not null
            entity_name: poll.title,
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Controproposta di €${args.proposed_price} accettata`,
            created_date: new Date().toISOString(),
        });
    },
});

// Admin rejects a counter-offer
export const rejectCounterOffer = mutation({
    args: { poll_id: v.id("quote_polls") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Verify Admin/CEO
        const user = await ctx.db.query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (user?.role !== "admin") {
            throw new Error("Unauthorized: Only admins can reject counter-offers");
        }

        const poll = await ctx.db.get(args.poll_id);
        if (!poll) throw new Error("Poll not found");

        // Close the poll (end of this negotiation round)
        await ctx.db.patch(args.poll_id, { status: "completed" });

        // Log Activity
        await ctx.db.insert("activity_log", {
            action: "negotiation_rejected",
            entity_type: "quote",
            entity_id: poll.quote_id || args.poll_id,
            entity_name: poll.title,
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Controproposta rifiutata. Negoziazione chiusa.`,
            created_date: new Date().toISOString(),
        });
    },
});
