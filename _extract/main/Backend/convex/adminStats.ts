import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCallerInfo } from "./rbac";

// Get comprehensive admin dashboard stats
export const getAdminStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        // Verify admin role
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (user?.role !== "admin" && user?.role !== "superadmin") {
            return null;
        }

        // Get all data for stats
        const clients = await ctx.db.query("clients").collect();
        const cantieri = await ctx.db.query("cantieri").collect();
        const quotes = await ctx.db.query("quotes").collect();
        const appointments = await ctx.db.query("appointments").collect();
        const conversations = await ctx.db.query("conversations").collect();
        const users = await ctx.db.query("users").collect();
        const documents = await ctx.db.query("documents").collect();

        // ═══ NEW: Enterprise module data ═══
        const suppliers = await ctx.db.query("suppliers").collect();
        const collaborators = await ctx.db.query("collaborators").collect();
        const payments = await ctx.db.query("payments").collect();
        const certificates = await ctx.db.query("certificates").collect();
        const orders = await ctx.db.query("supplier_orders").collect();

        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Calculate revenue from actual payments (total paid by anyone)
        const totalPaid = payments.filter(p => p.status === 'pagato').reduce((sum, p) => sum + p.amount, 0);
        const totalRevenue = totalPaid;

        // NEW: Net Revenue Formula = Total Paid - (Material Costs + Withholding Taxes)
        const totalMaterialCosts = orders.reduce((sum, o) => sum + (o.material_cost || 0), 0);
        const totalWithholdingTaxes = orders.reduce((sum, o) => sum + (o.withholding_tax || 0), 0);
        const netRevenue = totalPaid - (totalMaterialCosts + totalWithholdingTaxes);

        // Cantieri by status
        const cantieriByStatus = {
            in_lavorazione: cantieri.filter(c => c.status === 'in_lavorazione').length,
            posa_in_opera: cantieri.filter(c => c.status === 'posa_in_opera').length,
            in_pausa: cantieri.filter(c => c.status === 'in_pausa').length,
            completato: cantieri.filter(c => c.status === 'completato').length,
        };

        // Today's appointments
        const todayAppointments = appointments.filter(a =>
            a.appointment_date?.startsWith(today)
        );

        // Unread messages (sum of unread_admin for all conversations)
        const unreadMessages = conversations.reduce((sum, c) => sum + (c.unread_admin ?? 0), 0);

        // Recent clients (this week)
        const recentClients = clients.filter(c => c.created_date >= weekAgo);

        // Pending quotes
        const pendingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');

        // Users by role
        const usersByRole = {
            superadmin: users.filter(u => u.role === 'superadmin').length,
            admin: users.filter(u => u.role === 'admin').length,
            client: users.filter(u => u.role === 'client').length,
            supplier: users.filter(u => u.role === 'supplier').length,
            collaborator: users.filter(u => u.role === 'collaborator').length,
            user: users.filter(u => u.role === 'user').length,
        };

        // ═══ Enterprise Stats ═══
        const paymentsPaid = payments.filter(p => p.status === 'pagato').reduce((sum, p) => sum + p.amount, 0);
        const paymentsPending = payments.filter(p => p.status === 'in_attesa').reduce((sum, p) => sum + p.amount, 0);
        const paymentsOverdue = payments.filter(p => p.status === 'in_ritardo').reduce((sum, p) => sum + p.amount, 0);

        const acceptedQuotes = quotes.filter(q => q.status === 'accepted');

        return {
            // Summary numbers
            totalClients: clients.filter(c => c.status === 'active').length,
            totalCantieri: cantieri.length,
            totalRevenue,
            netRevenue,
            todayAppointments: todayAppointments.length,
            unreadMessages,
            totalDocuments: documents.length,

            // Detailed breakdowns
            cantieriByStatus,
            pendingQuotes: pendingQuotes.length,
            totalQuotes: quotes.length,
            acceptedQuotes: acceptedQuotes.length,
            recentClients: recentClients.length,
            totalAppointments: appointments.length,
            usersByRole,
            totalUsers: users.length,

            // For display
            quotesThisWeek: quotes.filter(q => q.created_date >= weekAgo).length,
            appointmentsThisWeek: appointments.filter(a =>
                (a.appointment_date || '') >= weekAgo
            ).length,
            documentsThisWeek: documents.filter(d => (d.created_date || '') >= weekAgo).length,

            // ═══ Enterprise Module Stats ═══
            totalSuppliers: suppliers.length,
            activeSuppliers: suppliers.filter(s => s.status === 'active').length,
            totalCollaborators: collaborators.length,
            activeCollaborators: collaborators.filter(c => c.status === 'active').length,
            collaboratorsInCantiere: collaborators.filter(c => c.live_status === 'in_cantiere').length,

            // Payments overview
            totalPayments: payments.length,
            paymentsPaid,
            paymentsPending,
            paymentsOverdue,
            paymentsOverdueCount: payments.filter(p => p.status === 'in_ritardo').length,

            // Certificates overview
            totalCertificates: certificates.length,
            certificatesValid: certificates.filter(c => c.status === 'valid').length,
            certificatesExpiring: certificates.filter(c => c.status === 'expiring').length,
            certificatesExpired: certificates.filter(c => c.status === 'expired').length,

            // Orders overview
            totalOrders: orders.length,
            ordersActive: orders.filter(o => o.status === 'confirmed' || o.status === 'in_production' || o.status === 'shipped').length,
            ordersDelivered: orders.filter(o => o.status === 'delivered').length,
        };
    },
});

// Get recent activity log entries
export const getRecentActivity = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Verify admin role
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (user?.role !== "admin" && user?.role !== "superadmin") {
            return [];
        }

        return await ctx.db
            .query("activity_log")
            .order("desc")
            .take(args.limit || 10);
    },
});

// Get cantieri with progress for admin dashboard
export const getCantieriProgress = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (user?.role !== "admin" && user?.role !== "superadmin") {
            return [];
        }

        const cantieri = await ctx.db.query("cantieri").order("desc").take(5);

        return cantieri.map(c => ({
            _id: c._id,
            nome_cantiere: c.nome_cantiere,
            cliente: c.cliente,
            status: c.status,
            progresso_in_lavorazione: c.progresso_in_lavorazione || 0,
            progresso_posa_in_opera: c.progresso_posa_in_opera || 0,
            progresso_completamento: c.progresso_completamento || 0,
            valore_contratto: c.valore_contratto,
        }));
    },
});

export const getStaffTasks = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const caller = await getCallerInfo(ctx);
        if (!caller) return [];
        // Admin/superadmin can query any email; collaborators only their own
        if (caller.role !== "admin" && caller.email !== args.email) {
            return [];
        }
        return await ctx.db
            .query("phase_tasks")
            .withIndex("by_assigned", (q: any) => q.eq("assigned_to", args.email))
            .collect();
    },
});
