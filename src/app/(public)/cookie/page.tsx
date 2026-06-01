import type { Metadata } from "next"
import { PublicNav } from "@/components/PublicNav"

export const metadata: Metadata = {
  title: "Cookie Policy - Kranely",
  description: "Cosa sono i cookie e come vengono utilizzati sulla piattaforma Kranely.",
}

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main id="main-content" className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Cookie Policy</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-white/70 mb-6">
              Questa Cookie Policy spiega cosa sono i cookie e come vengono utilizzati su Kranely.
              Utilizziamo cookie e tecnologie simili per garantire il corretto funzionamento della
              piattaforma e migliorare l&apos;esperienza utente.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Cosa Sono i Cookie</h2>
            <p className="text-lg text-white/70 mb-6">
              I cookie sono piccoli file di testo che i siti web salvano sul tuo dispositivo durante
              la navigazione. Permettono al sito di ricordare le tue preferenze e offrirti
              un&apos;esperienza personalizzata.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Tipologie di Cookie Utilizzati</h2>
            <ul className="list-disc list-inside text-lg text-white/70 space-y-2">
              <li><strong>Cookie tecnici:</strong> necessari per il funzionamento della piattaforma</li>
              <li><strong>Cookie di sessione:</strong> memorizzati temporaneamente durante la navigazione</li>
              <li><strong>Cookie analitici:</strong> ci aiutano a capire come utilizzi la piattaforma</li>
              <li><strong>Cookie funzionali:</strong> ricordano le tue preferenze e impostazioni</li>
            </ul>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Gestione dei Cookie</h2>
            <p className="text-lg text-white/70">
              Puoi gestire le tue preferenze sui cookie in qualsiasi momento dalle impostazioni del
              tuo browser. La disabilitazione dei cookie tecnici potrebbe compromettere alcune
              funzionalità della piattaforma.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Contatti</h2>
            <p className="text-lg text-white/70">
              Per qualsiasi domanda relativa all&apos;uso dei cookie, contattaci tramite la
              pagina Contatti o all&apos;indirizzo email privacy@kranely.it.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
