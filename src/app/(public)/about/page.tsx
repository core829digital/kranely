import type { Metadata } from "next"
import { PublicNav } from "@/components/PublicNav"

export const metadata: Metadata = {
  title: "Chi Siamo - Kranely",
  description: "Kranely nasce dall'esperienza diretta nel settore serramenti ed edilizia. Scopri la nostra missione e visione.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Chi Siamo</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-white/70 mb-6">
              Kranely nasce dall&apos;esperienza diretta nel settore dei serramenti e dell&apos;edilizia.
              La nostra missione è digitalizzare e semplificare l&apos;intero ciclo di vita di un progetto,
              dalla richiesta preventivo alla consegna finale.
            </p>
            <p className="text-lg text-white/70 mb-6">
              La piattaforma offre strumenti potenti per la gestione di preventivi, fornitori, cantieri,
              pagamenti e comunicazioni, tutto in un unico ecosistema integrato.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">La Nostra Visione</h2>
            <p className="text-lg text-white/70">
              Crediamo che la tecnologia debba essere un moltiplicatore di efficienza, non un ostacolo.
              Per questo abbiamo creato un&apos;interfaccia intuitiva con funzionalità avanzate,
              progettata specificamente per le esigenze di serramentisti e imprese edili.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
