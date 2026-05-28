import { Logo } from "@/components/Logo"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-kranely-app-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-kranely-app-bg/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <Logo />
            </a>
            <a href="/" className="text-sm text-white/60 hover:text-white transition-colors">Torna alla Home</a>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Termini e Condizioni</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-white/70 mb-6">
              Benvenuto su Kranely. Utilizzando i nostri servizi, accetti i seguenti termini e condizioni.
            </p>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Accettazione dei Termini</h2>
            <p className="text-lg text-white/70 mb-6">
              Registrandoti o utilizzando la piattaforma Kranely, dichiari di aver letto e accettato i presenti termini.
            </p>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Responsabilità dell&apos;Utente</h2>
            <p className="text-lg text-white/70 mb-6">
              L&apos;utente è responsabile della segretezza delle proprie credenziali di accesso. Qualsiasi attività effettuata con il proprio account è sotto la propria responsabilità.
            </p>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Proprietà Intellettuale</h2>
            <p className="text-lg text-white/70 mb-6">
              Tutti i contenuti, loghi, marchi e software di Kranely sono di proprietà esclusiva di Kranely S.r.l.
            </p>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Limitazione di Responsabilità</h2>
            <p className="text-lg text-white/70 mb-6">
              Kranely non sarà responsabile per danni indiretti derivanti dall&apos;uso del servizio.
            </p>
            <p className="text-lg text-white/70 mt-8">
              Per qualsiasi domanda, contattaci a <a href="mailto:legal@kranely.it" className="text-kranely-accent">legal@kranely.it</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
