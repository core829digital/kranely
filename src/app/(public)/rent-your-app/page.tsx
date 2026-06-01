import type { Metadata } from "next"
import { PublicNav } from "@/components/PublicNav"

export const metadata: Metadata = {
  title: "Rent Your App - Kranely",
  description: "Affitta la piattaforma Kranely: gestione preventivi, cantieri, fornitori e pagamenti senza costi di installazione.",
}

export default function RentYourAppPage() {
  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main id="main-content" className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Rent Your App</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-white/70 mb-6">
              Porta la gestione dei tuoi progetti edili nel futuro con Kranely. Affitta la nostra
              piattaforma software completa senza investire in costose licenze o infrastrutture.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Come Funziona</h2>
            <p className="text-lg text-white/70 mb-6">
              Scegli il piano che preferisci e inizia a usare tutte le funzionalità di Kranely
              immediatamente. Gestisci preventivi, cantieri, fornitori e pagamenti da un&apos;unica
              interfaccia intuitiva.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Vantaggi</h2>
            <ul className="list-disc list-inside text-lg text-white/70 space-y-2">
              <li>Nessun costo di installazione o configurazione iniziale</li>
              <li>Aggiornamenti automatici e assistenza inclusa</li>
              <li>Accesso da qualsiasi dispositivo, sempre e ovunque</li>
              <li>Scalabilità: cresci senza preoccupazioni tecnologiche</li>
            </ul>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Piani Disponibili</h2>
            <p className="text-lg text-white/70">
              Contattaci per ricevere un preventivo personalizzato in base alle esigenze della tua
              impresa. Offriamo piani mensili e annuali con sconti per abbonamenti pluriennali.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
