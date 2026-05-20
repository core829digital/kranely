**IWHome**

*Final Debugging --- Specifiche per Ruolo*

+-----------------------------------------------------------------------+
| **Ruolo Admin · Ruolo Fornitore · Ruolo Cliente**                     |
|                                                                       |
| *Bug Fix · UX · Pagamenti · Chat · Documenti · Calendario ·           |
| Appuntamenti*                                                         |
+-----------------------------------------------------------------------+

Documento Riservato --- Da consegnare al team di sviluppo

  -----------------------------------------------------------------------
  **① RUOLO ADMIN --- IWHome & Core (Pagine Interne)**

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Questa sezione riguarda esclusivamente l\'interfaccia e le
  funzionalità visibili all\'utente con ruolo Admin/IWHome. Ogni bug
  elencato deve essere corretto prima del rilascio.*

  -----------------------------------------------------------------------

**Pagina /Dashboard --- Bug & Fix**

**🔴 BUG:** Modal \'Revenue Totale\' mostra valore non preciso e
arrotondato in modo errato → **FIX: Rimuovere l\'arrotondamento
automatico --- mostrare il valore esatto dal DB con 2 decimali fissi**

**🔴 BUG:** Modal \'Chat\' porta alla pagina /ClientiChat (pagina da
eliminare) → **FIX: Eliminare la pagina /ClientiChat --- aggiornare il
link del modal \'Chat\' alla pagina /Messages**

**🔴 BUG:** Modal \'Non Letti\' è linkato a /ClientiChat invece che a
/Messages → **FIX: Aggiornare il link di \'Non Letti\' → /Messages.
Rimuovere ogni riferimento a /ClientiChat dal sistema**

-   Modal \'Stato Cantieri\': aggiungere una piccola grafica animata che
    mostri lo stato dei cantieri in tempo reale

```{=html}
<!-- -->
```
-   La grafica deve essere animata (es. progress bar, donut chart,
    indicatore live)

-   Mostrare: cantieri Attivi / In Pausa / Completati / In Ritardo

**Pagina /Fornitori --- Richiesta Manuale Admin**

  -----------------------------------------------------------------------
  *Anche se IWHome riceve automaticamente una richiesta dal cliente e la
  inoltra al fornitore, IWHome deve poter fare una richiesta MANUALE al
  fornitore. Così i clienti non tecnologici non vengono esclusi dal
  sistema, facilitando il lavoro di IWHome.*

  -----------------------------------------------------------------------

-   Aggiungere pulsante \'Nuova Richiesta Manuale\' nella pagina
    /Fornitori

-   Il form di richiesta manuale deve avere gli stessi campi del
    workflow automatico

-   La richiesta manuale entra nel sistema come qualsiasi altra
    richiesta (stesso ciclo circolare)

-   Nessuna distinzione di stato tra richiesta automatica e manuale ---
    stesso tracking

**Pagina /CantierDashboard --- Tab Interni e Dropdown Staff**

-   Il tab di dentro un cantiere deve essere collegato allo staff
    interno di IWHome

-   Tramite un menu dropdown si selezionano multipli membri staff da
    assegnare al cantiere

```{=html}
<!-- -->
```
-   Multi-select dropdown: possibilità di assegnare più persone
    contemporaneamente

-   Ogni membro assegnato riceve notifica push dell\'assegnazione

-   Lo staff vede il cantiere nella propria dashboard personale

**Pagina /Pagamenti --- Impostazioni Sistema e Logica Generale**

-   Accanto al pulsante \'Nuovo Pagamento\' aggiungere un pulsante per
    le Impostazioni del sistema di pagamento

```{=html}
<!-- -->
```
-   Le impostazioni permettono di configurare: percentuali acconto,
    rate, condizioni di saldo

  -----------------------------------------------------------------------
  *LOGICA FONDAMENTALE: Tab \'Fornitori\' e tab \'Collaboratori\' = SPESE
  (IWHome paga). Tab \'Clienti\' = INCASSI (IWHome riceve). Questa
  distinzione deve essere visivamente chiara nell\'interfaccia.*

  -----------------------------------------------------------------------

**Ordine GENERALE dei pagamenti --- questa è la logica di business da
rispettare in tutto il sistema:**

  -------- ---------------------------- -------------------------------------
  **\#**   **AZIONE**                   **DETTAGLIO / TRIGGER**

  **1**    Cliente paga a IWHome        *Si attiva quando il preventivo è
                                        stato accettato dal cliente. Genera
                                        fattura + contratto + PDF automatici
                                        in allegato.*

  **2**    IWHome paga al Fornitore     *Si attiva dopo aver incassato dal
                                        cliente. Importo calcolato
                                        automaticamente. Fornitore riceve
                                        notifica pagamento.*
  -------- ---------------------------- -------------------------------------

**Split dei pagamenti --- configurabile per ogni contratto:**

  ----------------------- ----------------------- -----------------------
  **ACCONTO INIZIALE**    **ACCONTO 1 / RATE**    **SALDO FINALE**

  \% configurabile.       Pagamenti intermedi     Alla consegna
  Sblocca la messa in     configurabili. Sistema  confermata. Genera
  produzione.             calcola automaticamente ricevuta PDF finale.
                          importo residuo.        
  ----------------------- ----------------------- -----------------------

-   Il sistema calcola automaticamente le percentuali e l\'importo
    rimasto da pagare

-   Per ogni pagamento si genera automaticamente: fattura + contratto +
    PDF finale al cliente

-   Il Fornitore deve inviare a IWHome la fattura e il preventivo

-   Quando il cliente accetta il preventivo si invia anche un
    Certificato di Qualità e Conformità

**Pagina /StaffQR --- Generatore QR Collegato all\'ID Staff**

-   Implementare un QR code generator che funzioni per creazione codice
    QR collegato all\'ID del membro staff

-   Il QR è univoco per ogni membro staff --- non riutilizzabile

-   Link valido 24h dalla generazione --- scade automaticamente

-   Log di ogni QR: chi lo ha generato, per chi, quando, se è stato
    usato

**Pagina /Certificati --- Download PDF**

-   Il certificato deve essere scaricabile via PDF

-   Pulsante \'Scarica PDF\' visibile per ogni certificato nella lista

-   Il PDF generato include: dati certificato, logo IWHome, firma
    elettronica se presente

**Pagina /Messages --- Ricerca e Categorie**

-   Il modal di ricerca delle conversazioni deve funzionare con
    categorie separate:

```{=html}
<!-- -->
```
-   Fornitori --- ricerca tra tutte le chat con fornitori

-   Collaboratori --- ricerca tra tutte le chat con collaboratori

-   Clienti B2B --- categoria separata nel dropdown

-   Clienti B2C --- categoria separata nel dropdown

```{=html}
<!-- -->
```
-   Menu dropdown per selezionare la categoria prima di cercare

-   Togliere la verifica dell\'account dalla pagina /Messages (rimuovere
    il passaggio di verifica)

  -----------------------------------------------------------------------
  **② RUOLO FORNITORE --- Pagine e Funzionalità Dedicate**

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Questa sezione descrive tutto ciò che il Fornitore vede e può fare
  nella propria area privata. Ogni funzione deve rispettare il RBAC: il
  fornitore vede solo i propri dati.*

  -----------------------------------------------------------------------

**Pagina /Dashboard Fornitore --- Ordine Tab e Live Mode**

-   La Dashboard del fornitore deve avere come terzo tab le Richieste,
    ovviamente in live mode

-   L\'ordine dei tab deve essere cambiato nel seguente ordine:

```{=html}
<!-- -->
```
-   1\. Richieste (live --- aggiornate in tempo reale)

-   2\. Documenti

-   3\. I miei Appuntamenti

**Pagina /Fornitori --- Tab \'Produzione\': Solo il Fornitore Edita**

  -----------------------------------------------------------------------
  *Nella tab \'Produzione\' solo il fornitore deve editare le fasi della
  produzione. Quando avanza alla fase successiva, mandare un\'email
  automatica a IWHome per avvisarlo.*

  -----------------------------------------------------------------------

-   Solo il Fornitore può modificare lo stato delle fasi di produzione

-   IWHome può solo visualizzare --- NON modificare le fasi

-   Ad ogni avanzamento di fase → trigger automatico: email a IWHome

-   Email contiene: nome ordine, fase precedente → fase attuale,
    data/ora, link diretto all\'ordine

**Tab \'Chat\' Fornitore --- Sistema \@mention per Preventivi/Ordini**

  -----------------------------------------------------------------------
  *Sulla tab \'Chat\': quando il fornitore o IWHome vogliono parlare di
  una richiesta o un ordine prima della produzione, devono scrivere con
  \'@\' e poi il nome del preventivo per potersi riferire a un preventivo
  richiesto o già in stato di ordine per parlarne ed evidenziarlo in
  chat.*

  -----------------------------------------------------------------------

-   Digitando \'@\' in chat appare un elenco di preventivi/ordini attivi
    collegabili

-   Selezionando il preventivo → viene evidenziato in chat come link
    cliccabile

-   Al click sul preventivo in chat → si apre un popup con:

```{=html}
<!-- -->
```
-   Dati completi del cliente

-   Riferimento documentale

-   Documenti e allegati

-   Tutti i dettagli del preventivo (importi, date, condizioni)

```{=html}
<!-- -->
```
-   Il popup è in sola lettura --- non modificabile dalla chat

**Tab \'Calendario\' Fornitore --- Vista fino a 1 Mese**

-   La tab Calendario deve permettere a IWHome e al fornitore di vedere
    più di una settimana di consegne

-   La vista deve arrivare fino a 1 mese completo (non solo 7 giorni)

-   Vista selezionabile: settimanale / bi-settimanale / mensile

-   Filtri per tipo di consegna: edilizia / infissi

**Pagina /Pagamenti Fornitore --- Sottotitolo e Impostazioni**

-   Modificare il sottotitolo della pagina /Pagamenti con una forma solo
    per il fornitore

-   Includere impostazioni di pagamento per il fornitore a percentuali:

```{=html}
<!-- -->
```
-   Acconto iniziale

-   Acconto 1 (intermedio)

-   Saldo finale

-   Qualsiasi altra condizione configurata per IWHome

```{=html}
<!-- -->
```
-   Il fornitore nella sua pagina di pagamenti vede i pagamenti che ha
    incassato da IWHome con il sistema di pagamenti già evidenziato

**Pagina /Appuntamenti --- Funzione Multi-Direzionale**

  -----------------------------------------------------------------------
  *Deve esserci una funzione multi-direzionale: quando il fornitore crea
  un evento, a IWHome deve apparire anche nella sua pagina e avvisarlo
  via notifiche e email.*

  -----------------------------------------------------------------------

-   Evento creato dal Fornitore → appare automaticamente nella Dashboard
    IWHome

-   IWHome riceve: notifica push + email con dettagli evento

-   IWHome può accettare / modificare / rifiutare l\'evento

-   La risposta di IWHome viene notificata al Fornitore

**Pagina /Documenti --- Organizzazione per Cartelle**

  -----------------------------------------------------------------------
  *Deve esserci un pulsante per il Fornitore e per IWHome che permetta a
  entrambi di organizzare i documenti di tutte le categorie per cartelle
  (folder). A IWHome questo pulsante apparirà come \'Vista per Clienti\'
  e al Fornitore apparirà come \'Vista per Richieste\'.*

  -----------------------------------------------------------------------

-   Pulsante \'Vista per Clienti\' (visibile ad Admin IWHome): organizza
    documenti filtrati per cliente

-   Pulsante \'Vista per Richieste\' (visibile al Fornitore): organizza
    documenti filtrati per richiesta/ordine

-   Struttura a cartelle: ogni cartella corrisponde a un cliente o a una
    richiesta

-   Possibilità di caricare, scaricare e rinominare documenti dentro
    ogni cartella

**⭐ Chat Esclusiva per Cliente/Progetto**

  -----------------------------------------------------------------------
  *IWHome deve comunicare con il fornitore su una chat esclusiva per
  cliente o progetto iniziato (che sarà collegata al sistema). Avrà
  esclusività di parlare solo di quel cliente, allegare file, e un
  pulsante per chiamare il fornitore su telefono se necessario. Anche il
  fornitore ha accesso a questa chat.*

  -----------------------------------------------------------------------

**⭐ Chat dedicata per ogni cliente/progetto --- separata dalla chat
generale**

-   Ogni progetto ha la propria chat isolata: solo IWHome e il Fornitore
    di riferimento

-   Funzionalità della chat esclusiva:

```{=html}
<!-- -->
```
-   Invio file (PDF, immagini, documenti di progetto)

-   Pulsante chiamata telefonica al fornitore direttamente dalla chat

-   Riferimento \@mention a preventivi/ordini del progetto

-   Storico completo della conversazione per quel progetto

```{=html}
<!-- -->
```
-   Entrambi (IWHome e Fornitore) hanno accesso alla chat del progetto

**⭐ Tab \'Richieste\' --- Popup con Sistema Completo**

  -----------------------------------------------------------------------
  *Ricordatorio importante: nella pagina /Fornitori nella tab
  \'Richieste\', tanto IWHome come il fornitore devono avere accesso a
  tutto il sistema che ha fornito fino ad ora. Accederanno cliccando
  sulla richiesta e si aprirà un popup dove ci sarà tutto il sistema.*

  -----------------------------------------------------------------------

**⭐ Click su una richiesta → popup completo con TUTTO il sistema
collegato**

-   Il popup deve contenere:

```{=html}
<!-- -->
```
-   Dati cliente completi

-   Dettagli preventivo (importi, condizioni, date)

-   Stato attuale dell\'ordine nel ciclo circolare

-   Documenti e allegati relativi

-   Storico comunicazioni (chat \@mention)

-   Stato pagamenti (acconto ricevuto / da ricevere)

-   Stato produzione (se applicabile)

-   Stato consegna (se applicabile)

```{=html}
<!-- -->
```
-   Il popup è accessibile sia da IWHome che dal Fornitore (con
    visibilità adeguata al ruolo)

  -----------------------------------------------------------------------
  **③ RUOLO CLIENTE --- Pagine e Funzionalità Dedicate**

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Questa sezione descrive tutto ciò che il Cliente vede nella propria
  area privata. L\'interfaccia deve essere semplice, chiara e focalizzata
  sul cliente. Il cliente vede solo i propri dati.*

  -----------------------------------------------------------------------

**Pagina /Pagamenti Cliente --- Sottotitolo Personalizzato**

-   Il sottotitolo della pagina /Pagamenti nella vista cliente deve
    essere modificato con un testo specifico per il cliente

-   Il sottotitolo deve essere diverso da quello Admin e da quello
    Fornitore

-   Linguaggio semplice e orientato al cliente: es. \'I tuoi pagamenti e
    le tue ricevute\'

**Pagina /MyAppointments --- Sincronizzazione con IWHome**

  -----------------------------------------------------------------------
  *Quando il cliente fa un appuntamento dalla pagina /MyAppointments,
  deve apparire a IWHome nella sua pagina di appuntamenti.*

  -----------------------------------------------------------------------

-   Appuntamento creato dal Cliente → appare automaticamente nella
    Dashboard IWHome

-   IWHome riceve notifica push + email con i dettagli
    dell\'appuntamento

-   IWHome può confermare / modificare / rifiutare l\'appuntamento

-   La risposta di IWHome viene notificata al Cliente via push + email

-   Il cliente vede lo stato dell\'appuntamento: In Attesa / Confermato
    / Rifiutato

**Pagina /Messages Cliente --- Chat Esclusiva con IWHome + Poll
Preventivi**

  -----------------------------------------------------------------------
  *Nella pagina /Messages deve apparire al cliente in esclusiva solo la
  chat con IWHome, esattamente come nella tab \'Chat\' della pagina
  /Fornitori. La chat deve essere collegata al sistema di poll per
  accettazione preventivi.*

  -----------------------------------------------------------------------

-   Il cliente vede SOLO la propria chat con IWHome --- nessuna altra
    conversazione visibile

-   L\'interfaccia è identica alla tab \'Chat\' che usa il Fornitore:
    stessa UX, stesso layout

-   La chat è collegata al sistema di poll per accettazione preventivi:

```{=html}
<!-- -->
```
-   Quando IWHome invia un preventivo, appare in chat come messaggio
    speciale

-   Il cliente può accettare o fare controproposta direttamente dalla
    chat

-   La risposta aggiorna automaticamente lo stato nel sistema (workflow
    circolare)

```{=html}
<!-- -->
```
-   Anche il sistema \@mention funziona: il cliente può riferirsi al
    proprio preventivo digitando \'@\'

  -----------------------------------------------------------------------
  **PROMPT --- DA INCOLLARE AL TUO ASSISTENTE AI**

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  *Copia e incolla il seguente blocco direttamente al tuo assistente AI
  di sviluppo. È già strutturato per ruolo e in ordine di priorità.*

  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Sei un senior full-stack developer che lavora su IWHome (gestionale |
| edilizia + serramenti).**                                             |
|                                                                       |
| Procedi in ordine. Per ogni punto: analizza il codice esistente,      |
| identifica il problema, implementa la soluzione, verifica il          |
| collegamento con gli altri moduli.                                    |
|                                                                       |
| **━━ RUOLO ADMIN ━━**                                                 |
|                                                                       |
| • BUG /Dashboard --- Modal \'Revenue Totale\': rimuovere              |
| arrotondamento, mostrare valore esatto con 2 decimali dal DB          |
|                                                                       |
| • BUG /Dashboard --- Modal \'Chat\' e \'Non Letti\': eliminare pagina |
| /ClientiChat, aggiornare entrambi i link a /Messages                  |
|                                                                       |
| • FEATURE /Dashboard --- Modal \'Stato Cantieri\': aggiungere grafica |
| animata (donut chart / progress bar) con stati live cantieri          |
|                                                                       |
| • FEATURE /Fornitori --- Aggiungere pulsante \'Nuova Richiesta        |
| Manuale\' per richieste senza cliente digitale (stesso ciclo del      |
| workflow automatico)                                                  |
|                                                                       |
| • FEATURE /CantierDashboard --- Multi-select dropdown per assegnare   |
| più membri staff interni al cantiere con notifica push                |
|                                                                       |
| • FEATURE /Pagamenti Admin --- Pulsante impostazioni sistema di       |
| pagamento accanto a \'Nuovo Pagamento\'. Tab Fornitori+Collaboratori  |
| = spese, Tab Clienti = incassi.                                       |
|                                                                       |
| • LOGICA /Pagamenti --- Ordine generale: 1) Cliente paga a IWHome, 2) |
| IWHome paga al Fornitore. Ogni pagamento genera automaticamente       |
| fattura + contratto + PDF al cliente.                                 |
|                                                                       |
| • FEATURE /Pagamenti --- Split pagamenti: acconto iniziale / acconto  |
| 1 / saldo. Sistema calcola automaticamente percentuali e importo      |
| residuo. Configurabile per contratto.                                 |
|                                                                       |
| • FEATURE /StaffQR --- QR code generator collegato all\'ID del membro |
| staff. Link valido 24h, log completo di ogni QR generato.             |
|                                                                       |
| • BUG /Certificati --- Aggiungere pulsante \'Scarica PDF\' per ogni   |
| certificato.                                                          |
|                                                                       |
| • FEATURE /Messages --- Modal ricerca con dropdown categorie:         |
| Fornitori / Collaboratori / Clienti B2B / Clienti B2C. Rimuovere      |
| verifica account.                                                     |
|                                                                       |
| **━━ RUOLO FORNITORE ━━**                                             |
|                                                                       |
| • FEATURE /Dashboard Fornitore --- Riordinare tab: 1.Richieste (live) |
| 2.Documenti 3.I miei Appuntamenti                                     |
|                                                                       |
| • FEATURE /Fornitori tab Produzione --- Solo il fornitore edita le    |
| fasi. Ogni avanzamento di fase → trigger automatico email a IWHome    |
| con nome ordine, fasi e link diretto.                                 |
|                                                                       |
| • FEATURE Chat \@mention --- Digitando \'@\' in chat appare lista     |
| preventivi/ordini collegabili. Click sul preventivo → popup con dati  |
| cliente, documenti, dettagli completi del preventivo.                 |
|                                                                       |
| • FEATURE Tab Calendario --- Vista fino a 1 mese (non solo            |
| settimana). Opzioni: settimanale / bi-settimanale / mensile. Filtri   |
| per edilizia/infissi.                                                 |
|                                                                       |
| • FEATURE /Pagamenti Fornitore --- Modificare sottotitolo pagina.     |
| Impostazioni pagamento: acconto, acconto1, saldo. Il fornitore vede i |
| pagamenti incassati da IWHome.                                        |
|                                                                       |
| • FEATURE /Appuntamenti --- Multi-direzionale: evento creato dal      |
| fornitore appare anche su IWHome con notifica push + email. IWHome    |
| risponde, fornitore riceve risposta.                                  |
|                                                                       |
| • FEATURE /Documenti --- Pulsante per organizzare documenti per       |
| cartelle. Ad Admin appare come \'Vista per Clienti\', al Fornitore    |
| come \'Vista per Richieste\'.                                         |
|                                                                       |
| • ⭐ FEATURE Chat Esclusiva per Progetto --- Chat dedicata per ogni   |
| cliente/progetto tra IWHome e Fornitore. Include: file, pulsante      |
| chiamata telefonica, \@mention preventivi. Entrambi hanno accesso.    |
|                                                                       |
| • ⭐ FEATURE Popup Richiesta Completo --- Click su richiesta nella    |
| tab \'Richieste\' → popup con TUTTO il sistema: cliente, preventivo,  |
| stato ordine, documenti, chat, pagamenti, produzione, consegna.       |
|                                                                       |
| • NOTA: Il fornitore nella sua pagina pagamenti vede SOLO i pagamenti |
| incassati da IWHome (non paga lui).                                   |
|                                                                       |
| **━━ RUOLO CLIENTE ━━**                                               |
|                                                                       |
| • FEATURE /Pagamenti Cliente --- Modificare sottotitolo pagina con    |
| testo specifico per il cliente (diverso da Admin e Fornitore).        |
|                                                                       |
| • FEATURE /MyAppointments --- Appuntamento creato dal cliente appare  |
| automaticamente nella Dashboard IWHome con notifica push + email.     |
| IWHome risponde, cliente vede stato: In Attesa / Confermato /         |
| Rifiutato.                                                            |
|                                                                       |
| • FEATURE /Messages Cliente --- Il cliente vede SOLO la propria chat  |
| con IWHome. Interfaccia identica alla tab \'Chat\' Fornitore. Chat    |
| collegata al sistema di poll preventivi: il cliente accetta o fa      |
| controproposta direttamente dalla chat, questo aggiorna               |
| automaticamente lo stato nel workflow.                                |
|                                                                       |
| **REGOLA: Non passare al punto successivo senza aver verificato che   |
| il punto precedente sia funzionante e collegato al sistema circolare. |
| Ogni modifica deve rispettare il RBAC: ogni ruolo vede solo i propri  |
| dati.**                                                               |
+-----------------------------------------------------------------------+

*IWHome --- Final Debugging Document --- Riservato*
