import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Privacy() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-16 bg-[#212529]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-light text-white mb-4">Privacy Policy</h1>
            <p className="text-white/60">Ultimo aggiornamento: 23/07/25</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none text-[#212529]/80">

            <p className="text-lg">
              Questa Applicazione raccoglie alcuni Dati Personali dei propri Utenti.
              Questo documento può essere stampato utilizzando il comando di stampa presente nelle
              impostazioni di qualsiasi browser.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">Titolare del Trattamento dei Dati</h2>
            <p>IwHome</p>
            <p><strong>Indirizzo email del Titolare:</strong> info@iwhome.it / amministrazione@iwhome.it</p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">Tipologie di Dati raccolti</h2>
            <p>
              Fra i Dati Personali raccolti da questa Applicazione, in modo autonomo o tramite terze parti,
              ci sono: Strumenti di Tracciamento; Dati di utilizzo.
            </p>
            <p>
              Dettagli completi su ciascuna tipologia di Dati Personali raccolti sono forniti nelle sezioni
              dedicate di questa privacy policy o mediante specifici testi informativi visualizzati prima
              della raccolta dei Dati stessi.
            </p>
            <p>
              I Dati Personali possono essere liberamente forniti dall'Utente o, nel caso di Dati di Utilizzo,
              raccolti automaticamente durante l'uso di questa Applicazione.
            </p>
            <p>
              Se non diversamente specificato, tutti i Dati richiesti da questa Applicazione sono obbligatori.
              Se l'Utente rifiuta di comunicarli, potrebbe essere impossibile per questa Applicazione fornire
              il Servizio. Nei casi in cui questa Applicazione indichi alcuni Dati come facoltativi, gli Utenti
              sono liberi di astenersi dal comunicare tali Dati, senza che ciò abbia alcuna conseguenza sulla
              disponibilità del Servizio o sulla sua operatività.
            </p>
            <p>
              Gli Utenti che dovessero avere dubbi su quali Dati siano obbligatori sono incoraggiati a
              contattare il Titolare.
            </p>
            <p>
              L'eventuale utilizzo di Cookie – o di altri strumenti di tracciamento – da parte di questa
              Applicazione o dei titolari dei servizi terzi utilizzati da questa Applicazione ha la finalità
              di fornire il Servizio richiesto dall'Utente, oltre alle ulteriori finalità descritte nel
              presente documento e nella{' '}
              <Link to={createPageUrl('Cookie')} className="text-[#C9A962] hover:underline">Cookie Policy</Link>.
            </p>
            <p>
              L'Utente si assume la responsabilità dei Dati Personali di terzi ottenuti, pubblicati o
              condivisi mediante questa Applicazione.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Modalità e luogo del trattamento dei Dati raccolti
            </h2>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Modalità di trattamento</h3>
            <p>
              Il Titolare adotta le opportune misure di sicurezza volte ad impedire l'accesso, la divulgazione,
              la modifica o la distruzione non autorizzate dei Dati Personali.
            </p>
            <p>
              Il trattamento viene effettuato mediante strumenti informatici e/o telematici, con modalità
              organizzative e con logiche strettamente correlate alle finalità indicate. Oltre al Titolare,
              in alcuni casi, potrebbero avere accesso ai Dati altri soggetti coinvolti nell'organizzazione
              di questa Applicazione (personale amministrativo, commerciale, marketing, legali, amministratori
              di sistema) ovvero soggetti esterni (come fornitori di servizi tecnici terzi, corrieri postali,
              hosting provider, società informatiche, agenzie di comunicazione) nominati anche, se necessario,
              Responsabili del Trattamento da parte del Titolare. L'elenco aggiornato dei Responsabili potrà
              sempre essere richiesto al Titolare del Trattamento.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Luogo</h3>
            <p>
              I Dati sono trattati presso le sedi operative del Titolare ed in ogni altro luogo in cui le
              parti coinvolte nel trattamento siano localizzate. Per ulteriori informazioni, contatta il Titolare.
            </p>
            <p>
              I Dati Personali dell'Utente potrebbero essere trasferiti in un paese diverso da quello in cui
              l'Utente si trova. Per ottenere ulteriori informazioni sul luogo del trattamento l'Utente può
              fare riferimento alla sezione relativa ai dettagli sul trattamento dei Dati Personali.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Periodo di conservazione</h3>
            <p>
              Se non diversamente indicato in questo documento, i Dati Personali sono trattati e conservati
              per il tempo richiesto dalla finalità per la quale sono stati raccolti e potrebbero essere
              conservati per un periodo più lungo a causa di eventuali obbligazioni legali o sulla base del
              consenso degli Utenti.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Finalità del Trattamento dei Dati raccolti
            </h2>
            <p>
              I Dati dell'Utente sono raccolti per consentire al Titolare di fornire il Servizio, adempiere
              agli obblighi di legge, rispondere a richieste o azioni esecutive, tutelare i propri diritti ed
              interessi (o quelli di Utenti o di terze parti), individuare eventuali attività dolose o
              fraudolente, nonché per le seguenti finalità: Statistica, Interazione con social network e
              piattaforme esterne e Visualizzazione di contenuti da piattaforme esterne.
            </p>
            <p>
              Per ottenere informazioni dettagliate sulle finalità del trattamento e sui Dati Personali
              trattati per ciascuna finalità, l'Utente può fare riferimento alla sezione "Dettagli sul
              trattamento dei Dati Personali".
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Dettagli sul trattamento dei Dati Personali
            </h2>
            <p>
              I Dati Personali sono raccolti per le seguenti finalità ed utilizzando i seguenti servizi:
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">
              Interazione con social network e piattaforme esterne
            </h3>
            <p>
              Questo tipo di servizi permette di effettuare interazioni con i social network, o con altre
              piattaforme esterne, direttamente dalle pagine di questa Applicazione.
            </p>
            <p>
              Le interazioni e le informazioni acquisite da questa Applicazione sono in ogni caso soggette
              alle impostazioni privacy dell'Utente relative ad ogni social network.
            </p>
            <p>
              Questo tipo di servizio potrebbe comunque raccogliere dati sul traffico per le pagine dove il
              servizio è installato, anche quando gli Utenti non lo utilizzano.
            </p>
            <p>
              Si raccomanda di disconnettersi dai rispettivi servizi per assicurarsi che i dati elaborati su
              questa Applicazione non vengano ricollegati al profilo dell'Utente.
            </p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">
              Pulsante Mi Piace e widget sociali di Facebook (Meta Platforms, Inc.)
            </h4>
            <p>
              Il pulsante "Mi Piace" e i widget sociali di Facebook sono servizi di interazione con il social
              network Facebook, forniti da Meta Platforms, Inc.
            </p>
            <p>
              Dati Personali trattati: Dati di utilizzo; Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy.</p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">
              Pulsante e widget sociali di Linkedin (LinkedIn Corporation)
            </h4>
            <p>
              Il pulsante e i widget sociali di LinkedIn sono servizi di interazione con il social network
              Linkedin, forniti da LinkedIn Corporation.
            </p>
            <p>
              Dati Personali trattati: Dati di utilizzo; Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy.</p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">
              Visualizzazione di contenuti da piattaforme esterne
            </h3>
            <p>
              Questo tipo di servizi permette di visualizzare contenuti ospitati su piattaforme esterne
              direttamente dalle pagine di questa Applicazione e di interagire con essi.
            </p>
            <p>
              Questo tipo di servizio potrebbe comunque raccogliere dati sul traffico web relativo alle
              pagine dove il servizio è installato, anche quando gli utenti non lo utilizzano.
            </p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">Google Fonts (Google LLC)</h4>
            <p>
              Google Fonts è un servizio di visualizzazione di stili di carattere gestito da Google LLC che
              permette a questa Applicazione di integrare tali contenuti all'interno delle proprie pagine.
            </p>
            <p>
              Dati Personali trattati: Dati di utilizzo; Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy.</p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">Widget Google Maps (Google LLC)</h4>
            <p>
              Google Maps è un servizio di visualizzazione di mappe gestito da Google LLC che permette a
              questa Applicazione di integrare tali contenuti all'interno delle proprie pagine.
            </p>
            <p>
              Dati Personali trattati: Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy.</p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Statistica</h3>
            <p>
              I servizi contenuti nella presente sezione permettono al Titolare del Trattamento di monitorare
              e analizzare i dati di traffico e servono a tener traccia del comportamento dell'Utente.
            </p>

            <h4 className="text-lg font-medium text-[#212529] mt-4 mb-2">Google Analytics (Google LLC)</h4>
            <p>
              Google Analytics è un servizio di analisi web fornito da Google LLC ("Google"). Google utilizza
              i Dati Personali raccolti allo scopo di tracciare ed esaminare l'utilizzo di questa Applicazione,
              compilare report e condividerli con gli altri servizi sviluppati da Google.
            </p>
            <p>
              Google potrebbe utilizzare i Dati Personali per contestualizzare e personalizzare gli annunci
              del proprio network pubblicitario.
            </p>
            <p>
              Dati Personali trattati: Dati di utilizzo; Strumenti di Tracciamento.
            </p>
            <p>Luogo del trattamento: Stati Uniti – Privacy Policy – Opt Out.</p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">Cookie Policy</h2>
            <p>
              Questa Applicazione fa utilizzo di Strumenti di Tracciamento. Per saperne di più, gli Utenti
              possono consultare la{' '}
              <Link to={createPageUrl('Cookie')} className="text-[#C9A962] hover:underline">Cookie Policy</Link>.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Ulteriori informazioni per gli utenti
            </h2>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Base giuridica del trattamento</h3>
            <p>
              Il Titolare tratta Dati Personali relativi all'Utente in caso sussista una delle seguenti condizioni:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                l'Utente ha prestato il consenso per una o più finalità specifiche; Nota: in alcuni
                ordinamenti il Titolare può essere autorizzato a trattare Dati Personali senza che debba
                sussistere il consenso dell'Utente o un'altra delle basi giuridiche specificate di seguito,
                fino a quando l'Utente non si opponga ("opt-out") a tale trattamento. Ciò non è tuttavia
                applicabile qualora il trattamento di Dati Personali sia regolato dalla legislazione europea
                in materia di protezione dei Dati Personali;
              </li>
              <li>
                il trattamento è necessario all'esecuzione di un contratto con l'Utente e/o all'esecuzione
                di misure precontrattuali;
              </li>
              <li>
                il trattamento è necessario per adempiere un obbligo legale al quale è soggetto il Titolare;
              </li>
              <li>
                il trattamento è necessario per l'esecuzione di un compito di interesse pubblico o per
                l'esercizio di pubblici poteri di cui è investito il Titolare;
              </li>
              <li>
                il trattamento è necessario per il perseguimento del legittimo interesse del Titolare o di terzi.
              </li>
            </ul>
            <p>
              È comunque sempre possibile richiedere al Titolare di chiarire la concreta base giuridica di
              ciascun trattamento ed in particolare di specificare se il trattamento sia basato sulla legge,
              previsto da un contratto o necessario per concludere un contratto.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">
              Ulteriori informazioni sul tempo di conservazione
            </h3>
            <p>
              Se non diversamente indicato in questo documento, i Dati Personali sono trattati e conservati
              per il tempo richiesto dalla finalità per la quale sono stati raccolti e potrebbero essere
              conservati per un periodo più lungo a causa di eventuali obbligazioni legali o sulla base del
              consenso degli Utenti.
            </p>
            <p>Pertanto:</p>
            <ul className="list-none pl-0 space-y-2">
              <li>
                – I Dati Personali raccolti per scopi collegati all'esecuzione di un contratto tra il
                Titolare e l'Utente saranno trattenuti sino a quando sia completata l'esecuzione di tale contratto.
              </li>
              <li>
                – I Dati Personali raccolti per finalità riconducibili all'interesse legittimo del Titolare
                saranno trattenuti sino al soddisfacimento di tale interesse. L'Utente può ottenere ulteriori
                informazioni in merito all'interesse legittimo perseguito dal Titolare nelle relative sezioni
                di questo documento o contattando il Titolare.
              </li>
            </ul>
            <p>
              Quando il trattamento è basato sul consenso dell'Utente, il Titolare può conservare i Dati
              Personali più a lungo sino a quando detto consenso non venga revocato. Inoltre, il Titolare
              potrebbe essere obbligato a conservare i Dati Personali per un periodo più lungo in ottemperanza
              ad un obbligo di legge o per ordine di un'autorità.
            </p>
            <p>
              Al termine del periodo di conservazione i Dati Personali saranno cancellati. Pertanto, allo
              spirare di tale termine il diritto di accesso, cancellazione, rettificazione ed il diritto alla
              portabilità dei Dati non potranno più essere esercitati.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Diritti dell'Utente</h3>
            <p>
              Gli Utenti possono esercitare determinati diritti con riferimento ai Dati trattati dal Titolare.
            </p>
            <p>In particolare, nei limiti previsti dalla legge, l'Utente ha il diritto di:</p>
            <ul className="list-none pl-0 space-y-2">
              <li>
                – <strong>revocare il consenso in ogni momento.</strong> L'Utente può revocare il consenso al
                trattamento dei propri Dati Personali precedentemente espresso.
              </li>
              <li>
                – <strong>opporsi al trattamento dei propri Dati.</strong> L'Utente può opporsi al trattamento
                dei propri Dati quando esso avviene in virtù di una base giuridica diversa dal consenso.
              </li>
              <li>
                – <strong>accedere ai propri Dati.</strong> L'Utente ha diritto ad ottenere informazioni sui
                Dati trattati dal Titolare, su determinati aspetti del trattamento ed a ricevere una copia dei
                Dati trattati.
              </li>
              <li>
                – <strong>verificare e chiedere la rettificazione.</strong> L'Utente può verificare la correttezza
                dei propri Dati e richiederne l'aggiornamento o la correzione.
              </li>
              <li>
                – <strong>ottenere la limitazione del trattamento.</strong> L'Utente può richiedere la limitazione
                del trattamento dei propri Dati. In tal caso il Titolare non tratterà i Dati per alcun altro scopo
                se non la loro conservazione.
              </li>
              <li>
                – <strong>ottenere la cancellazione o rimozione dei propri Dati Personali.</strong> L'Utente può
                richiedere la cancellazione dei propri Dati da parte del Titolare.
              </li>
              <li>
                – <strong>ricevere i propri Dati o farli trasferire ad altro titolare.</strong> L'Utente ha diritto
                di ricevere i propri Dati in formato strutturato, di uso comune e leggibile da dispositivo automatico
                e, ove tecnicamente fattibile, di ottenerne il trasferimento senza ostacoli ad un altro titolare.
              </li>
              <li>
                – <strong>proporre reclamo.</strong> L'Utente può proporre un reclamo all'autorità di controllo
                della protezione dei dati personali competente o agire in sede giudiziale.
              </li>
            </ul>
            <p>
              Gli Utenti hanno diritto di ottenere informazioni in merito alla base giuridica per il trasferimento
              di Dati all'estero incluso verso qualsiasi organizzazione internazionale regolata dal diritto
              internazionale o costituita da due o più paesi, come ad esempio l'ONU, nonché in merito alle misure
              di sicurezza adottate dal Titolare per proteggere i loro Dati.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Dettagli sul diritto di opposizione</h3>
            <p>
              Quando i Dati Personali sono trattati nell'interesse pubblico, nell'esercizio di pubblici poteri
              di cui è investito il Titolare oppure per perseguire un interesse legittimo del Titolare, gli
              Utenti hanno diritto ad opporsi al trattamento per motivi connessi alla loro situazione particolare.
            </p>
            <p>
              Si fa presente agli Utenti che, ove i loro Dati fossero trattati con finalità di marketing diretto,
              possono opporsi al trattamento in qualsiasi momento, gratuitamente e senza fornire alcuna motivazione.
              Qualora gli Utenti si oppongano al trattamento per finalità di marketing diretto, i Dati Personali
              non sono più oggetto di trattamento per tali finalità. Per scoprire se il Titolare tratti Dati con
              finalità di marketing diretto gli Utenti possono fare riferimento alle rispettive sezioni di questo
              documento.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Come esercitare i diritti</h3>
            <p>
              Per esercitare i propri diritti, gli Utenti possono indirizzare una richiesta ai recapiti del
              Titolare indicati in questo documento. La richiesta è gratuita e il Titolare risponderà nel più
              breve tempo possibile, in ogni caso entro un mese, fornendo all'Utente tutte le informazioni
              previste dalla legge. Eventuali rettifiche, cancellazioni o limitazioni del trattamento saranno
              comunicate dal Titolare a ciascuno dei destinatari, se esistenti, a cui sono stati trasmessi i
              Dati Personali, salvo che ciò si riveli impossibile o implichi uno sforzo sproporzionato. Il
              Titolare comunica all'Utente tali destinatari qualora egli lo richieda.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Ulteriori informazioni sul trattamento
            </h2>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Difesa in giudizio</h3>
            <p>
              I Dati Personali dell'Utente possono essere utilizzati da parte del Titolare in giudizio o nelle
              fasi preparatorie alla sua eventuale instaurazione per la difesa da abusi nell'utilizzo di questa
              Applicazione o dei Servizi connessi da parte dell'Utente.
              L'Utente dichiara di essere consapevole che il Titolare potrebbe essere obbligato a rivelare i
              Dati per ordine delle autorità pubbliche.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Informative specifiche</h3>
            <p>
              Su richiesta dell'Utente, in aggiunta alle informazioni contenute in questa privacy policy, questa
              Applicazione potrebbe fornire all'Utente delle informative aggiuntive e contestuali riguardanti
              Servizi specifici, o la raccolta ed il trattamento di Dati Personali.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">Log di sistema e manutenzione</h3>
            <p>
              Per necessità legate al funzionamento ed alla manutenzione, questa Applicazione e gli eventuali
              servizi terzi da essa utilizzati potrebbero raccogliere log di sistema, ossia file che registrano
              le interazioni e che possono contenere anche Dati Personali, quali l'indirizzo IP Utente.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">
              Informazioni non contenute in questa policy
            </h3>
            <p>
              Ulteriori informazioni in relazione al trattamento dei Dati Personali potranno essere richieste
              in qualsiasi momento al Titolare del Trattamento utilizzando gli estremi di contatto.
            </p>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">
              Modifiche a questa privacy policy
            </h3>
            <p>
              Il Titolare del Trattamento si riserva il diritto di apportare modifiche alla presente privacy
              policy in qualunque momento notificandolo agli Utenti su questa pagina e, se possibile, su questa
              Applicazione nonché, qualora tecnicamente e legalmente fattibile, inviando una notifica agli
              Utenti attraverso uno degli estremi di contatto di cui è in possesso. Si prega dunque di consultare
              con frequenza questa pagina, facendo riferimento alla data di ultima modifica indicata in fondo.
            </p>
            <p>
              Qualora le modifiche interessino trattamenti la cui base giuridica è il consenso, il Titolare
              provvederà a raccogliere nuovamente il consenso dell'Utente, se necessario.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">
              Definizioni e riferimenti legali
            </h2>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Dati Personali (o Dati)</h3>
            <p>
              Costituisce dato personale qualunque informazione che, direttamente o indirettamente, anche in
              collegamento con qualsiasi altra informazione, ivi compreso un numero di identificazione personale,
              renda identificata o identificabile una persona fisica.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Dati di Utilizzo</h3>
            <p>
              Sono le informazioni raccolte automaticamente attraverso questa Applicazione (anche da applicazioni
              di parti terze integrate in questa Applicazione), tra cui: gli indirizzi IP o i nomi a dominio dei
              computer utilizzati dall'Utente che si connette con questa Applicazione, gli indirizzi in notazione
              URI (Uniform Resource Identifier), l'orario della richiesta, il metodo utilizzato nell'inoltrare la
              richiesta al server, la dimensione del file ottenuto in risposta, il codice numerico indicante lo
              stato della risposta dal server (buon fine, errore, ecc.) il paese di provenienza, le caratteristiche
              del browser e del sistema operativo utilizzati dal visitatore, le varie connotazioni temporali della
              visita (ad esempio il tempo di permanenza su ciascuna pagina) e i dettagli relativi all'itinerario
              seguito all'interno dell'Applicazione, con particolare riferimento alla sequenza delle pagine
              consultate, ai parametri relativi al sistema operativo e all'ambiente informatico dell'Utente.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Utente</h3>
            <p>
              L'individuo che utilizza questa Applicazione che, salvo ove diversamente specificato, coincide con
              l'Interessato.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Interessato</h3>
            <p>La persona fisica cui si riferiscono i Dati Personali.</p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">
              Responsabile del Trattamento (o Responsabile)
            </h3>
            <p>
              La persona fisica, giuridica, la pubblica amministrazione e qualsiasi altro ente che tratta dati
              personali per conto del Titolare, secondo quanto esposto nella presente privacy policy.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">
              Titolare del Trattamento (o Titolare)
            </h3>
            <p>
              La persona fisica o giuridica, l'autorità pubblica, il servizio o altro organismo che, singolarmente
              o insieme ad altri, determina le finalità e i mezzi del trattamento di dati personali e gli strumenti
              adottati, ivi comprese le misure di sicurezza relative al funzionamento ed alla fruizione di questa
              Applicazione. Il Titolare del Trattamento, salvo quanto diversamente specificato, è il titolare di
              questa Applicazione.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Questa Applicazione</h3>
            <p>
              Lo strumento hardware o software mediante il quale sono raccolti e trattati i Dati Personali degli
              Utenti.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Servizio</h3>
            <p>
              Il Servizio fornito da questa Applicazione così come definito nei relativi termini (se presenti)
              su questo sito/applicazione.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Unione Europea (o UE)</h3>
            <p>
              Salvo ove diversamente specificato, ogni riferimento all'Unione Europea contenuto in questo documento
              si intende esteso a tutti gli attuali stati membri dell'Unione Europea e dello Spazio Economico Europeo.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Cookie</h3>
            <p>
              I Cookie sono Strumenti di Tracciamento che consistono in piccole porzioni di dati conservate
              all'interno del browser dell'Utente.
            </p>

            <h3 className="text-lg font-medium text-[#212529] mt-4 mb-2">Strumento di Tracciamento</h3>
            <p>
              Per Strumento di Tracciamento s'intende qualsiasi tecnologia – es. Cookie, identificativi univoci,
              web beacons, script integrati, e-tag e fingerprinting – che consenta di tracciare gli Utenti, per
              esempio raccogliendo o salvando informazioni sul dispositivo dell'Utente.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">Riferimenti legali</h2>
            <p>
              Ove non diversamente specificato, questa informativa privacy riguarda esclusivamente questa
              Applicazione.
            </p>

            <p className="text-sm text-[#212529]/60 mt-8">Ultima modifica: 23/07/25</p>
          </div>
        </div>
      </section>
    </div>
  );
}