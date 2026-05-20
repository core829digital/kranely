import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { checkRateLimit } from "./util/rateLimit";

// Get user's own appointments
export const get = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        return await ctx.db
            .query("appointments")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .order("desc")
            .collect();
    },
});

// Get ALL appointments (for Admin/CEO)
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            return [];
        }

        return await ctx.db
            .query("appointments")
            .order("desc")
            .collect();
    },
});

// Check availability for a specific date/time
export const checkAvailability = query({
    args: {
        date: v.string(),
        time: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("appointments")
            .withIndex("by_date", (q) => q.eq("appointment_date", args.date))
            .filter((q) => q.eq(q.field("appointment_time"), args.time))
            .filter((q) => q.neq(q.field("status"), "cancelled"))
            .first();

        return { available: !existing };
    },
});

// Get booked slots for a date (to show unavailable times)
export const getBookedSlots = query({
    args: { date: v.string() },
    handler: async (ctx, args) => {
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_date", (q) => q.eq("appointment_date", args.date))
            .filter((q) => q.neq(q.field("status"), "cancelled"))
            .collect();

        return appointments.map((a) => a.appointment_time);
    },
});

// Create appointment with availability check and notifications
export const create = mutation({
    args: {
        appointment_date: v.string(),
        appointment_time: v.string(),
        project_type: v.string(),
        notes: v.optional(v.string()),
        email: v.string(),
        full_name: v.optional(v.string()),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Rate limit: max 5 appointment requests per 24 hours per user
        await checkRateLimit(ctx, "create_appointment", identity.email!, {
            limit: 5,
            window: 24 * 60 * 60 * 1000,
        });

        // Check for double booking
        const existing = await ctx.db
            .query("appointments")
            .withIndex("by_date", (q) => q.eq("appointment_date", args.appointment_date))
            .filter((q) => q.eq(q.field("appointment_time"), args.appointment_time))
            .filter((q) => q.neq(q.field("status"), "cancelled"))
            .first();

        if (existing) {
            throw new Error("Orario non disponibile. Per favore scegli un altro orario.");
        }

        // Check if user exists and promote to 'client' if role is 'user'
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (user && user.role === 'user') {
            await ctx.db.patch(user._id, { role: 'client' });

            // Log this role change
            await ctx.db.insert("activity_log", {
                user_email: user.email,
                user_name: user.fullName,
                action: "role_change",
                entity_type: "user",
                entity_id: user._id,
                details: "Automatic promotion to Client upon appointment booking",
                created_date: new Date().toISOString(),
            });

            // Also add to 'clients' table if not already there (for CRM management)
            const existingClient = await ctx.db
                .query("clients")
                .withIndex("by_email", (q) => q.eq("email", user.email))
                .first();

            if (!existingClient) {
                await ctx.db.insert("clients", {
                    full_name: args.full_name || user.fullName || user.email.split('@')[0],
                    email: user.email,
                    phone: args.phone,
                    status: "active",
                    created_by: "system",
                    created_date: new Date().toISOString(),
                    notes: "Auto-created from appointment booking",
                });
            }

            // Notify user of promotion
            await ctx.scheduler.runAfter(0, internal.notifications.triggerAccountUpdate, {
                email: user.email,
                changes: { role: 'client' }
            });
        }

        // Create appointment
        const createdByRole = user?.role || "user";
        const id = await ctx.db.insert("appointments", {
            ...args,
            status: "pending",
            created_by: identity.email,
            created_by_role: createdByRole,
        });

        // Send email to client
        await ctx.scheduler.runAfter(0, api.actions.sendAppointmentEmail, {
            to: args.email,
            appointmentDetails: {
                full_name: args.full_name,
                appointment_date: args.appointment_date,
                appointment_time: args.appointment_time,
                project_type: args.project_type,
                notes: args.notes,
                location: "Showroom IwHome, Via Montefiorino 10/E, Reggio Emilia"
            }
        });

        // Create notifications using centralized trigger (notifies Client + Admins)
        // status: "pending" — appointment is just requested, not yet confirmed by staff
        await ctx.scheduler.runAfter(0, internal.notifications.triggerAppointment, {
            appointment_id: id.toString(),
            user_email: args.email,
            date: args.appointment_date,
            time: args.appointment_time,
            status: "pending"
        });

        return id;


    },
});

// Public appointment booking — no auth required (used by Calcolatore for logged-out users).
// Admin always sees these via getAll. email and phone are mandatory for follow-up.
export const createPublic = mutation({
    args: {
        appointment_date: v.string(),
        appointment_time: v.string(),
        project_type: v.string(),
        notes: v.optional(v.string()),
        email: v.string(),
        full_name: v.string(),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        // Check for double booking
        const existing = await ctx.db
            .query("appointments")
            .withIndex("by_date", (q) => q.eq("appointment_date", args.appointment_date))
            .filter((q) => q.eq(q.field("appointment_time"), args.appointment_time))
            .filter((q) => q.neq(q.field("status"), "cancelled"))
            .first();

        if (existing) {
            throw new Error("Orario non disponibile. Per favore scegli un altro orario.");
        }

        const id = await ctx.db.insert("appointments", {
            ...args,
            status: "pending",
            created_by: args.email,
            created_by_role: "guest",
        });

        // Email confirmation to client
        await ctx.scheduler.runAfter(0, api.actions.sendAppointmentEmail, {
            to: args.email,
            appointmentDetails: {
                full_name: args.full_name,
                appointment_date: args.appointment_date,
                appointment_time: args.appointment_time,
                project_type: args.project_type,
                notes: args.notes,
                location: "Showroom IwHome, Via Montefiorino 10/E, Reggio Emilia",
            }
        });

        // In-app notification to all admins so they see it in MyAppointments > Tutti
        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();
        for (const admin of admins) {
            if (!admin.email) continue;
            await ctx.db.insert("notifications", {
                user_email: admin.email,
                type: "appointment",
                priority: "high",
                read: false,
                title: "Nuovo Appuntamento",
                message: `${args.full_name} (${args.email}) ha prenotato per il ${args.appointment_date} alle ${args.appointment_time}.`,
                link: "/MyAppointments",
                sender_email: args.email,
                created_date: new Date().toISOString(),
            });
        }

        return id;
    },
});

export const updateStatus = mutation({
    args: { id: v.id("appointments"), status: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Ownership check: admin can update any; users can only update their own
        const appointment = await ctx.db.get(args.id);
        if (!appointment) throw new Error("Appuntamento non trovato");

        const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
        const isAdmin = user?.role === "admin" || user?.role === "superadmin";
        if (!isAdmin && appointment.email !== identity.email) throw new Error("Non autorizzato");

        await ctx.db.patch(args.id, { status: args.status });

        // Log status change — re-fetch for updated data
        const updatedAppointment = await ctx.db.get(args.id);
        if (updatedAppointment) {
            await ctx.db.insert("activity_log", {
                user_email: identity.email!,
                user_name: identity.name || identity.email!,
                action: "updated_status",
                entity_type: "appointment",
                entity_id: args.id,
                entity_name: updatedAppointment.full_name || updatedAppointment.email,
                details: `Stato appuntamento aggiornato a: ${args.status}`,
                created_date: new Date().toISOString(),
            });

            // T21: Notify appointment owner when admin changes status
            if (isAdmin && appointment.email) {
                let notifTitle = "Aggiornamento Appuntamento 📅";
                let notifMsg = `Il tuo appuntamento del ${appointment.appointment_date} è stato aggiornato.`;
                if (args.status === "confirmed") {
                    notifTitle = "Appuntamento Confermato ✅";
                    notifMsg = `Il tuo appuntamento del ${appointment.appointment_date} alle ${appointment.appointment_time || ""} è stato confermato. Ti aspettiamo!`;
                } else if (args.status === "cancelled" || args.status === "rejected") {
                    notifTitle = "Appuntamento Annullato ❌";
                    notifMsg = `Il tuo appuntamento del ${appointment.appointment_date} è stato annullato. Contattaci per riprogrammarlo.`;
                } else if (args.status === "completed") {
                    notifTitle = "Appuntamento Completato ✅";
                    notifMsg = `Il tuo appuntamento del ${appointment.appointment_date} è stato segnato come completato. Grazie!`;
                }
                await ctx.db.insert("notifications", {
                    user_email: appointment.email,
                    type: "appointment_update",
                    title: notifTitle,
                    message: notifMsg,
                    link: "/MyAppointments",
                    read: false,
                    priority: "high",
                    created_date: new Date().toISOString(),
                    sender_email: identity.email!,
                });
            }
        }
    },
});

export const update = mutation({
    args: {
        id: v.id("appointments"),
        appointment_date: v.optional(v.string()),
        appointment_time: v.optional(v.string()),
        project_type: v.optional(v.string()),
        notes: v.optional(v.string()),
        full_name: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Ownership check: admin can update any; users can only update their own
        const appointment = await ctx.db.get(args.id);
        if (!appointment) throw new Error("Appuntamento non trovato");

        const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
        const isAdmin = user?.role === "admin" || user?.role === "superadmin";
        if (!isAdmin && appointment.email !== identity.email) throw new Error("Non autorizzato");

        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);

        // Log update — re-fetch for updated data
        const updatedAppointment = await ctx.db.get(id);
        if (updatedAppointment) {
            await ctx.db.insert("activity_log", {
                user_email: identity.email!,
                user_name: identity.name || identity.email!,
                action: "updated",
                entity_type: "appointment",
                entity_id: id,
                entity_name: updatedAppointment.full_name || updatedAppointment.email,
                details: "Dettagli appuntamento modificati",
                created_date: new Date().toISOString(),
            });
        }
    },
});

export const deleteAppointment = mutation({
    args: { id: v.id("appointments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        const appointment = await ctx.db.get(args.id);
        if (!appointment) throw new Error("Appointment not found");

        // Allow if Admin/SuperAdmin OR if it's the user's own appointment
        const isAdmin = user?.role === "admin" || user?.role === "superadmin";
        const isOwner = appointment.email === identity.email;

        if (!isAdmin && !isOwner) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);

        // Log deletion
        if (user) {
            await ctx.db.insert("activity_log", {
                user_email: user.email,
                user_name: user.fullName || user.email,
                action: "deleted",
                entity_type: "appointment",
                entity_id: args.id,
                details: `Appuntamento del ${appointment.appointment_date} eliminato`,
                created_date: new Date().toISOString(),
            });
        }
    },
});
