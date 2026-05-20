# IWHome — Bug Hunt: Problemi & Soluzioni

> Data analisi: 2026-03-18
> Modalità: lettura chirurgica di tutti i file workflow + backend
> Principio: avanza senza regressare — fix minimali e mirati

---

## LEGENDA PRIORITÀ

| Simbolo | Significato |
|---------|-------------|
| 🔴 CRITICO | Rompe funzionalità o crea dati corrotti |
| 🟠 SICUREZZA | Vulnerabilità di accesso/autenticazione |
| 🟡 LOGICO | Comportamento scorretto ma non bloccante |
| 🟢 NOTIFICHE | Notifiche mancanti o mal dirette (già corrette) |

---

## 🔴 BUG 1 — Ruolo "worker" non valido in `cantieri.ts`

**File:** `Backend/convex/cantieri.ts` — righe 412 e 458
**Status:** ✅ FIXATO

### Problema
Nelle mutazioni `createTeam` e `addMemberToTeam`, quando un utente con ruolo `"user"` viene aggiunto a un team, il sistema lo promuove a `"worker"`:

```typescript
if (user && user.role === "user") {
    await ctx.db.patch(user._id, { role: "worker" }); // ← "worker" NON ESISTE
}
```

Il ruolo `"worker"` **non esiste** nel sistema RBAC. I ruoli validi sono:
`user` | `client` | `supplier` | `collaborator` | `admin` | `superadmin`

Questo corrompeva silenziosamente il record dell'utente, rendendolo inaccessibile in qualsiasi ramo RBAC (le query `withIndex("by_role")` non trovano mai "worker").

### Soluzione
Cambiato `"worker"` → `"collaborator"` in entrambe le posizioni.

---

## 🟠 BUG 2 — `generateUploadUrl` senza autenticazione in `documents.ts`

**File:** `Backend/convex/documents.ts` — riga 36
**Status:** ✅ FIXATO

### Problema
La mutation `generateUploadUrl` non aveva **nessun controllo di autenticazione**:

```typescript
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl(); // ← nessun auth!
});
```

Chiunque (anche non autenticato) poteva ottenere un URL di upload sullo storage Convex, consentendo upload di file non autorizzati.
Il file `Backend/convex/files.ts` aveva già la versione corretta con auth + rate limit — questo era un duplicato dimenticato.

### Soluzione
Aggiunto `requireAnyAuth` prima della generazione dell'URL.

---

## 🟡 BUG 3 — `documents.getAll` senza verifica ruolo admin

**File:** `Backend/convex/documents.ts` — riga 103
**Status:** ✅ FIXATO

### Problema
Il commento diceva `"In a real app, verify admin role here"` ma la verifica non era mai stata implementata. Qualsiasi utente autenticato (anche un `client`) poteva chiamare `getAll` e ottenere tutti i documenti del sistema.

### Soluzione
Sostituita la logica `identity` con `requireRole(ctx, ["admin", "superadmin"])` — ritorna array vuoto se non admin invece di throwrare, per evitare errori UI.

---

## 🟡 BUG 4 — `payments.getById` senza autenticazione

**File:** `Backend/convex/payments.ts` — riga 69
**Status:** ✅ FIXATO

### Problema
La query non aveva nessun controllo auth: qualsiasi chiamante (anche non autenticato) con un ID pagamento poteva leggere i dettagli completi di un pagamento.

### Soluzione
Aggiunto `getCallerInfo(ctx)` — ritorna `null` se non autenticato.

---

## 🟡 BUG 5 — `syncClerkUsers.manualSync` senza verifica ruolo

**File:** `Backend/convex/syncClerkUsers.ts`
**Status:** ✅ FIXATO

### Problema
`manualSync` era un'action pubblica che chiunque autenticato poteva invocare, scatenando una sincronizzazione completa di tutti gli utenti da Clerk (chiamate API pesanti + update DB).

### Soluzione
Aggiunto `ctx.runQuery(api.users.getByEmail, { email: identity.email! })` per verificare che il chiamante sia `admin` o `superadmin`. Aggiunto import `api` mancante nel file.

---

## 🟡 BUG 6 — Email admin hardcodata in `quotes.createRequest`

**File:** `Backend/convex/quotes.ts` — funzione `createRequest`
**Status:** ✅ FIXATO

### Problema
`createRequest` usava `"info@iwhome.it"` hardcoded per la notifica email admin.

### Soluzione
Query dinamica di tutti gli utenti con `role === "admin"` via `withIndex("by_role")`. Email inviata a ciascuno.

---

## 🟢 NOTIFICHE 1 — `updateProductionPhase` senza notifica admin

**File:** `Backend/convex/suppliers.ts`
**Status:** ✅ FIXATO

### Problema
Quando un fornitore aggiornava la fase di produzione (materiali → taglio → assemblaggio → controllo → pronto), non veniva inviata alcuna notifica all'admin.

### Soluzione
Aggiunto `ctx.scheduler.runAfter(0, internal.notifications.triggerProductionPhaseUpdate, {...})` dopo il patch dell'ordine. Notifica con priorità `urgent` quando la fase è "pronto" (index 4).

---

## 🟢 NOTIFICHE 2 — `updateDelivery` "in_transito" senza notifica admin

**File:** `Backend/convex/suppliers.ts`
**Status:** ✅ FIXATO

### Problema
Quando il fornitore aggiornava lo stato consegna a `in_transito`, non veniva inviata nessuna notifica all'admin. La notifica per `consegnato` era parziale (solo al fornitore).

### Soluzione
Aggiunte notifiche all'admin per entrambi i casi (`in_transito` e `consegnato`) tramite `triggerDeliveryStatusUpdate`.

---

## 🟢 NOTIFICHE 3 — Anticipi consegna mai controllati (cron mancante)

**File:** `Backend/convex/crons.ts`, `Backend/convex/suppliers.ts`
**Status:** ✅ FIXATO

### Problema
Lo schema `supplier_deliveries` aveva i campi `advance_notified_1w`, `advance_notified_48h`, `advance_notified_24h` ma nessun cron li controllava mai. I flag venivano scritti (nei dati) ma mai letti.

### Soluzione
Aggiunto `checkDeliveryAdvanceNotifications` come `internalMutation` in `suppliers.ts` + cron ogni 6 ore in `crons.ts`. Controlla tutte le consegne non ancora consegnate e invia notifiche a 1 settimana, 48h e 24h dall'arrivo.

---

## 🟢 NOTIFICHE 4 — Messaggi interni fornitore mal diretti

**File:** `Backend/convex/internal_messages.ts`
**Status:** ✅ FIXATO

### Problema
Quando un fornitore inviava un messaggio nel canale `supplier`, il sistema notificava `supplier.email` — ovvero il fornitore stesso. L'admin non riceveva nessuna notifica.

### Soluzione
Aggiunta logica direzionale:
- Fornitore scrive → notifica a TUTTI gli admin via `triggerInternalMessageFromSupplier`
- Admin/sistema scrive → notifica al fornitore (con titolo "💬 Nuovo Messaggio da IWHome")

---

## 🟢 NOTIFICHE 5 — Email admin hardcodate in `suppliers.ts`

**File:** `Backend/convex/suppliers.ts`
**Status:** ✅ FIXATO

### Problema
Tre funzioni usavano email admin hardcodate:
- `updateOrder` → `"contact.core829@gmail.com"`
- `createDelivery` → `"info@iwhome.it"`
- `proposePaymentPlan` → `"info@iwhome.it"`

Se l'admin cambia email o vengono aggiunti più admin, le notifiche vanno perse.

### Soluzione
Tutte e tre le funzioni ora queryano dinamicamente tutti gli utenti con `role === "admin"` e inviano la notifica a ciascuno.

---

---

## 🔴 BUG 7 — `cantieri.getById` senza autenticazione

**File:** `Backend/convex/cantieri.ts` — riga 65
**Status:** ✅ FIXATO

### Problema
Qualsiasi utente (anche non autenticato) poteva leggere i dettagli completi di qualsiasi cantiere: clienti, team, preventivi, documenti.

### Soluzione
Aggiunto `getCallerInfo`. Admin vede tutto; client vede solo il proprio cantiere; collaborator vede solo cantieri assegnati; altri ruoli: `null`.

---

## 🔴 BUG 8 — `conversations.listAdminConversations` senza verifica ruolo

**File:** `Backend/convex/conversations.ts` — riga 7
**Status:** ✅ FIXATO

### Problema
Qualsiasi utente autenticato poteva leggere TUTTE le conversazioni admin-client, incluse informazioni sensibili sui clienti.

### Soluzione
Aggiunto `getCallerInfo` con check `role === "admin" || role === "superadmin"`. Return `[]` per non-admin.

---

## 🔴 BUG 9 — `conversations.getMessages` senza controllo partecipante

**File:** `Backend/convex/conversations.ts` — riga 69
**Status:** ✅ FIXATO

### Problema
Qualsiasi utente autenticato poteva leggere i messaggi di qualsiasi conversazione conoscendo l'ID.

### Soluzione
Aggiunto check: il chiamante deve essere partecipante della conversazione (`client_email` o `admin_email`) oppure admin di sistema.

---

## 🔴 BUG 10 — `suppliers.createOrder` con auth troppo permissiva

**File:** `Backend/convex/suppliers.ts` — riga 385
**Status:** ✅ FIXATO

### Problema
`createOrder` usava `requireAnyAuth` invece di `requireRole(["admin"])`. Qualsiasi utente autenticato (anche un fornitore o collaboratore) poteva creare ordini e relativo pagamento automatico nel sistema.

### Soluzione
Cambiato da `requireAnyAuth` a `requireRole(ctx, ["admin"])`.

---

## 🟠 BUG 11 — `clients.linkToCantiere` senza verifica ruolo

**File:** `Backend/convex/clients.ts` — riga 349
**Status:** ✅ FIXATO

### Problema
Qualsiasi utente autenticato poteva collegare qualsiasi cliente a qualsiasi cantiere, corrompendo le relazioni dati.

### Soluzione
Sostituita la verifica manuale dell'identità con `requireRole(ctx, ["admin"])`.

---

## 🟠 BUG 12 — `collaborators.getById` senza autenticazione

**File:** `Backend/convex/collaborators.ts` — riga 29
**Status:** ✅ FIXATO

### Problema
Nessun controllo auth: chiunque poteva leggere il profilo completo di qualsiasi collaboratore (IBAN, dati personali).

### Soluzione
Aggiunto `getCallerInfo`: admin vede tutto, collaboratore vede solo il proprio profilo, altri ruoli: `null`.

---

## 🟡 BUG 13 — Email admin hardcoded in `suppliers.createOrder` e `suppliers.updateRequest`

**File:** `Backend/convex/suppliers.ts` — righe 429, 319
**Status:** ✅ FIXATO

### Problema
`createOrder` usava `"contact.core829@gmail.com"` hardcoded; `updateRequest` usava `"info@iwhome.it"` hardcoded.

### Soluzione
Entrambe le funzioni ora queryano dinamicamente tutti gli admin e inviano la notifica a ciascuno.

---

## 🟡 BUG 14 — Email admin hardcoded in `quotes.respondToQuote`

**File:** `Backend/convex/quotes.ts` — riga 401
**Status:** ✅ FIXATO

### Problema
Quando un cliente accettava/rifiutava un preventivo, la notifica email veniva inviata solo a `"info@iwhome.it"`.

### Soluzione
Query dinamica di tutti gli admin con `withIndex("by_role")`, email inviata a ciascuno.

---

## 🟡 BUG 15 — `quotes.getAll` senza verifica ruolo admin

**File:** `Backend/convex/quotes.ts` — riga 68
**Status:** ✅ FIXATO

### Problema
Qualsiasi utente autenticato poteva chiamare `getAll` e ottenere tutti i preventivi del sistema.

### Soluzione
Aggiunto `try { await checkAdminOrCeo(ctx); } catch { return []; }` — usa la funzione già importata nel file.

---

## 🟡 BUG 16 — `notifications.triggerBlogPost` limita a 50 utenti

**File:** `Backend/convex/notifications.ts` — riga 173
**Status:** ✅ FIXATO

### Problema
`.take(50)` arbitrario: se ci sono più di 50 utenti, la maggior parte non riceve le notifiche del blog.

### Soluzione
Cambiato in `.collect()` per notificare tutti gli utenti.

---

---

# FRONTEND BUG AUDIT

---

## 🔴 FE-BUG 1 — `Contatti.jsx` crash al submit (base44.entities.Contact non esiste)

**File:** `Frontend/.../pages/Contatti.jsx`
**Status:** ✅ FIXATO

### Problema
Il form di contatto chiamava `base44.entities.Contact.create()`. L'entità `Contact` non era nel mock base44Client → crash `TypeError: Cannot read properties of undefined` al submit. Il form rimaneva bloccato in "Invio in corso..." per sempre.

### Soluzione
Migrato a Convex: rimosso import base44, aggiunto `useAction(api.actions.sendEmail)`. Ora invia una vera email a info@iwhome.it con i dati del form. Aggiunto try/catch con messaggio di errore visibile all'utente.

---

## 🔴 FE-BUG 2 — `base44Client.js` mock incompleto (crash su PDFEditor, Recensioni)

**File:** `Frontend/.../api/base44Client.js`
**Status:** ✅ FIXATO

### Problema
Le pagine `PdfEditor.jsx`, `Recensioni.jsx` e altri usavano entità non definite nel mock:
`PDFTemplate`, `QuoteSignature`, `QuoteCounter`, `QuoteAutomation`, `Contact`, `Review`
→ crash `TypeError: Cannot read properties of undefined (reading 'filter'/'create')`

### Soluzione
Aggiunto `noopEntity` helper e registrate tutte le entità mancanti come no-op nel mock. Le pagine non crashano più (anche se i dati restano vuoti — futuro task: migrazione Convex).

---

## 🔴 FE-BUG 3 — `is_public: "false"` stringa invece di booleano

**File:** `Frontend/.../pages/Admin.jsx:145`, `Documents.jsx:106`
**Status:** ✅ FIXATO

### Problema
Il campo `is_public` veniva salvato come stringa `"false"` invece del booleano `false`. In JavaScript la stringa `"false"` è **truthy** → i documenti venivano trattati come pubblici (accessibili a tutti) anche quando non dovevano esserlo.

### Soluzione
`is_public: "false"` → `is_public: false` in entrambi i file.

---

## 🟡 FE-BUG 4 — `qr-access` in PUBLIC_PAGES ma pagina rimossa

**File:** `Frontend/.../App.jsx:27`
**Status:** ✅ FIXATO

### Problema
`'qr-access'` era nell'array `PUBLIC_PAGES` ma la pagina è commentata in `pages.config.js` (`// QRAccess removed for simplification`). L'utente che accede a `/qr-access` finisce su PageNotFound ma senza menu/auth guard — inconsistenza.

### Soluzione
Rimosso `'qr-access'` da `PUBLIC_PAGES`.

---

## ⚠️ FE-BUG 5 — Pagine con base44 da migrare (funzionalità assenti, non crash)

**File:** `PdfEditor.jsx`, `Recensioni.jsx`
**Status:** ⚠️ NOTO — parzialmente mitigato con mock no-op

`PdfEditor.jsx` usa `PDFTemplate`, `QuoteSignature`, `QuoteCounter`, `QuoteAutomation` per gestire template PDF e firme preventivi. Queste entità non hanno un equivalente Convex → la pagina si carica ma non salva/legge nulla. Richiede creazione tabelle Convex + migration.

`Recensioni.jsx` usa `Review.filter()` per leggere recensioni approvate. Non c'è tabella `reviews` in Convex. La pagina mostra 0 recensioni. Richiede creazione tabella + migration.

---

## ⚠️ NOTE — Bug documentati non fixati (impatto alto, richiedono valutazione)

**`syncClerkUsers.ts:72,153` — Clerk issuer URL hardcoded**
`tokenIdentifier` contiene `https://more-dogfish-5.clerk.accounts.dev` hardcoded. Cambiarlo romprebbe tutti i token esistenti degli utenti. Richiede migrazione coordinata con Clerk dashboard. Non fixato per sicurezza.

**Race conditions in `payments.confirmPayment`, `collaborators.approveHours`**
Operazioni multi-step sequenziali senza transazione. Convex garantisce atomicità solo a livello di singola mutation, ma sequenze annidate (patch → get → insert) possono lasciare stato inconsistente in caso di errore intermedio. Da monitorare con error handling.

---

## RIEPILOGO

| # | File | Tipo | Stato |
|---|------|------|-------|
| 1 | `cantieri.ts` — ruolo "worker" invalido | 🔴 CRITICO | ✅ FIXATO |
| 2 | `documents.ts` — upload URL senza auth | 🟠 SICUREZZA | ✅ FIXATO |
| 3 | `documents.ts` — `getAll` senza ruolo admin | 🟡 LOGICO | ✅ FIXATO |
| 4 | `payments.ts` — `getById` senza auth | 🟡 LOGICO | ✅ FIXATO |
| 5 | `syncClerkUsers.ts` — `manualSync` senza ruolo | 🟡 LOGICO | ✅ FIXATO |
| 6 | `quotes.ts` — `createRequest` email hardcoded | 🟡 LOGICO | ✅ FIXATO |
| 7 | `cantieri.ts` — `getById` senza auth | 🔴 CRITICO | ✅ FIXATO |
| 8 | `conversations.ts` — `listAdminConversations` senza ruolo | 🔴 CRITICO | ✅ FIXATO |
| 9 | `conversations.ts` — `getMessages` senza controllo partecipante | 🔴 CRITICO | ✅ FIXATO |
| 10 | `suppliers.ts` — `createOrder` auth troppo permissiva | 🔴 CRITICO | ✅ FIXATO |
| 11 | `clients.ts` — `linkToCantiere` senza ruolo admin | 🟠 SICUREZZA | ✅ FIXATO |
| 12 | `collaborators.ts` — `getById` senza auth | 🟠 SICUREZZA | ✅ FIXATO |
| 13 | `suppliers.ts` — email admin hardcoded in 2 funzioni | 🟡 LOGICO | ✅ FIXATO |
| 14 | `quotes.ts` — `respondToQuote` email hardcoded | 🟡 LOGICO | ✅ FIXATO |
| 15 | `quotes.ts` — `getAll` senza ruolo admin | 🟡 LOGICO | ✅ FIXATO |
| 16 | `notifications.ts` — blog limit 50 utenti | 🟡 LOGICO | ✅ FIXATO |
| N1 | Notifica fase produzione mancante | 🟢 NOTIFICHE | ✅ FIXATO |
| N2 | Notifica consegna in transito mancante | 🟢 NOTIFICHE | ✅ FIXATO |
| N3 | Cron anticipi consegna mancante | 🟢 NOTIFICHE | ✅ FIXATO |
| N4 | Messaggi interni fornitore mal diretti | 🟢 NOTIFICHE | ✅ FIXATO |
| N5 | Email admin hardcodate in suppliers.ts | 🟢 NOTIFICHE | ✅ FIXATO |
| FE-1 | `Contatti.jsx` crash al submit (base44 Contact) | 🔴 CRITICO FE | ✅ FIXATO |
| FE-2 | `base44Client.js` mock entità mancanti (crash PdfEditor/Recensioni) | 🔴 CRITICO FE | ✅ FIXATO |
| FE-3 | `is_public: "false"` stringa vs booleano (Admin + Documents) | 🔴 LOGICO FE | ✅ FIXATO |
| FE-4 | `qr-access` in PUBLIC_PAGES ma pagina rimossa | 🟡 ROUTING FE | ✅ FIXATO |
| FE-5 | PdfEditor + Recensioni senza backend Convex | ⚠️ FUNZIONALE | ⚠️ NOTO |
