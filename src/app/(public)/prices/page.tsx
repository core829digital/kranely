import type { Metadata } from "next"
import { PublicNav } from "@/components/PublicNav"

export const metadata: Metadata = {
  title: "Prezzi Edilizia - Kranely",
  description: "Listino prezzi di riferimento per materiali edili e servizi di posa in opera. Piani Base, Professionale e Business.",
}

export default function PricesPage() {
  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Prezzi Edilizia</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-white/70 mb-8">
              Consulta i prezzi di riferimento per i materiali edili e i servizi di posa in opera.
              I nostri listini vengono aggiornati periodicamente per riflettere le quotazioni di
              mercato.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-2">Base</h3>
                <p className="text-3xl font-bold text-kranely-accent mb-4">Gratis</p>
                <ul className="text-sm text-white/60 space-y-2">
                  <li>Fino a 3 progetti attivi</li>
                  <li>Gestione preventivi base</li>
                  <li>Supporto via email</li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-kranely-accent/40">
                <h3 className="text-xl font-semibold text-white mb-2">Professionale</h3>
                <p className="text-3xl font-bold text-kranely-accent mb-4">29 €<span className="text-sm text-white/40">/mese</span></p>
                <ul className="text-sm text-white/60 space-y-2">
                  <li>Progetti illimitati</li>
                  <li>Gestione fornitori</li>
                  <li>Calcolatore volumi</li>
                  <li>Supporto prioritario</li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-2">Business</h3>
                <p className="text-3xl font-bold text-kranely-accent mb-4">59 €<span className="text-sm text-white/40">/mese</span></p>
                <ul className="text-sm text-white/60 space-y-2">
                  <li>Tutto del piano Professional</li>
                  <li>API integration</li>
                  <li>Report personalizzati</li>
                  <li>Supporto dedicato 24/7</li>
                </ul>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Listino Materiali</h2>
            <p className="text-lg text-white/70 mb-6">
              Il listino materiali include i prezzi medi aggiornati per serramenti in PVC, alluminio
              e legno, infissi, porte blindate, e materiali per l&apos;edilizia in generale.
              Contattaci per un preventivo dettagliato e personalizzato.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
