<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Key Next.js 16 quirks this project relies on:
- `ReactDOM.preconnect()` / `ReactDOM.prefetchDNS()` instead of `<link rel="preconnect">` in `<head>` — see `src/components/ResourceHints.tsx`.
- Route Handlers (`src/app/api/*/route.ts`) are serverless / dynamic by default; do not use module-scope `setInterval` for long-lived state.
- Middleware lives at `src/proxy.ts` (not `middleware.ts`) — this is the Next.js 16 rename.
<!-- END:nextjs-agent-rules -->

---

# Kranely — Project Agent Rules

## Stack
- **Next.js 16.2.6** (Turbopack, App Router) + React 19.2.4
- **Convex** (`convex/`) for backend, real-time queries, auth, storage
- **Tailwind 4** + custom design tokens in `src/app/globals.css`
- **next-intl 4.12** installed but NOT routed — see `docs/i18n-policy.md`
- **Playwright** for E2E — see `e2e/README.md`

## Roles
`superadmin | admin | supplier | collaborator | client | driver`
- `admin` registration blocked in public sign-up (server-validated by Convex).
- `superadmin` = `assertAdmin` gated by hardcoded `ADMIN_EMAIL="contact.core829@gmail.com"`.
- Smart data isolation: see `convex/{clients,suppliers,collaborators,tasks,payments,quotes}.ts` — every query uses `assertOrgAccess` and scopes by user role.

## Auth & Session
- Cookie: `kranely_session_data` (mandatory, read by `src/proxy.ts` middleware). Non-HttpOnly by design (set via `document.cookie` in `auth-context.tsx`).
- Cookie: `kranely_session` (legacy Supabase compat, may be absent).
- `Secure` flag set only on HTTPS (preserves local HTTP dev).
- Login lockout: per-user `failedAttempts` + `lastLoginAttempt` (Convex schema).
- API rate limit: in-memory sliding window, serverless-safe (lazy GC) — see `src/lib/rate-limit.ts`. 5 req/min/IP on `/api/contact`.

## Backend → Frontend
- All queries org-scoped: pass `userEmail` (and `organizationId` for storage ops) when calling Convex queries.
- Storage `saveFile` enforces 50 MB cap on server.
- `DOC_TYPES` filter accepts both EN/IT for backward compat; new uploads use EN (`contract|quote|invoice|technical|certificate|photo|other`).
- Status enums: payments `in_attesa|in_verifica|pagato|in_ritardo|parziale`, quotes `draft|sent|accepted|rejected|in_lavorazione`, appointments `scheduled|confirmed|completed|cancelled|no_show`, chat channels `general|project|private|announcement`.

## UI Conventions
- **Italian-first.** All user copy in `src/app/(public)/*` and `src/app/(dashboard)/*` is hardcoded Italian. Do not introduce a `[locale]` route segment. See `docs/i18n-policy.md`.
- Marketing pages share `PublicNav` + `PublicFooter` from `src/components/`.
- Dashboard pages share `Sidebar` + `Header` from `src/components/dashboard/`. Sidebar handles mobile overlay.
- All `<main>` elements have `id="main-content"` (skip-link target).
- Use `safeWindowOpen(url)` from `src/lib/utils/` instead of `window.open()` (blocks `javascript:`, `data:`, `vbscript:`, `file:` URLs).
- Use `isSafeUrl()` for any URL that becomes an `href`.

## A11y
- Skip-link at top of every page (`<a class="skip-link">Salta al contenuto principale</a>`).
- Focus-visible: 2px gold outline (2px offset) on all interactive elements (`@layer a11y` in `src/app/globals.css`).
- 24×24 min touch targets.
- `prefers-reduced-motion: reduce` zeros all animations.
- Action buttons need `aria-label` (use `client.fullName` not `client.name`).

## Build & CI
- `npm run build` must pass cleanly (57 routes, 0 errors, 0 warnings).
- `npm run lint` and `npm run typecheck` should pass.
- `npm run test:e2e` for Playwright suite (requires `npm run test:e2e:install` first).
- PowerShell `Set-Content -NoNewline` corrupts UTF-8 in `.tsx` files — use the Write tool for code edits, not PowerShell file writes.

## Don't Do
- Don't refactor unrelated code (surgical fixes only).
- Don't add new public-facing features without confirming scope.
- Don't expose `assertAdmin` / `ADMIN_EMAIL` to the client.
- Don't use `dangerouslySetInnerHTML`, `eval`, `new Function`, or `innerHTML`.
- Don't open external URLs with `window.open()` directly — use `safeWindowOpen`.
- Don't use `process.env.NEXT_PUBLIC_CONVEX_URL` outside the ConvexClientProvider.
- Don't introduce new npm dependencies without justification.
