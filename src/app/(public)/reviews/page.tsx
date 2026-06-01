import type { Metadata } from "next"
import { PublicNav } from "@/components/PublicNav"

export const metadata: Metadata = {
  title: "Recensioni - Kranely",
  description: "Cosa dicono i nostri clienti della piattaforma Kranely per serramentisti e imprese edili.",
}

const reviews = [
  { name: "Marco Bianchi", company: "EdilBianchi SRL", text: "Kranely ha rivoluzionato il modo in cui gestiamo i preventivi. Ora tutto è digitalizzato e tracciabile.", rating: 5 },
  { name: "Laura Verdi", company: "Verdi Serramenti", text: "Finalmente una piattaforma pensata per il nostro settore. La gestione fornitori è eccezionale.", rating: 5 },
  { name: "Giuseppe Rossi", company: "Rossi Costruzioni", text: "Il calcolatore volumi e la gestione cantieri ci hanno fatto risparmiare ore di lavoro ogni settimana.", rating: 4 },
  { name: "Anna Neri", company: "Neri Infissi", text: "Assistenza clienti sempre disponibile e piattaforma intuitiva. Consigliato a tutti i serramentisti.", rating: 5 },
]

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main id="main-content" className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Recensioni</h1>
          <p className="text-lg text-white/70 mb-10">
            Ecco cosa dicono i nostri clienti. Ogni recensione è di un utente reale della
            piattaforma Kranely.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review, i) => (
              <article key={i} className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-1 mb-3" role="img" aria-label={`${review.rating} stelle su 5`}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} className={`w-5 h-5 ${j < review.rating ? "text-kranely-accent" : "text-white/20"}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-white/80 text-sm mb-4">&ldquo;{review.text}&rdquo;</blockquote>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-white font-medium text-sm">{review.name}</p>
                  <p className="text-white/40 text-xs">{review.company}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
