# Production Readiness Checklist

Last updated: 2026-06-01

This document tracks what is in place vs. what requires manual wiring before a full production launch. It is the canonical reference for the project lead and for the user who will connect optional services later.

---

## Status legend

- [x] = Implemented and working
- [~] = Code in place, requires external service / secret to activate
- [ ] = Not done

---

## Core infrastructure

- [x] **Authentication** — `kranely_session_data` cookie + Convex users table
- [x] **RBAC middleware** — `src/proxy.ts` redirects unauth users per role
- [x] **Authorization** — `assertOrgAccess` + `assertAdmin` on every Convex query/mutation
- [x] **Data isolation** — role-scoped lists (supplier/collaborator/client/driver) on clients, suppliers, collaborators, tasks, payments
- [x] **Activity logs** — every mutation logged with userId + entityType
- [x] **Rate limiting** — in-memory sliding window on `/api/contact` (5 req/min/IP) and webhooks
- [x] **Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP in `next.config.ts`
- [x] **Error boundaries** — `error.tsx` (route segment), `global-error.tsx` (root), `not-found.tsx` (404)
- [x] **Loading state** — `loading.tsx` (Suspense fallback)
- [x] **SEO** — `sitemap.ts` (13 static routes), `robots.ts` (disallows all dashboard), `manifest.webmanifest`
- [x] **Accessibility** — skip-link, focus-visible, 24×24 touch targets, prefers-reduced-motion, ARIA labels (WCAG 2.2 AA)
- [x] **E2E tests** — Playwright 1.60 covering marketing, auth, security, a11y
- [x] **TypeScript** — strict, `tsc --noEmit` clean
- [x] **ESLint** — clean for active codebase (legacy `_extract/`, `_extract2/`, `kranely.app/`, `convex/_generated/` ignored)
- [x] **Build** — `npm run build` passes, 57 routes, 0 errors

## Optional services (graceful degradation)

- [~] **Sentry** — `@sentry/nextjs` installed, `sentry.{client,server,edge}.config.ts` written, `instrumentation.ts` wired. Silently no-op when `NEXT_PUBLIC_SENTRY_DSN` is unset. **TODO:** create Sentry project at https://sentry.io, copy DSN to `.env.local`.
- [~] **Stripe** — `/api/stripe/webhook` route implemented with signature verification, returns `501 Stripe non configurato` when `STRIPE_SECRET_KEY` is missing. Checkout flow in `src/app/(dashboard)/payments` is **not yet built** (TODO future sprint). **TODO:** create Stripe account, copy keys to `.env.local`, build checkout page.
- [~] **Resend** — package installed (`resend@^6.12.3`), no route yet. No password-reset or quote-share emails sent today. **TODO:** create Resend account, verify sending domain, copy `RESEND_API_KEY` to `.env.local`, wire password-reset mutation.
- [~] **PostHog** — package referenced, no init. **TODO:** create project, copy key to `.env.local`.
- [~] **Supabase** — used only for legacy auth compat, no current write paths. **TODO:** decide whether to keep (used by `kranely_session` legacy cookie) or migrate fully to Convex.

## Pre-launch actions (manual)

1. **Set `NEXT_PUBLIC_SITE_URL`** in Vercel environment to `https://<your-domain>.it`.
2. **Create Convex prod deployment** (`npx convex deploy --prod`) and copy new `NEXT_PUBLIC_CONVEX_URL`.
3. **Set `ADMIN_EMAIL`** to the actual admin email.
4. **Generate a long random** session secret and store in Vercel (currently the cookie content is JSON, not signed — fine for non-PII but consider moving to JWT if adding any PII to the cookie).
5. **Run `npx convex dev`** to seed initial data via `/seed` page (admin only).
6. **Configure Vercel Cron** for the five cron route stubs (`/api/cron/*`) — currently empty placeholders. They are in the route table but have no handler.
7. **Configure Sentry** (see above).
8. **Configure Stripe** (see above).
9. **Configure Resend** (see above).
10. **Run Playwright** in CI: `npm run test:e2e:install && npm run test:e2e`.

## Vercel configuration

- **Build command:** `npm run build` (default)
- **Output directory:** `.next` (default)
- **Install command:** `npm install` (default)
- **Node version:** 20+
- **Domains:** configure in Vercel dashboard; update `NEXT_PUBLIC_SITE_URL` accordingly

## Browser support

- Modern evergreen browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Mobile: iOS Safari 14+, Chrome Android 90+
- PWA: `manifest.webmanifest` + 166 KB `kranely-logo.png` registered as `any` and `maskable`
- No IE 11 / legacy support

## Performance budget

- Initial JS bundle (largest chunk): 380 KB raw / ~120 KB gzipped (Convex + Next.js runtime)
- CSS: 67 KB (Tailwind purge)
- Largest asset: `kranely-logo.png` at 166 KB
- LCP target: < 1.5 s on 4G (Convex calls go to closest region; deployment is `hushed-kiwi-35`)

## Security model

- Cookies: `kranely_session_data` (mandatory, non-HttpOnly by design for middleware read), `kranely_session` (legacy Supabase compat, may be absent). `Secure` flag set only on HTTPS.
- `assertAdmin` hardcodes `ADMIN_EMAIL="contact.core829@gmail.com"`. To change the admin, edit `convex/auth.ts` and redeploy Convex.
- All Convex queries that read org data require `userEmail` and call `assertOrgAccess`.
- Public sign-up cannot create `admin` or `superadmin` — server-validated.
- File uploads capped at 50 MB server-side.
- No `dangerouslySetInnerHTML`, no `eval`, no `innerHTML` in `src/`. All `window.open()` calls go through `safeWindowUrl` which blocks `javascript:`, `data:`, `vbscript:`, `file:` schemes.
- CSP locks third-party origins to: Convex, Sentry, Stripe, Google Fonts. Any new third-party service must be added to the `connect-src` / `script-src` / `frame-src` directives in `next.config.ts`.

## Rollback

- Vercel: previous deployment always one click away in the Vercel dashboard.
- Convex: `npx convex rollback` (Convex Pro feature). Without Convex Pro, mutations are version-controlled via `npx convex deploy` and rollback = redeploy previous code.

## Monitoring

- **Sentry** (TODO) for runtime errors and performance.
- **Vercel Analytics** is free for hobby tier; enable in Vercel dashboard.
- **Convex Dashboard** (`https://dashboard.convex.dev`) shows query latency, function call counts, errors.

## Known limitations

1. **Linting:** 508 remaining issues are pre-existing (mostly `react/no-unescaped-entities` and `user` unused warnings in Convex files). Not introduced by recent refactors. Cleanup is a separate sprint.
2. **i18n:** next-intl is installed but no `[locale]` route segment. App is hardcoded Italian — see `docs/i18n-policy.md`.
3. **HttpOnly cookies:** `kranely_session_data` is non-HttpOnly (set via `document.cookie` from auth context). The cookie contains only `role` and `organizationId`, no PII. Migration to HttpOnly requires server-side session store.
4. **Cron jobs:** five route stubs under `/api/cron/*` are placeholders; not actually scheduled.
5. **Empty API dirs:** `src/app/api/{upload,seed}` are empty. Uploads go through Convex; `/seed` is an admin-only UI page.
6. **FR/ES/DE translations:** placeholder strings only (~800 B); IT and EN are full.

---

For service-by-service setup details, see the inline comments in `.env.example` and the relevant code files.
