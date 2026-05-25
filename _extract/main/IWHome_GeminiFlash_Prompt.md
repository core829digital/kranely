# IWHome — Implementation Plan & Bug Fix Prompt
## Ottimizzato per modelli AI con contesto limitato

---

## LEGGIMI PRIMA DI TUTTO

Tu sei un developer che lavora su **IWHome**, un gestionale web per un'azienda di edilizia e serramenti.

L'app ha queste aree private separate:
- **Admin (IWHome)** — chi gestisce tutto
- **Fornitore** — chi produce i prodotti
- **Collaboratore** — chi lavora nei cantieri
- **Cliente** — chi compra i prodotti/servizi

**REGOLA PIU IMPORTANTE:**
> Lavora su UN task alla volta. Quando finisci un task, FERMATI e aspetta conferma prima di andare avanti. Non toccare mai altre aree private se non ti viene detto esplicitamente in quel task.

---

## STACK TECNICO (per capire dove mettere le mani)

- **Frontend:** React + JSX
- **Backend/DB:** Convex (mutation, query)
- **Auth:** Clerk
- **Router:** React Router v6
- **UI Components:** Radix UI
- **Pagamenti:** sistema interno con prove di pagamento

---

## LISTA TASK — DA FARE IN ORDINE, UNO ALLA VOLTA

---

### TASK 1
**Area:** Admin (IWHome)
**Pagina:** `/Dashboard`
**Problema:** Il modal "Revenue Totale" mostra "0" invece del valore reale.

**Cosa fare:**
1. Trova il componente del modal "Revenue Totale" nella Dashboard Admin
2. Guarda come funziona il componente "Revenue Overview" che si trova più in basso nella stessa pagina — quello funziona già e mostra i dati corretti (esempio: 3450 euro)
3. Il "Revenue Overview" usa il data fetching corretto. Copia la stessa logica di data fetching e applicala al modal "Revenue Totale"
4. Il modal deve mostrare la stessa somma totale che vedi nel "Revenue Overview"
5. Non toccare nient'altro nella pagina

**Verifica:** Dopo il fix, il modal "Revenue Totale" deve mostrare la stessa cifra del "Revenue Overview" — non "0".

---

### TASK 2
**Area:** Admin (IWHome)
**Pagina:** `/Fornitori` — Tab "Ordini"
**Problema:** Lo stato dell'ordine è bloccato su "Valutazione" anche se l'ordine è già in produzione.

**Cosa fare:**
1. Trova il componente che mostra la fase/stato dell'ordine nella tab "Ordini"
2. Questo componente deve leggere lo stato attuale dal database in tempo reale (live)
3. Il sistema di pagamenti ha già triggerato il passaggio dell'ordine alla fase "Produzione"
4. Il componente deve semplicemente mostrare la fase corrente che è salvata nel DB — non deve mai essere hardcoded o statico
5. Assicurati che il componente faccia un query live al DB per leggere la fase corrente dell'ordine
6. Non toccare la logica di avanzamento fase — solo la visualizzazione

**Verifica:** Lo stato mostrato nella tab "Ordini" deve rispecchiare la fase reale dell'ordine nel DB.

---

### TASK 3
**Area:** Admin (IWHome)
**Pagina:** `/Fornitori` — Tab "Produzione"
**Problema:** Esiste una fase chiamata "Verniciatura" che deve essere eliminata.

**Cosa fare:**
1. Trova dove sono definite le fasi di produzione nel codice (probabilmente un array o enum)
2. Rimuovi la fase "Verniciatura" da quella lista
3. Controlla che i numeri degli step siano ancora consecutivi dopo la rimozione
4. Controlla che nessun altro componente referenzi "Verniciatura" — se lo fa, aggiorna anche quello
5. Non cambiare le altre fasi

**Verifica:** La fase "Verniciatura" non deve più apparire nella tab "Produzione".

---

### TASK 4
**Area:** Fornitore
**Pagina:** `/Fornitori` — Tab "Produzione"
**Problema:** Il pulsante "Avanza Fase" non funziona.

**Errore nel DB (Convex):**
```
ArgumentValidationError: Object is missing the required field `target_step`
Object inviato: { new_step: 5.0, order_id: "..." }
Validator richiede: { order_id, quote_pdf_url (optional), target_step }
```

**Cosa fare:**
1. Apri il file `Fornitori.jsx` alla riga circa 1114
2. Trova la funzione `onClick` del pulsante "Avanza Fase"
3. Vedi che il codice manda `new_step` al backend, ma il backend si aspetta `target_step`
4. Cambia il nome del campo da `new_step` a `target_step` nella chiamata alla mutation Convex `suppliers:advanceWorkflow`
5. La chiamata corretta deve essere:
```javascript
// PRIMA (sbagliato):
{ new_step: 5.0, order_id: "..." }

// DOPO (corretto):
{ target_step: 5.0, order_id: "..." }
```
6. Salva e verifica che non ci siano altri posti nel file che usano `new_step` per questa mutation

**Verifica:** Il fornitore clicca "Avanza Fase" e non appare più l'errore. La fase avanza correttamente.

---

### TASK 5
**Area:** Admin (IWHome)
**Pagina:** `/Preventivi`
**Problema A:** Il modal di un preventivo esce fuori dal suo contenitore (overflow/layout rotto).
**Problema B:** Il pulsante "Visualizza Allegato 1" ha testo bianco su sfondo bianco — non si vede.

**Cosa fare per il Problema A (layout):**
1. Trova il componente del modal nella pagina `/Preventivi`
2. Aggiungi al contenitore del modal:
```css
overflow: hidden;
/* oppure */
overflow-y: auto;
max-height: 90vh;
```
3. Se il modal usa un Dialog di Radix UI, assicurati che il `DialogContent` abbia un `max-height` e `overflow-y: auto`

**Cosa fare per il Problema B (contrasto pulsante):**
1. Trova il pulsante "Visualizza Allegato 1" nel componente del modal preventivo
2. Il problema è che ha testo chiaro su sfondo chiaro
3. Applica uno stile che garantisca contrasto, per esempio:
```css
background-color: #1A3C5E; /* blu scuro */
color: #FFFFFF; /* testo bianco */
border: 1px solid #1A3C5E;
```
4. Oppure se usa classi Tailwind:
```
className="bg-blue-800 text-white hover:bg-blue-900"
```

**Verifica:** Il modal rimane dentro il suo contenitore. Il pulsante "Visualizza Allegato 1" è leggibile con testo scuro su sfondo chiaro o viceversa.

---

### TASK 6
**Area:** Admin (IWHome) + Fornitore
**Pagina:** `/Pagamenti` (entrambe le aree)
**Problema:** IWHome può cliccare "Pagato" senza caricare una prova. Il fornitore non vede la prova di pagamento.

**Cosa fare — Lato Admin IWHome:**
1. Trova il pulsante "Pagato" nella pagina `/Pagamenti` dell'Admin
2. Aggiungi una validazione PRIMA che il pagamento venga marcato come fatto:
   - Mostra un modal/dialog che chiede di caricare un file (prova di pagamento)
   - Il campo upload file è OBBLIGATORIO — senza file il pulsante "Conferma" nel modal è disabilitato
   - Quando il file viene caricato e confermato, salva nel DB: `{ payment_id, proof_file_url, status: "pending_supplier_review" }`
3. Il pulsante "Pagato" originale NON deve completare il pagamento direttamente — deve aprire questo modal di upload

**Cosa fare — Lato Fornitore:**
1. Nella pagina `/Pagamenti` del Fornitore, trova dove vengono mostrati i pagamenti ricevuti da IWHome
2. Per ogni pagamento con `status: "pending_supplier_review"`, mostra:
   - L'importo del pagamento
   - Un link/bottone per vedere la prova di pagamento allegata da IWHome
   - Un pulsante "Conferma Pagamento Ricevuto"
   - Un pulsante "Segnala Problema"
3. Quando il fornitore clicca "Conferma Pagamento Ricevuto":
   - Lo stato del pagamento diventa `"confirmed"`
   - Si triggera automaticamente l'avvio della produzione per quell'ordine

**Verifica:**
- Admin non può segnare pagato senza allegare file
- Fornitore vede la prova di pagamento
- Fornitore può confermare e questo sblocca la produzione

---

### TASK 7
**Area:** Cliente + Admin (IWHome)
**Pagina:** `/Pagamenti` (entrambe le aree)
**Problema:** Quando il cliente accetta un preventivo, non appare nessun pagamento da fare.

**Cosa fare — Step 1: Trigger pagamento cliente**
1. Trova la funzione che viene chiamata quando il cliente clicca "Accetta Preventivo"
2. Dopo l'accettazione, quella funzione deve creare automaticamente un record di pagamento nel DB per il cliente con:
```javascript
{
  type: "cliente_payment",
  client_id: ...,
  order_id: ...,
  amount: ..., // importo dal sistema di pagamenti configurato da IWHome
  status: "pending",
  payment_plan: ... // piano di pagamento configurato da IWHome (acconto, rate, saldo)
}
```

**Cosa fare — Step 2: Trigger pagamento fornitore**
1. Nello stesso momento in cui si crea il pagamento cliente, crea anche un record di pagamento per il fornitore:
```javascript
{
  type: "supplier_payment",
  supplier_id: ...,
  order_id: ...,
  amount: ..., // importo dovuto al fornitore
  status: "waiting_client_payment" // in attesa che prima paghi il cliente
}
```

**Cosa fare — Step 3: Prova di pagamento obbligatoria (per tutti)**
Questo sistema vale per TUTTI i pagamenti (cliente→IWHome, IWHome→fornitore):
1. Chi paga deve allegare una prova di pagamento (file upload obbligatorio)
2. Chi riceve deve verificare la prova e confermare
3. Se l'importo nella prova è PARZIALE (meno di quello dovuto):
   - Mostra un modal di verifica con:
     - Importo atteso: `X euro`
     - Importo rilevato nella prova: campo numerico editabile
     - Importo mancante: calcolato automaticamente `(atteso - ricevuto)`
     - Messaggio: "Mancano ancora X euro per procedere"
   - Il sistema NON sblocca la produzione finché non è stato pagato tutto l'importo richiesto

**Verifica:**
- Dopo che il cliente accetta il preventivo, nella sua `/Pagamenti` appare un pagamento da fare
- Nella `/Pagamenti` dell'Admin appare sia il pagamento in entrata dal cliente che quello in uscita verso il fornitore
- Nessun pagamento si completa senza prova allegata
- Il modal di verifica pagamento parziale funziona e calcola correttamente il mancante

---

### TASK 8
**Area:** Cliente, Fornitore, Collaboratore + Admin (IWHome)
**Pagina:** `/MyAppointments` (tutte le aree)
**Problema:** Gli appuntamenti creati da clienti/fornitori/collaboratori non appaiono nella vista Admin.

**Cosa fare:**
1. Ogni volta che un utente (cliente, fornitore, collaboratore) crea un appuntamento nella sua `/MyAppointments`, il record nel DB deve includere:
```javascript
{
  created_by_role: "cliente" | "fornitore" | "collaboratore",
  created_by_id: ...,
  visible_to_admin: true, // sempre true
  ...altri campi appuntamento
}
```
2. Nella pagina appuntamenti dell'Admin, nella tab "Tutti Gli Appuntamenti", fai una query che recupera TUTTI gli appuntamenti dove `visible_to_admin: true`
3. Ogni appuntamento nella vista Admin deve mostrare chi l'ha creato (nome utente + ruolo)
4. Il sistema è bidirezionale: se l'Admin modifica/cancella un appuntamento, l'utente che l'ha creato deve ricevere una notifica

**Verifica:** Crea un appuntamento come cliente. Vai nella Dashboard Admin — l'appuntamento deve apparire nella tab "Tutti Gli Appuntamenti".

---

### TASK 9
**Area:** Admin (IWHome)
**Pagina:** `/Clienti`
**Problema:** Questa pagina deve servire per gestire manualmente i clienti non tecnologici.

**Cosa fare:**
1. Questa pagina non richiede modifiche strutturali — è già pensata per creare clienti manualmente
2. Verifica che il form di creazione cliente manuale funzioni correttamente
3. Verifica che IWHome possa fare richieste di preventivo manualmente per questi clienti andando nella pagina `/Fornitori`
4. Aggiungi un tag/badge visibile sui clienti creati manualmente: "Cliente Manuale" o "Creato da Admin"
5. Questi clienti NON hanno accesso alla piattaforma — non vengono invitati via email a meno che l'Admin non lo faccia esplicitamente

**Verifica:** L'Admin crea un cliente manuale. Il cliente appare nella lista con il badge "Cliente Manuale". L'Admin può fare un preventivo per questo cliente dalla pagina `/Fornitori`.

---

### TASK 10
**Area:** Admin (IWHome)
**Pagina:** `/Collaboratori`
**Problema:** Nel modal del collaboratore non appare il suo codice ID.

**Cosa fare:**
1. Trova il componente modal che mostra i dettagli di un collaboratore
2. Aggiungi un campo che mostra il codice ID del collaboratore, per esempio:
```jsx
<div>
  <label>Codice ID Collaboratore</label>
  <span>{collaboratore.id}</span>
  {/* oppure se c'è un codice univoco separato: */}
  <span>{collaboratore.codice || collaboratore._id}</span>
</div>
```
3. Posiziona questo campo in cima al modal, ben visibile
4. Aggiungi un pulsante "Copia" accanto al codice per copiarlo negli appunti

**Verifica:** Apri il modal di un collaboratore — il codice ID è visibile in cima.

---

### TASK 11
**Area:** Admin (IWHome)
**Pagina:** `/Certificati`
**Problema:** Il pulsante "Scarica PDF" porta a una pagina non esistente. Non si può visualizzare il certificato.

**Cosa fare:**
1. Trova il pulsante "Scarica PDF" nel componente certificati
2. Controlla l'URL che genera — probabilmente punta a una route non esistente
3. Sostituisci il comportamento del pulsante con uno di questi approcci:
   **Opzione A — Apri PDF nel browser:**
   ```javascript
   window.open(certificato.file_url, '_blank');
   ```
   **Opzione B — Scarica direttamente:**
   ```javascript
   const link = document.createElement('a');
   link.href = certificato.file_url;
   link.download = `certificato_${certificato.id}.pdf`;
   link.click();
   ```
4. Se la pagina usa un PDF reader globale già esistente nell'app, usa quello invece di creare uno nuovo — cerca nel codice se esiste un componente `PDFViewer` o `PDFReader`
5. Assicurati che il link al file nel DB (`file_url`) sia valido e non sia null

**Verifica:** Clicca "Scarica PDF" su un certificato — il PDF si apre o si scarica correttamente.

---

### TASK 12
**Area:** Admin (IWHome)
**Pagina:** `/Admin` (pannello di amministrazione)
**Problema:** I ruoli nel dropdown non corrispondono ai ruoli reali dell'app.

**Cosa fare:**
1. Trova il componente del pannello Admin dove si può cambiare il ruolo di un utente
2. Trova l'array/lista dei ruoli disponibili nel dropdown
3. Sostituisci i ruoli esistenti con questi:

**Ruoli normali (assegnabili a qualsiasi utente):**
```javascript
const ruoli = [
  { value: "utente_base", label: "Utente Base" },
  { value: "cliente", label: "Cliente" },
  { value: "fornitore", label: "Fornitore" },
  { value: "collaboratore", label: "Collaboratore" },
];
```

**Ruoli speciali (sezione separata):**
```javascript
const ruoliSpeciali = [
  { value: "admin", label: "Admin" },
];
```

4. Rimuovi completamente i ruoli: `CEO`, `Azienda` e qualsiasi altro placeholder non reale
5. I due ruoli speciali devono apparire in una sezione separata nel dropdown, con un divisore visivo e la label "Ruoli Speciali"

**Verifica:** Apri il pannello Admin, clicca sul dropdown ruoli di un utente — vedi solo i ruoli elencati sopra. CEO e Azienda non esistono più.

---

### TASK 13
**Area:** TUTTE LE AREE PRIVATE (Admin, Fornitore, Collaboratore, Cliente)
**Pagina:** `/Messages`
**Problema A:** Le chat mostrano email o nomi sbagliati invece del username corretto.
**Problema B:** I tab della chat sono outdated e non corrispondono ai ruoli reali.
**Problema C:** Utenti non-admin vedono tab che non dovrebbero vedere.

---

**Cosa fare per il Problema A — Nomi chat corretti:**

La logica deve essere:
- Se **il cliente** apre una chat con l'Admin → il cliente vede il nome **"IWHome"**
- Se **l'Admin** apre quella stessa chat → l'Admin vede il nome **del cliente** (es. "Mario Rossi")
- Vale per tutti i ruoli: ogni utente vede il nome dell'altro, mai il proprio

Implementazione:
1. Trova la funzione che determina il nome da mostrare in una chat
2. Sostituiscila con questa logica:
```javascript
function getNomeChatPerUtente(chat, currentUserId, currentUserRole) {
  // L'utente corrente vede sempre il nome dell'ALTRO partecipante
  const altroPartecipante = chat.partecipanti.find(p => p.id !== currentUserId);
  
  // Se l'altro è Admin, mostra "IWHome"
  if (altroPartecipante.ruolo === "admin") {
    return "IWHome";
  }
  
  // Altrimenti mostra il nome utente (username, NON email)
  return altroPartecipante.username || altroPartecipante.nome_completo;
}
```
3. NON usare mai l'email come nome visualizzato
4. Usa sempre `username` o `nome_completo` dal profilo utente

---

**Cosa fare per il Problema B — Tab aggiornati:**

Trova i tab nel modal dei messaggi e aggiornali.

**Vista Admin (vede tutti i tab):**
```
Tab: Tutti | Utenti Base | Clienti | Fornitori | Collaboratori | Admin
```

**Vista Fornitore/Collaboratore/Cliente (vede solo questo):**
```
Nessun tab — solo un pulsante: "Scrivi a IWHome"
```

Implementazione:
```jsx
{currentUserRole === "admin" ? (
  <Tabs>
    <Tab value="tutti">Tutti</Tab>
    <Tab value="utenti_base">Utenti Base</Tab>
    <Tab value="clienti">Clienti</Tab>
    <Tab value="fornitori">Fornitori</Tab>
    <Tab value="collaboratori">Collaboratori</Tab>
  </Tabs>
) : (
  <Button onClick={() => apriChatConAdmin()}>
    Scrivi a IWHome
  </Button>
)}
```

---

**Cosa fare per il Problema C — Isolamento dati:**

Questo è il più importante per la privacy:

1. Ogni query che recupera messaggi/chat deve filtrare per `user_id` dell'utente corrente
2. Un cliente NON deve MAI poter vedere i messaggi di un altro cliente
3. Un fornitore NON deve MAI poter vedere i messaggi di un altro fornitore
4. Lato backend (Convex), ogni query deve avere questa protezione:
```javascript
// In ogni query Convex per i messaggi:
.filter(q => 
  q.or(
    q.eq(q.field("sender_id"), currentUserId),
    q.eq(q.field("receiver_id"), currentUserId)
  )
)
```
5. Controlla che non ci siano query che recuperano "tutti i messaggi" senza filtro utente
6. Rimuovi i tab obsoleti: "Azienda", "Operai" — non esistono come ruoli

**Verifica Task 13:**
- Apri una chat come cliente — vedi "IWHome" come nome, non l'email dell'admin
- Apri la stessa chat come Admin — vedi il nome del cliente
- Come cliente, nella pagina Messages vedi solo il pulsante "Scrivi a IWHome"
- Come Admin vedi tutti i tab con i ruoli corretti
- Un cliente non può vedere i messaggi di un altro cliente

---

### TASK 14 — REGOLA DI LAVORO
**Questo non è un task tecnico — è una regola di comportamento.**

Dopo aver completato ogni task:
1. Scrivi esattamente cosa hai fatto
2. Dimmi dove ho trovato il problema nel codice (file e riga se possibile)
3. Dimmi cosa ho cambiato
4. Poi scrivi: **"✅ Task [numero] completato. Verifica e dimmi se posso procedere."**
5. Aspetta la mia conferma prima di andare al task successivo
6. Se un task richiede modifiche in più file, elencali tutti prima di iniziare

---

## RIEPILOGO TASK PER AREA PRIVATA

| Task | Area Privata | Pagina | Tipo |
|------|-------------|--------|------|
| 1 | Admin | /Dashboard | Bug: data fetching |
| 2 | Admin | /Fornitori — Ordini | Bug: stato live |
| 3 | Admin | /Fornitori — Produzione | Rimozione fase |
| 4 | Fornitore | /Fornitori — Produzione | Bug: mutation Convex |
| 5 | Admin | /Preventivi | Bug: UI/layout + contrasto |
| 6 | Admin + Fornitore | /Pagamenti | Feature: prova pagamento |
| 7 | Cliente + Admin | /Pagamenti | Bug: trigger pagamento |
| 8 | Tutti | /MyAppointments | Feature: bidirezionale |
| 9 | Admin | /Clienti | Verifica + badge manuale |
| 10 | Admin | /Collaboratori | Feature: mostra ID |
| 11 | Admin | /Certificati | Bug: PDF download |
| 12 | Admin | /Admin | Fix: ruoli dropdown |
| 13 | Tutti | /Messages | Bug: nomi + tab + privacy |

---

## REGOLE GENERALI PER TUTTO IL LAVORO

1. **Isola sempre il lavoro per area privata.** Se un task dice "Admin", non toccare il codice del Fornitore.
2. **Non riscrivere componenti interi.** Modifica solo quello che è necessario.
3. **Ogni cambio di stato nel DB deve avere un trigger.** Se cambi uno stato, qualcuno deve ricevere una notifica.
4. **Non usare mai dati hardcoded.** Prezzi, percentuali, nomi — tutto viene dal DB.
5. **Il RBAC non si bypassa mai.** Ogni endpoint Convex deve verificare chi sta facendo la richiesta.
6. **Aspetta conferma dopo ogni task.** Non andare avanti da solo.

---

*IWHome — Implementation Prompt per Gemini Flash — Documento Operativo*
