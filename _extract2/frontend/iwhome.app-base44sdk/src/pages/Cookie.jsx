import React from 'react';
import { motion } from 'framer-motion';

export default function Cookie() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-16 bg-[#212529]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-light text-white mb-4">Cookie Policy</h1>
            <p className="text-white/60">Ultimo aggiornamento: 23/07/25</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none text-[#212529]/80">

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">Cookie</h2>
            <p>
              Questo documento contiene informazioni in merito alle tecnologie che consentono a questa
              Applicazione di raggiungere gli scopi descritti di seguito. Tali tecnologie permettono al
              Titolare di raccogliere e salvare informazioni (per esempio tramite l'utilizzo di Cookie)
              o di utilizzare risorse (per esempio eseguendo uno script) sul dispositivo dell'Utente quando
              quest'ultimo interagisce con questa Applicazione.
            </p>
            <p>
              Per semplicità, in questo documento tali tecnologie sono sinteticamente definite
              "Strumenti di Tracciamento", salvo vi sia ragione di differenziare.
              Per esempio, sebbene i Cookie possano essere usati in browser sia web sia mobili,
              sarebbe fuori luogo parlare di Cookie nel contesto di applicazioni per dispositivi mobili,
              dal momento che si tratta di Strumenti di Tracciamento che richiedono la presenza di un browser.
              Per questo motivo, all'interno di questo documento il termine Cookie è utilizzato solo per
              indicare in modo specifico quel particolare tipo di Strumento di Tracciamento.
            </p>
            <p>
              Alcune delle finalità per le quali vengono impiegati Strumenti di Tracciamento potrebbero,
              inoltre richiedere il consenso dell'Utente. Se viene prestato il consenso, esso può essere
              revocato liberamente in qualsiasi momento seguendo le istruzioni contenute in questo documento.
            </p>
            <p>
              Questa Applicazione utilizza Strumenti di Tracciamento gestiti direttamente dal Titolare
              (comunemente detti Strumenti di Tracciamento "di prima parte") e Strumenti di Tracciamento
              che abilitano servizi forniti da terzi (comunemente detti Strumenti di Tracciamento "di terza parte").
              Se non diversamente specificato all'interno di questo documento, tali terzi hanno accesso ai
              rispettivi Strumenti di Tracciamento.
            </p>
            <p>
              Durata e scadenza dei Cookie e degli altri Strumenti di Tracciamento simili possono variare
              a seconda di quanto impostato dal Titolare o da ciascun fornitore terzo. Alcuni di essi scadono
              al termine della sessione di navigazione dell'Utente.
            </p>
            <p>
              In aggiunta a quanto specificato nella descrizione di ciascuna delle categorie di seguito riportate,
              gli Utenti possono ottenere informazioni più dettagliate ed aggiornate sulla durata, così come qualsiasi
              altra informazione rilevante – quale la presenza di altri Strumenti di Tracciamento – nelle privacy policy
              dei rispettivi fornitori terzi (tramite i link messi a disposizione) o contattando il Titolare.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Attività strettamente necessarie a garantire il funzionamento di questa Applicazione e la fornitura del Servizio
            </h2>
            <p>
              Questa Applicazione utilizza Cookie comunemente detti "tecnici" o altri Strumenti di Tracciamento
              analoghi per svolgere attività strettamente necessarie a garantire il funzionamento o la fornitura del Servizio.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Altre attività che prevedono l'utilizzo di Strumenti di Tracciamento
            </h2>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Esperienza</h3>
            <p>
              Questa Applicazione utilizza Strumenti di Tracciamento per migliorare la qualità della user experience
              e consentire le interazioni con contenuti, network e piattaforme esterni.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Interazione con social network e piattaforme esterne</h3>
            <p>
              Questo tipo di servizi permette di effettuare interazioni con i social network, o con altre piattaforme
              esterne, direttamente dalle pagine di questa Applicazione.
              Le interazioni e le informazioni acquisite da questa Applicazione sono in ogni caso soggette alle
              impostazioni privacy dell'Utente relative ad ogni social network.
              Questo tipo di servizio potrebbe comunque raccogliere dati sul traffico per le pagine dove il servizio
              è installato, anche quando gli Utenti non lo utilizzano.
              Si raccomanda di disconnettersi dai rispettivi servizi per assicurarsi che i dati elaborati su questa
              Applicazione non vengano ricollegati al profilo dell'Utente.
            </p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">Pulsante Mi Piace e widget sociali di Facebook (Meta Platforms, Inc.)</h4>
            <p>
              Il pulsante "Mi Piace" e i widget sociali di Facebook sono servizi di interazione con il social network
              Facebook, forniti da Meta Platforms, Inc.<br />
              Dati Personali trattati: Dati di utilizzo e Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy.</p>
            <p className="text-sm">Durata di archiviazione:</p>
            <ul className="list-disc pl-6 text-sm">
              <li>_fbp: 3 mesi</li>
            </ul>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">Pulsante e widget sociali di Linkedin (LinkedIn Corporation)</h4>
            <p>
              Il pulsante e i widget sociali di LinkedIn sono servizi di interazione con il social network Linkedin,
              forniti da LinkedIn Corporation.<br />
              Dati Personali trattati: Dati di utilizzo e Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy.</p>
            <p className="text-sm">Durata di archiviazione:</p>
            <ul className="list-disc pl-6 text-sm">
              <li>AnalyticsSyncHistory: 1 mese</li>
              <li>JSESSIONID: durata della sessione</li>
              <li>UserMatchHistory: 1 mese</li>
              <li>bcookie: 1 anno</li>
              <li>bscookie: 1 anno</li>
              <li>lang: durata della sessione</li>
              <li>lidc: 1 giorno</li>
              <li>lissc: 1 anno</li>
              <li>lms_ads: 1 mese</li>
              <li>lms_analytics: 1 mese</li>
            </ul>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Visualizzazione di contenuti da piattaforme esterne</h3>
            <p>
              Questo tipo di servizi permette di visualizzare contenuti ospitati su piattaforme esterne direttamente
              dalle pagine di questa Applicazione e di interagire con essi.
              Questo tipo di servizio potrebbe comunque raccogliere dati sul traffico web relativo alle pagine dove
              il servizio è installato, anche quando gli utenti non lo utilizzano.
            </p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">Google Fonts (Google LLC)</h4>
            <p>
              Google Fonts è un servizio di visualizzazione di stili di carattere gestito da Google LLC che permette
              a questa Applicazione di integrare tali contenuti all'interno delle proprie pagine.<br />
              Dati Personali trattati: Dati di utilizzo e Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy.</p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">Widget Google Maps (Google LLC)</h4>
            <p>
              Google Maps è un servizio di visualizzazione di mappe gestito da Google LLC che permette a questa
              Applicazione di integrare tali contenuti all'interno delle proprie pagine.<br />
              Dati Personali trattati: Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy.</p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Misurazione</h3>
            <p>
              Questa Applicazione utilizza Strumenti di Tracciamento per misurare il traffico e analizzare il
              comportamento degli Utenti per migliorare il Servizio.
            </p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">Statistica</h4>
            <p>
              I servizi contenuti nella presente sezione permettono al Titolare del Trattamento di monitorare e
              analizzare i dati di traffico e servono a tener traccia del comportamento dell'Utente.
            </p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">Google Analytics (Google LLC)</h4>
            <p>
              Google Analytics è un servizio di analisi web fornito da Google LLC ("Google"). Google utilizza i
              Dati Personali raccolti allo scopo di tracciare ed esaminare l'utilizzo di questa Applicazione,
              compilare report e condividerli con gli altri servizi sviluppati da Google.
              Google potrebbe utilizzare i Dati Personali per contestualizzare e personalizzare gli annunci del
              proprio network pubblicitario.<br />
              Dati Personali trattati: Dati di utilizzo e Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy – Opt Out.</p>
            <p className="text-sm">Durata di archiviazione:</p>
            <ul className="list-disc pl-6 text-sm">
              <li>AMP_TOKEN: 1 ora</li>
              <li>_ga: 2 anni</li>
              <li>_gac*: 3 mesi</li>
              <li>_gat: 1 minuto</li>
              <li>_gid: 1 giorno</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Come gestire le preferenze e prestare o revocare il consenso
            </h2>
            <p>
              Esistono vari modi per gestire le preferenze relative agli Strumenti di Tracciamento e per prestare
              o revocare il consenso, ove necessario:
            </p>
            <p>
              Gli Utenti possono gestire le preferenze relative agli Strumenti di Tracciamento direttamente tramite
              le impostazioni dei propri dispositivi – per esempio, possono impedire l'uso o l'archiviazione di
              Strumenti di Tracciamento.
            </p>
            <p>
              In aggiunta, ogni qualvolta l'utilizzo di Strumenti di Tracciamento dipenda da consenso, l'Utente può
              prestare o revocare tale consenso impostando le proprie preferenze all'interno dell'informativa sui
              cookie o aggiornando tali preferenze tramite il widget privacy per le preferenze relative al consenso,
              se presente.
            </p>
            <p>
              Grazie ad apposite funzioni del browser o del dispositivo è anche possibile rimuovere Strumenti di
              Tracciamento precedentemente salvati, inclusi quelli utilizzati per il salvataggio delle preferenze
              relative al consenso inizialmente espresse dall'Utente.
            </p>
            <p>
              Altri Strumenti di Tracciamento presenti nella memoria locale del browser possono essere rimossi
              cancellando la cronologia di navigazione.
            </p>
            <p>
              Per quanto riguarda Strumenti di Tracciamento di terza parte, gli Utenti possono gestire le proprie
              preferenze visitando il relativo link di opt out (qualora disponibile), utilizzando gli strumenti
              descritti nella privacy policy della terza parte o contattando quest'ultima direttamente.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">
              Individuare le impostazioni relative agli Strumenti di Tracciamento
            </h3>
            <p>
              Gli Utenti possono, per esempio, trovare informazioni su come gestire i Cookie in alcuni dei browser
              più diffusi ai seguenti indirizzi:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
              <li>Apple Safari</li>
              <li>Microsoft Internet Explorer</li>
              <li>Microsoft Edge</li>
              <li>Brave</li>
              <li>Opera</li>
            </ul>
            <p>
              Gli Utenti possono inoltre gestire alcuni Strumenti di Tracciamento per applicazioni mobili
              disattivandoli tramite le apposite impostazioni del dispositivo, quali le impostazioni di pubblicità
              per dispositivi mobili o le impostazioni relative al tracciamento in generale (gli Utenti possono
              consultare le impostazioni del dispositivo per individuare quella pertinente).
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Conseguenze legate al rifiuto dell'utilizzo di Strumenti di Tracciamento
            </h2>
            <p>
              Gli Utenti sono liberi di decidere se permettere o meno l'utilizzo di Strumenti di Tracciamento.
              Tuttavia, si noti che gli Strumenti di Tracciamento consentono a questa Applicazione di fornire agli
              Utenti un'esperienza migliore e funzionalità avanzate (in linea con le finalità delineate nel presente
              documento). Pertanto, qualora l'Utente decida di bloccare l'utilizzo di Strumenti di Tracciamento, il
              Titolare potrebbe non essere in grado di fornire le relative funzionalità.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">Titolare del Trattamento dei Dati</h2>
            <p>IwHome</p>
            <p><strong>Indirizzo email del Titolare:</strong> info@iwhome.it</p>

            <p className="mt-6">
              Dal momento che l'uso di Strumenti di Tracciamento di terza parte su questa Applicazione non può essere
              completamente controllato dal Titolare, ogni riferimento specifico a Strumenti di Tracciamento di terza
              parte è da considerarsi indicativo. Per ottenere informazioni complete, gli Utenti sono gentilmente
              invitati a consultare la privacy policy dei rispettivi servizi terzi elencati in questo documento.
            </p>
            <p>
              Data l'oggettiva complessità di identificazione delle tecnologie di tracciamento, gli Utenti sono
              invitati a contattare il Titolare qualora volessero ricevere ulteriori informazioni in merito
              all'utilizzo di tali tecnologie su questa Applicazione.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">Definizioni e riferimenti legali</h2>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Dati Personali (o Dati)</h3>
            <p>
              Costituisce dato personale qualunque informazione che, direttamente o indirettamente, anche in
              collegamento con qualsiasi altra informazione, ivi compreso un numero di identificazione personale,
              renda identificata o identificabile una persona fisica.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Dati di Utilizzo</h3>
            <p>
              Sono le informazioni raccolte automaticamente attraverso questa Applicazione (anche da applicazioni di
              parti terze integrate in questa Applicazione), tra cui: gli indirizzi IP o i nomi a dominio dei computer
              utilizzati dall'Utente che si connette con questa Applicazione, gli indirizzi in notazione URI (Uniform
              Resource Identifier), l'orario della richiesta, il metodo utilizzato nell'inoltrare la richiesta al
              server, la dimensione del file ottenuto in risposta, il codice numerico indicante lo stato della risposta
              dal server (buon fine, errore, ecc.) il paese di provenienza, le caratteristiche del browser e del sistema
              operativo utilizzati dal visitatore, le varie connotazioni temporali della visita (ad esempio il tempo di
              permanenza su ciascuna pagina) e i dettagli relativi all'itinerario seguito all'interno dell'Applicazione,
              con particolare riferimento alla sequenza delle pagine consultate, ai parametri relativi al sistema
              operativo e all'ambiente informatico dell'Utente.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Utente</h3>
            <p>
              L'individuo che utilizza questa Applicazione che, salvo ove diversamente specificato, coincide con
              l'Interessato.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Interessato</h3>
            <p>La persona fisica cui si riferiscono i Dati Personali.</p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Responsabile del Trattamento (o Responsabile)</h3>
            <p>
              La persona fisica, giuridica, la pubblica amministrazione e qualsiasi altro ente che tratta dati personali
              per conto del Titolare, secondo quanto esposto nella presente privacy policy.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Titolare del Trattamento (o Titolare)</h3>
            <p>
              La persona fisica o giuridica, l'autorità pubblica, il servizio o altro organismo che, singolarmente o
              insieme ad altri, determina le finalità e i mezzi del trattamento di dati personali e gli strumenti
              adottati, ivi comprese le misure di sicurezza relative al funzionamento ed alla fruizione di questa
              Applicazione. Il Titolare del Trattamento, salvo quanto diversamente specificato, è il titolare di questa
              Applicazione.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Questa Applicazione</h3>
            <p>
              Lo strumento hardware o software mediante il quale sono raccolti e trattati i Dati Personali degli Utenti.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Servizio</h3>
            <p>
              Il Servizio fornito da questa Applicazione così come definito nei relativi termini (se presenti) su
              questo sito/applicazione.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Unione Europea (o UE)</h3>
            <p>
              Salvo ove diversamente specificato, ogni riferimento all'Unione Europea contenuto in questo documento
              si intende esteso a tutti gli attuali stati membri dell'Unione Europea e dello Spazio Economico Europeo.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Cookie</h3>
            <p>
              I Cookie sono Strumenti di Tracciamento che consistono in piccole porzioni di dati conservate all'interno
              del browser dell'Utente.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Strumento di Tracciamento</h3>
            <p>
              Per Strumento di Tracciamento s'intende qualsiasi tecnologia – es. Cookie, identificativi univoci, web
              beacons, script integrati, e-tag e fingerprinting – che consenta di tracciare gli Utenti, per esempio
              raccogliendo o salvando informazioni sul dispositivo dell'Utente.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">Riferimenti legali</h2>
            <p>
              Ove non diversamente specificato, questa informativa privacy riguarda esclusivamente questa Applicazione.
            </p>

            <p className="text-sm text-[#212529]/60 mt-8">Ultima modifica: 23/07/25</p>
          </div>
        </div>
      </section>
    </div>
  );
}