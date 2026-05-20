import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAnyAuth, requireRole } from "./rbac";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const docs = await ctx.db
            .query("documents")
            .withIndex("by_creator", (q) => q.eq("created_by", identity.email!))
            .order("desc")
            .collect();

        // Filter out example documents
        const realDocs = docs.filter(d => !d.file_url.includes('example.com'));

        // Get user details for creator (optional, but good for consistency)
        const creator = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        return await Promise.all(realDocs.map(async (doc) => ({
            ...doc,
            creator_name: creator?.fullName || "Me",
            file_url: (doc.file_url && !doc.file_url.startsWith('http'))
                ? await ctx.storage.getUrl(doc.file_url).catch(() => null)
                : (doc.file_url && doc.file_url.includes('/api/storage/'))
                    ? await ctx.storage.getUrl(doc.file_url.split('/api/storage/')[1]).catch(() => null)
                    : doc.file_url
        })));
    },
});

export const generateUploadUrl = mutation(async (ctx) => {
    await requireAnyAuth(ctx);
    return await ctx.storage.generateUploadUrl();
});


export const getByUser = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Security: non-admins can only request their own documents
        if (identity.email !== args.email) {
            const requester = await ctx.db.query("users").withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
            const isAdmin = requester?.role === "admin" || requester?.role === "superadmin";
            if (!isAdmin) return [];
        }

        // 1. Docs created by this user
        const createdDocs = await ctx.db
            .query("documents")
            .withIndex("by_creator", (q) => q.eq("created_by", args.email))
            .collect();

        // 2. Docs shared explicitly with this email
        // (getSharedWith logic integrated here for efficiency or kept separate? 
        //  Documents.jsx calls getSharedWith separately. But we want a unified view for "My Documents"?)
        //  The user asked for "Client sees documents Admin updated for him".

        // Find if this user is a "Client" entity
        const clientProfile = await ctx.db
            .query("clients")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        let clientDocs: any[] = [];
        if (clientProfile) {
            // 3. Docs linked to this Client ID
            clientDocs = await ctx.db
                .query("documents")
                .withIndex("by_client", (q) => q.eq("client_id", clientProfile._id))
                .collect();
        }

        // 4. Docs shared via shared_with array
        // We can scan or use getSharedWith logic. To keep it simple/performant, 
        // if we assume 'shared_with' is used less often than client_id linking for bulk ops,
        // we might leave it to the separate 'sharedDocs' query in Frontend, OR merge here.
        // Let's merge purely 'created_by' and 'client_id' here, as that covers "Admin uploads for Client".

        // Merge and deduplicate
        const allDocs = [...createdDocs, ...clientDocs];
        const uniqueDocs = Array.from(new Map(allDocs.map(item => [item._id, item])).values());

        // Filter out example documents
        const realDocs = uniqueDocs.filter(d => !d.file_url.includes('example.com'));

        const creator = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        return await Promise.all(realDocs.map(async (doc) => ({
            ...doc,
            creator_name: doc.created_by === args.email ? (creator?.fullName || "Me") : "Admin", // Simplified
            file_url: (doc.file_url && !doc.file_url.startsWith('http'))
                ? await ctx.storage.getUrl(doc.file_url).catch(() => null)
                : (doc.file_url && doc.file_url.includes('/api/storage/'))
                    ? await ctx.storage.getUrl(doc.file_url.split('/api/storage/')[1]).catch(() => null)
                    : doc.file_url
        })));
    },
});

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const caller = await requireRole(ctx, ["admin", "superadmin"]).catch(() => null);
        if (!caller) return [];

        const docs = await ctx.db
            .query("documents")
            .order("desc")
            .collect();

        // Filter out example documents
        const realDocs = docs.filter(d => !d.file_url.includes('example.com'));

        // Get unique creator emails
        const creatorEmails = [...new Set(realDocs.map(d => d.created_by))];
        const creators = await Promise.all(
            creatorEmails.map(email =>
                ctx.db.query("users").withIndex("by_email", q => q.eq("email", email || "")).first()
            )
        );
        const creatorMap = new Map(creators.map(u => [u?.email, u?.fullName]));

        return await Promise.all(realDocs.map(async (doc) => ({
            ...doc,
            creator_name: creatorMap.get(doc.created_by) || doc.created_by,
            file_url: (doc.file_url && !doc.file_url.startsWith('http'))
                ? await ctx.storage.getUrl(doc.file_url).catch(() => null)
                : (doc.file_url && doc.file_url.includes('/api/storage/'))
                    ? await ctx.storage.getUrl(doc.file_url.split('/api/storage/')[1]).catch(() => null)
                    : doc.file_url
        })));
    },
});

// Get documents shared with a specific user
export const getSharedWith = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Ownership: only admin or the user themselves may query their shared docs
        const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
        const isAdmin = user?.role === "admin" || user?.role === "superadmin";
        if (!isAdmin && identity.email !== args.email) return [];

        // Get all documents where shared_with contains the user's email
        // Also include public documents
        const allDocs = await ctx.db.query("documents").collect();
        const sharedDocs = allDocs.filter(doc =>
            (doc.shared_with?.includes(args.email)) ||
            (doc.is_public === "true" && doc.created_by !== args.email)
        );

        return await Promise.all(sharedDocs.map(async (doc) => ({
            ...doc,
            file_url: (doc.file_url && !doc.file_url.startsWith('http'))
                ? await ctx.storage.getUrl(doc.file_url).catch(() => null)
                : (doc.file_url && doc.file_url.includes('/api/storage/'))
                    ? await ctx.storage.getUrl(doc.file_url.split('/api/storage/')[1]).catch(() => null)
                    : doc.file_url
        })));
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        category: v.string(),
        file_url: v.string(),
        file_name: v.string(),
        file_type: v.optional(v.string()),
        file_size: v.number(),
        is_public: v.optional(v.string()),
        // Support both old (created_by) and new (email/uploaded_by) styles
        created_by: v.optional(v.string()),
        email: v.optional(v.string()),
        uploaded_by: v.optional(v.string()),
        created_date: v.optional(v.string()),
        shared_with: v.optional(v.array(v.string())), // UPDATED to array to match schema
        quote_id: v.optional(v.id("quotes")), // NEW
        client_id: v.optional(v.id("clients")), // NEW: Allow linking to client on creation
        cantiere_id: v.optional(v.id("cantieri")), // NEW
        order_id: v.optional(v.id("supplier_orders")), // NEW
        delivery_id: v.optional(v.id("supplier_deliveries")), // NEW
        status: v.optional(v.string()), // draft, definitive
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Always use the authenticated identity email as creator — prevents spoofing
        // and works correctly for all roles (supplier token record may have role=client
        // due to legacy duplicate user records, so we skip the role check entirely
        // when the creator is the authenticated user themselves).
        const identityEmail = identity.email || identity.subject;
        const requestedEmail = (args.created_by || args.email || "").toLowerCase().trim();
        const identityEmailNorm = (identityEmail || "").toLowerCase().trim();

        let creatorEmail: string;
        if (!requestedEmail || requestedEmail === identityEmailNorm) {
            // Uploading for self — always allowed
            creatorEmail = identityEmail!;
        } else {
            // Uploading for someone else — requires admin
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();
            // Also check by email in case token record is out of sync
            const userByEmail = !user ? await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", identityEmailNorm))
                .first() : null;
            const effectiveRole = user?.role || userByEmail?.role;
            if (effectiveRole !== "admin" && effectiveRole !== "superadmin") {
                throw new Error("Unauthorized: You can only upload documents for yourself.");
            }
            creatorEmail = requestedEmail;
        }

        const id = await ctx.db.insert("documents", {
            title: args.title,
            description: args.description,
            category: args.category,
            file_url: args.file_url,
            file_name: args.file_name,
            file_type: args.file_type,
            file_size: args.file_size,
            is_public: args.is_public,
            created_by: creatorEmail,
            created_date: args.created_date || new Date().toISOString(),
            shared_with: args.shared_with || [], // Compatibility fix
            quote_id: args.quote_id,
            client_id: args.client_id, // NEW
            cantiere_id: args.cantiere_id, // NEW
            order_id: args.order_id, // NEW
            delivery_id: args.delivery_id, // NEW
            status: args.status || 'draft', // Default to draft
        });

        await ctx.db.insert("activity_log", {
            action: "created",
            entity_type: "document",
            entity_id: id,
            entity_name: args.title,
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Documento caricato: ${args.title}`,
            created_date: new Date().toISOString(),
        });

        return id;
    },
});

export const deleteDocument = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const doc = await ctx.db.get(args.id);
        if (!doc) throw new Error("Document not found");

        if (doc.created_by !== identity.email) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();

            if (user?.role !== "admin" && user?.role !== "superadmin") {
                throw new Error("Unauthorized");
            }
        }

        await ctx.db.insert("activity_log", {
            action: "deleted",
            entity_type: "document",
            entity_id: args.id,
            entity_name: doc.title,
            user_name: identity.name || identity.email!,
            user_email: identity.email!,
            details: `Documento eliminato: ${doc.title}`,
            created_date: new Date().toISOString(),
        });

        // Delete file from Convex storage (only if it's a storage ID, not external URL)
        if (doc.file_url) {
            try {
                let storageId: string | null = null;
                if (!doc.file_url.startsWith('http')) {
                    storageId = doc.file_url;
                } else if (doc.file_url.includes('/api/storage/')) {
                    storageId = doc.file_url.split('/api/storage/')[1].split('?')[0];
                }
                if (storageId) {
                    await ctx.storage.delete(storageId as any);
                }
            } catch (e) {
                // Don't fail delete if storage cleanup fails
                console.warn("Storage cleanup failed:", e);
            }
        }

        await ctx.db.delete(args.id);
    },
});

export const getByQuote = query({
    args: { quote_id: v.id("quotes") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const docs = await ctx.db
            .query("documents")
            .withIndex("by_quote", (q) => q.eq("quote_id", args.quote_id))
            .collect();

        return await Promise.all(docs.map(async (doc) => ({
            ...doc,
            file_url: (doc.file_url && !doc.file_url.startsWith('http'))
                ? await ctx.storage.getUrl(doc.file_url).catch(() => null)
                : (doc.file_url && doc.file_url.includes('/api/storage/'))
                    ? await ctx.storage.getUrl(doc.file_url.split('/api/storage/')[1]).catch(() => null)
                    : doc.file_url
        })));
    },
});

/**
 * Get all files shared via chat (conversation messages + channel messages) for a given email.
 * Returns a normalized list compatible with the SharedDocuments page.
 */
export const getChatSharedFiles = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const files: any[] = [];

        // 1. Conversation messages — find conversations this user is part of
        const convAsClient = await ctx.db.query("conversations")
            .withIndex("by_client", (q: any) => q.eq("client_email", args.email))
            .collect();
        const convAsAdmin = await ctx.db.query("conversations")
            .withIndex("by_admin", (q: any) => q.eq("admin_email", args.email))
            .collect();
        const conversations = [...convAsClient, ...convAsAdmin];

        for (const conv of conversations) {
            const messages = await ctx.db.query("conversation_messages")
                .withIndex("by_conversation", (q: any) => q.eq("conversation_id", conv._id))
                .collect();
            for (const msg of messages) {
                if (msg.attachments && msg.attachments.length > 0) {
                    for (let i = 0; i < msg.attachments.length; i++) {
                        const att = msg.attachments[i];
                        let resolvedUrl = att.file_url;
                        if (resolvedUrl && !resolvedUrl.startsWith('http')) {
                            resolvedUrl = await ctx.storage.getUrl(resolvedUrl).catch(() => null) || resolvedUrl;
                        }
                        files.push({
                            _id: `${msg._id}-att-${i}`,
                            title: att.file_name || "File allegato",
                            description: `Chat con ${msg.sender_email === args.email ? (conv.admin_email || conv.client_email) : msg.sender_email}`,
                            category: "chat",
                            file_url: resolvedUrl,
                            file_name: att.file_name,
                            file_type: att.file_type,
                            created_by: msg.sender_name || msg.sender_email,
                            created_date: msg.created_date,
                        });
                    }
                }
            }
        }

        // 2. Channel messages — find channels where user is a member
        const allChannels = await ctx.db.query("chat_channels").collect();
        const userChannels = allChannels.filter(ch => ch.members?.includes(args.email));

        for (const channel of userChannels) {
            const messages = await ctx.db.query("channel_messages")
                .withIndex("by_channel", (q: any) => q.eq("channel_id", channel._id.toString()))
                .collect();
            for (const msg of messages) {
                // Direct file on message
                if (msg.file_url && msg.file_name) {
                    let resolvedUrl = msg.file_url;
                    if (resolvedUrl && !resolvedUrl.startsWith('http')) {
                        resolvedUrl = await ctx.storage.getUrl(resolvedUrl).catch(() => null) || resolvedUrl;
                    }
                    files.push({
                        _id: `${msg._id}-file`,
                        title: msg.file_name,
                        description: `Canale: ${channel.name}`,
                        category: "chat",
                        file_url: resolvedUrl,
                        file_name: msg.file_name,
                        file_type: (msg as any).file_type || "application/octet-stream",
                        created_by: msg.sender_name || msg.sender_email,
                        created_date: msg.created_date,
                    });
                }
                // Attachments array
                if (msg.attachments && msg.attachments.length > 0) {
                    for (let i = 0; i < msg.attachments.length; i++) {
                        const att = msg.attachments[i];
                        let resolvedUrl = att.file_url;
                        if (resolvedUrl && !resolvedUrl.startsWith('http')) {
                            resolvedUrl = await ctx.storage.getUrl(resolvedUrl).catch(() => null) || resolvedUrl;
                        }
                        files.push({
                            _id: `${msg._id}-ch-att-${i}`,
                            title: att.file_name || "File allegato",
                            description: `Canale: ${channel.name}`,
                            category: "chat",
                            file_url: resolvedUrl,
                            file_name: att.file_name,
                            file_type: att.file_type,
                            created_by: msg.sender_name || msg.sender_email,
                            created_date: msg.created_date,
                        });
                    }
                }
            }
        }

        // 3. Internal messages — find messages sent to/from this user's channel types
        const internalMsgs = await ctx.db.query("internal_messages").collect();
        const userInternalMsgs = internalMsgs.filter(msg => 
            msg.sender_email === args.email || 
            (msg.channel_id && msg.channel_id.includes(args.email)) || // Assuming sometimes channel_id may be email or linked ID
            msg.channel_type === "admin" // For simplicity if they can see admin messages
        );
        
        // Let's do a more robust check: get supplier ID or collaborator ID for this email
        const userCollab = await ctx.db.query("collaborators").withIndex("by_email", q => q.eq("email", args.email)).first();
        const userSupplier = await ctx.db.query("suppliers").withIndex("by_email", q => q.eq("email", args.email)).first();
        
        const validInternalMsgs = internalMsgs.filter(msg => {
            if (msg.sender_email === args.email) return true;
            if (userCollab && msg.channel_id === userCollab._id) return true;
            if (userSupplier && msg.channel_id === userSupplier._id) return true;
            return false;
        });

        for (const msg of validInternalMsgs) {
            // Check direct file on message
            if (msg.file_url) {
                let resolvedUrl = msg.file_url;
                if (resolvedUrl && !resolvedUrl.startsWith('http')) {
                    resolvedUrl = await ctx.storage.getUrl(resolvedUrl).catch(() => null) || resolvedUrl;
                }
                files.push({
                    _id: `${msg._id}-int-file`,
                    title: msg.file_name || "File interno",
                    description: `Canale Interno: ${msg.channel_type}`,
                    category: "chat",
                    file_url: resolvedUrl,
                    file_name: msg.file_name,
                    file_type: msg.file_type || "document",
                    created_by: msg.sender_name || msg.sender_email,
                    created_date: msg.created_date,
                });
            }
            // Check attachments
            if (msg.attachments && msg.attachments.length > 0) {
                for (let i = 0; i < msg.attachments.length; i++) {
                    const storageId = msg.attachments[i];
                    let resolvedUrl = storageId;
                    if (resolvedUrl && !resolvedUrl.startsWith('http')) {
                        resolvedUrl = await ctx.storage.getUrl(resolvedUrl).catch(() => null) || resolvedUrl;
                    }
                    files.push({
                        _id: `${msg._id}-int-att-${i}`,
                        title: "Allegato interno",
                        description: `Canale Interno: ${msg.channel_type}`,
                        category: "chat",
                        file_url: resolvedUrl,
                        file_name: "Allegato",
                        file_type: "document",
                        created_by: msg.sender_name || msg.sender_email,
                        created_date: msg.created_date,
                    });
                }
            }
        }

        // Sort by date desc
        return files.sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
    },
});

export const getById = query({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const doc = await ctx.db.get(args.id);
        if (!doc) return null;

        // Authorization: admin sees all; others must be creator, shared_with, or linked client
        const user = await ctx.db.query("users").withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
        const isAdmin = user?.role === "admin" || user?.role === "superadmin";

        if (!isAdmin) {
            const email = identity.email!;
            const isCreator = doc.created_by === email;
            const isSharedWith = Array.isArray(doc.shared_with) && doc.shared_with.includes(email);
            // Check if linked to this user's client profile
            const clientProfile = await ctx.db.query("clients").withIndex("by_email", (q: any) => q.eq("email", email)).first();
            const isLinkedClient = clientProfile && doc.client_id?.toString() === clientProfile._id.toString();
            if (!isCreator && !isSharedWith && !isLinkedClient) return null;
        }

        // URL handling
        const file_url = (doc.file_url && !doc.file_url.startsWith('http'))
            ? await ctx.storage.getUrl(doc.file_url).catch(() => null)
            : (doc.file_url && doc.file_url.includes('/api/storage/'))
                ? await ctx.storage.getUrl(doc.file_url.split('/api/storage/')[1]).catch(() => null)
                : doc.file_url;

        return { ...doc, file_url };
    },
});
