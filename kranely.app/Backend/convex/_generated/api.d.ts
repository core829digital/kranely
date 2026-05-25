/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as adminStats from "../adminStats.js";
import type * as appointments from "../appointments.js";
import type * as blog_posts from "../blog_posts.js";
import type * as blog_seed from "../blog_seed.js";
import type * as cantieri from "../cantieri.js";
import type * as certificates from "../certificates.js";
import type * as chat from "../chat.js";
import type * as chat_channels from "../chat_channels.js";
import type * as clients from "../clients.js";
import type * as collaborators from "../collaborators.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as edilizia from "../edilizia.js";
import type * as files from "../files.js";
import type * as internal_messages from "../internal_messages.js";
import type * as job_titles from "../job_titles.js";
import type * as migrate from "../migrate.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as payments from "../payments.js";
import type * as phase_tasks from "../phase_tasks.js";
import type * as quote_polls from "../quote_polls.js";
import type * as quotes from "../quotes.js";
import type * as rbac from "../rbac.js";
import type * as referralCodes from "../referralCodes.js";
import type * as seed_blog from "../seed_blog.js";
import type * as storageStats from "../storageStats.js";
import type * as suppliers from "../suppliers.js";
import type * as syncClerkUsers from "../syncClerkUsers.js";
import type * as tasks from "../tasks.js";
import type * as team_members from "../team_members.js";
import type * as users from "../users.js";
import type * as util_auth from "../util/auth.js";
import type * as util_rateLimit from "../util/rateLimit.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  adminStats: typeof adminStats;
  appointments: typeof appointments;
  blog_posts: typeof blog_posts;
  blog_seed: typeof blog_seed;
  cantieri: typeof cantieri;
  certificates: typeof certificates;
  chat: typeof chat;
  chat_channels: typeof chat_channels;
  clients: typeof clients;
  collaborators: typeof collaborators;
  conversations: typeof conversations;
  crons: typeof crons;
  documents: typeof documents;
  edilizia: typeof edilizia;
  files: typeof files;
  internal_messages: typeof internal_messages;
  job_titles: typeof job_titles;
  migrate: typeof migrate;
  notifications: typeof notifications;
  organizations: typeof organizations;
  payments: typeof payments;
  phase_tasks: typeof phase_tasks;
  quote_polls: typeof quote_polls;
  quotes: typeof quotes;
  rbac: typeof rbac;
  referralCodes: typeof referralCodes;
  seed_blog: typeof seed_blog;
  storageStats: typeof storageStats;
  suppliers: typeof suppliers;
  syncClerkUsers: typeof syncClerkUsers;
  tasks: typeof tasks;
  team_members: typeof team_members;
  users: typeof users;
  "util/auth": typeof util_auth;
  "util/rateLimit": typeof util_rateLimit;
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
