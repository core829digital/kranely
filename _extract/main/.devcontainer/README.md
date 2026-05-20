# GitHub Codespaces — iwhome.app

## Come aprire su un nuovo PC senza installare nulla

1. Vai su https://github.com/Core829-Digital/iwhome.app-main
2. Clicca il pulsante verde **Code** → scheda **Codespaces** → **New codespace**
3. Aspetta ~2 minuti che il container si avvii e installi le dipendenze automaticamente
4. Il browser si aprirà su VS Code nel browser — il progetto è pronto

## Avviare il dev server

Nel terminale integrato di Codespaces:

```bash
cd Frontend/iwhome.app-base44sdk
npm run dev
```

Il Vite dev server si avvia sulla porta 5173 — Codespaces la espone automaticamente.

## Variabili d'ambiente

Prima di avviare il dev server, crea il file `.env.local` in `Frontend/iwhome.app-base44sdk/`:

```
VITE_CONVEX_URL=https://dependable-lapwing-359.eu-west-1.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_SENTRY_DSN=https://...@o4511062657138688.ingest.de.sentry.io/...
VITE_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

> **Nota**: le chiavi Clerk di produzione funzionano solo su `iwhome.app`. Su Codespaces usa le chiavi di sviluppo (pk_test_...) create dal pannello Clerk.
