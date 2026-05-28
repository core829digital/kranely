/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityLog from "../activityLog.js";
import type * as analytics from "../analytics.js";
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as authorization from "../authorization.js";
import type * as blog from "../blog.js";
import type * as cantieri from "../cantieri.js";
import type * as certificates from "../certificates.js";
import type * as chat from "../chat.js";
import type * as cleanup from "../cleanup.js";
import type * as clients from "../clients.js";
import type * as collaborators from "../collaborators.js";
import type * as companyTeams from "../companyTeams.js";
import type * as conversationMessages from "../conversationMessages.js";
import type * as conversations from "../conversations.js";
import type * as cron from "../cron.js";
import type * as dashboard from "../dashboard.js";
import type * as documents from "../documents.js";
import type * as drivers from "../drivers.js";
import type * as ediliziaPrices from "../ediliziaPrices.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as idGenerator from "../idGenerator.js";
import type * as internalMessages from "../internalMessages.js";
import type * as jobTitles from "../jobTitles.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as notifications from "../notifications.js";
import type * as orgProvision from "../orgProvision.js";
import type * as organizations from "../organizations.js";
import type * as paymentSettings from "../paymentSettings.js";
import type * as payments from "../payments.js";
import type * as quotePolls from "../quotePolls.js";
import type * as quotes from "../quotes.js";
import type * as referral from "../referral.js";
import type * as seed from "../seed.js";
import type * as stripe from "../stripe.js";
import type * as subscriptions from "../subscriptions.js";
import type * as supplierDeliveries from "../supplierDeliveries.js";
import type * as supplierOrders from "../supplierOrders.js";
import type * as supplierProduction from "../supplierProduction.js";
import type * as supplierRequests from "../supplierRequests.js";
import type * as suppliers from "../suppliers.js";
import type * as tasks from "../tasks.js";
import type * as upload from "../upload.js";
import type * as whitelabel from "../whitelabel.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLog: typeof activityLog;
  analytics: typeof analytics;
  appointments: typeof appointments;
  auth: typeof auth;
  authorization: typeof authorization;
  blog: typeof blog;
  cantieri: typeof cantieri;
  certificates: typeof certificates;
  chat: typeof chat;
  cleanup: typeof cleanup;
  clients: typeof clients;
  collaborators: typeof collaborators;
  companyTeams: typeof companyTeams;
  conversationMessages: typeof conversationMessages;
  conversations: typeof conversations;
  cron: typeof cron;
  dashboard: typeof dashboard;
  documents: typeof documents;
  drivers: typeof drivers;
  ediliziaPrices: typeof ediliziaPrices;
  email: typeof email;
  http: typeof http;
  idGenerator: typeof idGenerator;
  internalMessages: typeof internalMessages;
  jobTitles: typeof jobTitles;
  "lib/helpers": typeof lib_helpers;
  notifications: typeof notifications;
  orgProvision: typeof orgProvision;
  organizations: typeof organizations;
  paymentSettings: typeof paymentSettings;
  payments: typeof payments;
  quotePolls: typeof quotePolls;
  quotes: typeof quotes;
  referral: typeof referral;
  seed: typeof seed;
  stripe: typeof stripe;
  subscriptions: typeof subscriptions;
  supplierDeliveries: typeof supplierDeliveries;
  supplierOrders: typeof supplierOrders;
  supplierProduction: typeof supplierProduction;
  supplierRequests: typeof supplierRequests;
  suppliers: typeof suppliers;
  tasks: typeof tasks;
  upload: typeof upload;
  whitelabel: typeof whitelabel;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
