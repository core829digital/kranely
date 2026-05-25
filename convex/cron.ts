import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const cron = cronJobs()

cron.cron(
  "check-certificate-expiry",
  "*/60 * * * *",
  internal.notifications.checkCertificateExpiry,
  {}
)

cron.cron(
  "check-payment-due",
  "0 9 * * *",
  internal.notifications.checkPaymentDue,
  {}
)

cron.cron(
  "check-overdue-payments",
  "0 10 * * *",
  internal.notifications.checkOverduePayments,
  {}
)

export default cron
