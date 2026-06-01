# E2E tests (Playwright)

Smoke + critical-path tests covering marketing pages, auth flows, security (rate limit, safe-URL, session cookies), and WCAG 2.2 AA compliance.

## Setup

```bash
npm install
npm run test:e2e:install   # downloads Chromium browser (~150 MB)
npm run test:e2e
```

The `playwright.config.ts` auto-starts `next start` on port 3100.

## Suites

| File | Coverage |
|------|----------|
| `e2e/marketing.spec.ts` | All 11 public pages render, have skip-link, single `<main id="main-content">`, ≥1 `<h1>`, `<html lang="it">`. |
| `e2e/auth.spec.ts` | Sign-in / sign-up forms, admin role not offered publicly, dashboard + admin routes require auth, invalid sign-in rejected. |
| `e2e/security.spec.ts` | `/api/contact` rate-limited at 5 req/min/IP with `429 + Retry-After`, invalid payload 400, X-Frame-Options / frame-ancestors header present, session cookies configured. |
| `e2e/a11y.spec.ts` | WCAG 2.2 AA smoke: single h1, `lang` attr, all interactive elements named, all form inputs labelled, focus-visible outline rendered, all images have alt. |

## CI

```yaml
- run: npm ci
- run: npm run build
- run: npm run test:e2e:install
- run: npm run test:e2e
  env:
    CI: true
```

Retries=2 in CI, webServer reuse disabled.

## Adding tests

- Pick the right file. New auth flow? `e2e/auth.spec.ts`. New public page? `e2e/marketing.spec.ts`. New accessible pattern? `e2e/a11y.spec.ts`.
- Use `getByRole` / `getByLabel` locators, not `text=`.
- Assert the "bad" state explicitly: `expect(...).not.toBeVisible()` rather than absence.
- Each test must be independent (no shared cookies / state). Use `test.describe.serial` only when the flow genuinely requires a single browser context.
