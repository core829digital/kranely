import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sync users from Clerk every 15 minutes
crons.interval(
    "sync users from clerk",
    { minutes: 15 },
    internal.syncClerkUsers.syncFromClerk
);

// Check expiring certificates daily
crons.interval(
    "check expiring certificates",
    { hours: 24 },
    internal.certificates.checkExpiringCertificates
);

// Check overdue payments daily
crons.interval(
    "check overdue payments",
    { hours: 24 },
    internal.payments.checkOverduePayments
);

// Automatically generate monthly salary payments on the 1st of every month
crons.cron(
    "generate monthly salaries",
    "0 0 1 * *",
    internal.payments.generateSalaryPayments
);

// Check advance delivery notifications every 6 hours (1w / 48h / 24h before delivery)
crons.interval(
    "check delivery advance notifications",
    { hours: 6 },
    internal.suppliers.checkDeliveryAdvanceNotifications
);

// Check expired client quotes every 12 hours (expire + 24h warning notifications)
crons.interval(
    "check expired quotes",
    { hours: 12 },
    internal.suppliers.checkExpiredQuotes
);

export default crons;
