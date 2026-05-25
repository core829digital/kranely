import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// ── Security Helpers ──────────────────────────────────────────────────────────

/** Basic email format validation */
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Simple sliding-window rate limiter using the rate_limits table.
 * key    — unique identifier (e.g. "edilizia:<email>")
 * max    — max requests allowed in the window
 * ms     — window size in milliseconds (default 1 hour)
 */
async function enforceRateLimit(ctx: any, key: string, max: number, ms = 3_600_000) {
    const now = Date.now();
    const windowStart = now - ms;

    const record = await ctx.db
        .query("rate_limits")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .unique();

    if (record) {
        if (record.window_start < windowStart) {
            // Expired window — reset
            await ctx.db.patch(record._id, { count: 1, window_start: now });
            return;
        }
        if (record.count >= max) {
            throw new Error("Troppe richieste. Riprova tra un'ora.");
        }
        await ctx.db.patch(record._id, { count: record.count + 1 });
    } else {
        await ctx.db.insert("rate_limits", { key, count: 1, window_start: now });
    }
}

// Default prices — used as fallback when no DB record exists yet.
// All values are in EUR.
const DEFAULT_PRICES = {
    price_per_mq: 800,
    multiplier_nord: 1.1,
    multiplier_centro: 1.0,
    multiplier_sud: 0.85,
    multiplier_villa: 1.2,
    multiplier_casale: 1.15,
    multiplier_appartamento: 1.0,
    multiplier_media: 1.0,
    multiplier_degradato: 1.25,
    tramezzi_20: 80,
    tramezzi_50: 150,
    tramezzi_100: 250,
    elettrico_piccole: 40,
    elettrico_standard: 90,
    elettrico_domotico: 150,
    riscaldamento_adeguamento: 60,
    finiture_alta_qualita_extra: 0.20,
    controsoffittature_mq: 80,
    porta_unit: 600,
    finestra_unit: 450,
    parquet_mq: 75,
    marmo_mq: 120,
    monocottura_mq: 45,
    resina_mq: 90,
    bagno_unit: 4500,
    pittura_mq: 15,
};

// ── Read current prices (public — needed for real-time frontend calc) ──────────
export const getPrices = query({
    args: {},
    handler: async (ctx) => {
        const record = await ctx.db
            .query("edilizia_prices")
            .order("desc")
            .first();
        if (!record) return DEFAULT_PRICES;
        return record;
    },
});

// ── Save an edilizia quote request ────────────────────────────────────────────
// Works for both authenticated and anonymous users.
export const createRequest = mutation({
    args: {
        // Section 1 — Contact
        email: v.string(),
        full_name: v.string(),
        // Section 2 — Property
        mq: v.number(),
        tipo_immobile: v.optional(v.string()),
        ubicazione: v.string(),
        stato_conservazione: v.optional(v.string()),
        // Section 3 — Works
        spostamento_tramezzi: v.optional(v.string()),
        impianto_elettrico: v.optional(v.string()),
        riscaldamento: v.optional(v.string()),
        finiture: v.optional(v.string()),
        // Section 4 — Completamento
        controsoffittature_mq: v.optional(v.number()),
        porte_num: v.optional(v.number()),
        finestre_num: v.optional(v.number()),
        parquet_mq: v.optional(v.number()),
        marmo_mq: v.optional(v.number()),
        monocottura_mq: v.optional(v.number()),
        resina_mq: v.optional(v.number()),
        bagni_num: v.optional(v.number()),
        pittura: v.optional(v.string()),
        // Meta
        estimated_price: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Input validation
        if (!isValidEmail(args.email)) throw new Error("Indirizzo email non valido.");
        if (!args.full_name || args.full_name.trim().length < 2) throw new Error("Nome non valido.");
        if (args.mq <= 0 || args.mq > 10000) throw new Error("Superficie non valida.");

        // Rate limiting: max 5 requests per email per hour
        await enforceRateLimit(ctx, `edilizia:${args.email.toLowerCase()}`, 5);

        const ediliziaConfig = {
            mq: args.mq,
            tipo_immobile: args.tipo_immobile,
            ubicazione: args.ubicazione,
            stato_conservazione: args.stato_conservazione,
            spostamento_tramezzi: args.spostamento_tramezzi,
            impianto_elettrico: args.impianto_elettrico,
            riscaldamento: args.riscaldamento,
            finiture: args.finiture,
            controsoffittature_mq: args.controsoffittature_mq,
            porte_num: args.porte_num,
            finestre_num: args.finestre_num,
            parquet_mq: args.parquet_mq,
            marmo_mq: args.marmo_mq,
            monocottura_mq: args.monocottura_mq,
            resina_mq: args.resina_mq,
            bagni_num: args.bagni_num,
            pittura: args.pittura,
        };

        // Save as a standard quote (quote_type: 'edilizia')
        const quoteId = await ctx.db.insert("quotes", {
            email: args.email,
            full_name: args.full_name,
            quote_type: "edilizia",
            status: "draft",
            estimated_price: args.estimated_price,
            project_config: ediliziaConfig,
            notes: args.notes,
            created_date: new Date().toISOString(),
        });

        const priceLabel = `€${args.estimated_price.toLocaleString("it-IT")}`;

        // Notify all admins dynamically
        await ctx.scheduler.runAfter(0, internal.notifications.notifyAllAdmins, {
            title: "Nuova Richiesta Edilizia",
            message: `${args.full_name || args.email} ha richiesto un preventivo ristrutturazione per ${args.mq} MQ. Stima: ${priceLabel}`,
            type: "edilizia_request",
            priority: "high",
            link: "/Preventivi",
        });

        // Schedule email — non-blocking
        await ctx.scheduler.runAfter(0, api.actions.sendEdiliziaEmail, {
            to: args.email,
            quoteDetails: {
                full_name: args.full_name,
                email: args.email,
                estimated_price: args.estimated_price,
                edilizia_config: ediliziaConfig,
                notes: args.notes,
            },
        });

        return quoteId;
    },
});

// ── Save a Render 3D request ──────────────────────────────────────────────────
// No automatic price — IWHome will calculate and respond manually by email.
export const createRender3DRequest = mutation({
    args: {
        email: v.string(),
        full_name: v.string(),
        mode: v.string(), // 'per_stanza' | 'appartamento_intero'
        rooms: v.array(v.object({
            room_id: v.string(),
            room_label: v.string(),
            mq: v.number(),
        })),
        total_mq: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Input validation
        if (!isValidEmail(args.email)) throw new Error("Indirizzo email non valido.");
        if (!args.full_name || args.full_name.trim().length < 2) throw new Error("Nome non valido.");
        if (args.rooms.length === 0 || args.rooms.length > 20) throw new Error("Numero stanze non valido.");

        // Rate limiting: max 5 requests per email per hour
        await enforceRateLimit(ctx, `render3d:${args.email.toLowerCase()}`, 5);

        const render3DConfig = {
            mode: args.mode,
            rooms: args.rooms,
            total_mq: args.total_mq,
        };

        const quoteId = await ctx.db.insert("quotes", {
            email: args.email,
            full_name: args.full_name,
            quote_type: "render3d",
            status: "draft",
            estimated_price: 0, // Manual pricing by IWHome
            project_config: render3DConfig,
            notes: args.notes,
            created_date: new Date().toISOString(),
        });

        // Notify all admins dynamically
        await ctx.scheduler.runAfter(0, internal.notifications.notifyAllAdmins, {
            title: "Nuova Richiesta Render 3D",
            message: `${args.full_name || args.email} ha richiesto un Render 3D per ${args.rooms.length} stanze (${args.total_mq} MQ totali).`,
            type: "render3d_request",
            priority: "high",
            link: "/Preventivi",
        });

        await ctx.scheduler.runAfter(0, api.actions.sendRender3DEmail, {
            to: args.email,
            requestDetails: {
                full_name: args.full_name,
                email: args.email,
                mode: args.mode,
                rooms: args.rooms,
                total_mq: args.total_mq,
                notes: args.notes,
            },
        });

        return quoteId;
    },
});

// ── Admin: update prices ──────────────────────────────────────────────────────
export const updatePrices = mutation({
    args: {
        price_per_mq: v.number(),
        multiplier_nord: v.number(),
        multiplier_centro: v.number(),
        multiplier_sud: v.number(),
        multiplier_villa: v.number(),
        multiplier_casale: v.number(),
        multiplier_appartamento: v.number(),
        multiplier_media: v.number(),
        multiplier_degradato: v.number(),
        tramezzi_20: v.number(),
        tramezzi_50: v.number(),
        tramezzi_100: v.number(),
        elettrico_piccole: v.number(),
        elettrico_standard: v.number(),
        elettrico_domotico: v.number(),
        riscaldamento_adeguamento: v.number(),
        finiture_alta_qualita_extra: v.number(),
        controsoffittature_mq: v.number(),
        porta_unit: v.number(),
        finestra_unit: v.number(),
        parquet_mq: v.number(),
        marmo_mq: v.number(),
        monocottura_mq: v.number(),
        resina_mq: v.number(),
        bagno_unit: v.number(),
        pittura_mq: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized: Admin access required");
        }

        const priceData = {
            ...args,
            updated_by: user.email,
            updated_date: new Date().toISOString(),
        };

        const existing = await ctx.db
            .query("edilizia_prices")
            .order("desc")
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, priceData);
            return existing._id;
        } else {
            return await ctx.db.insert("edilizia_prices", priceData);
        }
    },
});
