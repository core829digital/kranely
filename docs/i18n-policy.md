# i18n Policy — Kranely

## Current state (as of 2026-06-01)

- **Configured but dormant**: `next-intl` is installed and `src/lib/i18n/config.ts` declares `locales = ["en", "it", "fr", "es", "de"]`, `defaultLocale = "it"`.
- **No routing**: there is no `[locale]` dynamic segment under `src/app/`. `useTranslations`, `useFormatter`, `useLocale` are not imported anywhere in the codebase.
- **Translation files**:
  - `messages/it.json` — full (≈4 KB), Italian source of truth.
  - `messages/en.json` — full (≈4 KB), English translation.
  - `messages/{fr,es,de}.json` — **placeholders only** (≈800 B each, common/navigation strings only).
- **All UI strings are hardcoded Italian** in `src/app/(dashboard)/*.tsx` and `src/app/(public)/*.tsx`.
- **`<html lang="it">`** is set in `src/app/layout.tsx:38`. Correct for the current Italian-first audience.

## Policy

1. **The app is Italian-first.** All new user-facing copy in components must be written in Italian.
2. **No new next-intl routes.** Don't add a `[locale]` segment. The next-intl config is preserved as a future migration path; the cost of routing + translation passes is high and not justified by current user base.
3. **Use Italian (it-IT) conventions**: comma decimal separator, € currency, DD/MM/YYYY dates.
4. **English copy** is acceptable only for:
   - Brand name "Kranely" (never translated).
   - Technical terms used as proper nouns (e.g. "Dashboard", "Settings" buttons are translated, but "Kranely Workspace" or product feature names stay).
   - Marketing copy on `/(public)/*` that is intentionally English (none currently).
5. **Status labels** must match the backend enum values exactly (e.g. payment status `in_attesa` → display "In attesa", not "Pending"). The display → enum mapping is in each page's local `STATUS_LABELS` map.
6. **Avoid mixing languages in the same sentence.** A common bug is "Pagina / Cantieri" — pick one.

## Audited inconsistencies (fixed in earlier phases)

- `src/app/(dashboard)/private-area/page.tsx` — was showing raw enum keys (`in_attesa`, `contract`) before the translation maps were added.
- `src/app/(dashboard)/storage/page.tsx` and `shared-documents/page.tsx` — were using Italian DOC_TYPES ("altro", "documento"); now aligned to the EN enum the schema enforces (`contract`, `quote`, `other`).
- `src/app/(dashboard)/messages/page.tsx` — was rendering raw channel type (`general`); now translates via `channelTypeLabels` map.

## Forward path (if internationalisation is ever needed)

1. Add `src/app/[locale]/(dashboard)/...` and `src/app/[locale]/(public)/...` parallel trees.
2. Move all hardcoded Italian strings to `messages/it.json` under meaningful keys (grouped by feature: `auth.login`, `dashboard.kpis`, `payments.statuses`).
3. Translate `messages/{en,fr,es,de}.json` to parity.
4. Add a `LocaleSwitcher` component in the public nav.
5. Keep `defaultLocale = "it"` and serve `/` as Italian; other locales at `/en/`, `/fr/`, etc.
6. Estimated effort: 1-2 sprints, 1 dedicated engineer.

## Verification

```bash
# Find any remaining hardcoded English labels in dashboard pages
grep -nE ">[A-Z][a-z]+ [A-Z][a-z]+" src/app/\(dashboard\)/*.tsx
# Find status label usage
grep -nE "STATUS_LABELS|statusLabels" src/app/\(dashboard\)/*.tsx
```
