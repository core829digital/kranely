import React from 'react';
import { motion } from 'framer-motion';

export default function Termini() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-16 bg-[#212529]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-light text-white mb-4">Termini di Servizio</h1>
            <p className="text-white/60">Ultimo aggiornamento: Gennaio 2025</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none text-[#212529]/80">
            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">1. Accettazione dei Termini</h2>
            <p>
              Utilizzando il sito web iwhome.it e i servizi offerti da IwHome, accetti di essere
              vincolato dai presenti Termini di Servizio. Se non accetti questi termini,
              ti preghiamo di non utilizzare il sito.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">2. Descrizione dei Servizi</h2>
            <p>IwHome offre i seguenti servizi:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Progettazione e realizzazione di ristrutturazioni chiavi in mano</li>
              <li>Fornitura e installazione di infissi (PVC, alluminio, legno)</li>
              <li>Consulenza di interior design</li>
              <li>Strumenti online per il calcolo di preventivi stimati</li>
              <li>Sistema di prenotazione appuntamenti per visite allo showroom</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">3. Preventivi Online</h2>
            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">3.1 Natura Indicativa</h3>
            <p>
              I preventivi generati attraverso il nostro calcolatore online sono da considerarsi
              <strong> esclusivamente indicativi</strong> e non vincolanti. I prezzi finali possono
              variare in base a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sopralluogo tecnico e valutazione dello stato dell'immobile</li>
              <li>Specifiche tecniche dettagliate dei materiali scelti</li>
              <li>Eventuali lavori strutturali o imprevisti</li>
              <li>Variazioni dei prezzi di mercato dei materiali</li>
              <li>Complessità dell'installazione</li>
            </ul>

            <h3 className="text-xl font-medium text-[#212529] mt-6 mb-3">3.2 Preventivo Definitivo</h3>
            <p>
              Il preventivo definitivo e vincolante verrà fornito solo dopo un sopralluogo
              gratuito e una valutazione dettagliata del progetto da parte dei nostri tecnici.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">4. Prenotazione Appuntamenti</h2>
            <p>
              Il sistema di prenotazione online è soggetto a disponibilità. La conferma
              dell'appuntamento avverrà tramite email. In caso di impossibilità a presentarsi,
              ti chiediamo di cancellare o modificare l'appuntamento con almeno 24 ore di anticipo.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">5. Proprietà Intellettuale</h2>
            <p>
              Tutti i contenuti presenti sul sito, inclusi testi, immagini, grafiche, loghi
              e software, sono di proprietà di IwHome o dei rispettivi titolari e sono protetti
              dalle leggi sul diritto d'autore. È vietata la riproduzione, distribuzione o
              modifica senza autorizzazione scritta.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">6. Limitazione di Responsabilità</h2>
            <p>IwHome non è responsabile per:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Danni derivanti dall'uso delle informazioni presenti sul sito</li>
              <li>Interruzioni o malfunzionamenti del sito</li>
              <li>Differenze tra i preventivi stimati online e quelli definitivi</li>
              <li>Contenuti di siti terzi collegati</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">7. Obblighi dell'Utente</h2>
            <p>L'utente si impegna a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornire informazioni veritiere e accurate</li>
              <li>Non utilizzare il sito per scopi illegali o non autorizzati</li>
              <li>Non tentare di accedere a aree riservate del sito</li>
              <li>Non interferire con il funzionamento del sito</li>
            </ul>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">8. Garanzie sui Lavori</h2>
            <p>
              I lavori eseguiti da IwHome sono coperti dalle garanzie previste dalla legge italiana:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Garanzia legale:</strong> 2 anni per difetti di conformità</li>
              <li><strong>Garanzia costruttore:</strong> variabile in base ai materiali utilizzati</li>
              <li><strong>Garanzia su lavori edili:</strong> secondo normativa vigente</li>
            </ul>
            <p>
              Le condizioni specifiche di garanzia saranno indicate nel contratto di fornitura.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">9. Risoluzione delle Controversie</h2>
            <p>
              Per qualsiasi controversia relativa ai presenti Termini di Servizio, le parti
              si impegnano a tentare una risoluzione amichevole. In caso di mancato accordo,
              sarà competente il Foro del luogo di residenza del consumatore, se applicabile,
              o il Foro di competenza secondo la legge italiana.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">10. Modifiche ai Termini</h2>
            <p>
              IwHome si riserva il diritto di modificare i presenti Termini di Servizio in
              qualsiasi momento. Le modifiche saranno pubblicate su questa pagina e, se
              sostanziali, comunicate agli utenti registrati. L'uso continuato del sito
              dopo le modifiche costituisce accettazione dei nuovi termini.
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">11. Legge Applicabile</h2>
            <p>
              I presenti Termini di Servizio sono regolati dalla legge italiana. Per quanto
              non espressamente previsto, si applicano le disposizioni del Codice Civile italiano
              e del Codice del Consumo (D.Lgs. 206/2005).
            </p>

            <h2 className="text-2xl font-medium text-[#212529] mt-8 mb-4">12. Contatti</h2>
            <p>
              Per domande sui presenti Termini di Servizio, contattaci a:
            </p>
            <ul className="list-none pl-0 space-y-2">
              <li><strong>Email:</strong> info@iwhome.it / amministrazione@iwhome.it</li>
              <li><strong>Sede:</strong> Via Emilia 22/F, Reggio Emilia (RE) - 42124</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}