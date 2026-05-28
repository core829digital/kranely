export default function SupplierOnboardingPage() {
  return (
    <div className="min-h-screen bg-kranely-app-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-kranely-app-bg/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-kranely-accent flex items-center justify-center">
                <span className="text-kranely-app-bg font-bold text-lg">K</span>
              </div>
              <span className="text-white font-semibold text-lg">Kranely</span>
            </a>
            <a href="/" className="text-sm text-white/60 hover:text-white transition-colors">Torna alla Home</a>
          </div>
        </div>
      </nav>
      <div className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Onboarding Fornitore</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-white/70 mb-6">
              Benvenuto nella procedura di onboarding per fornitori Kranely. Diventare un fornitore
              partner ti permette di entrare in contatto con imprese edili e serramentisti di tutta
              Italia.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Requisiti</h2>
            <ul className="list-disc list-inside text-lg text-white/70 space-y-2">
              <li>Partita IVA attiva nel settore edile o serramenti</li>
              <li>Almeno 3 anni di esperienza comprovata</li>
              <li>Disponibilità a coprire determinate zone geografiche</li>
              <li>Assicurazione RC professionale in corso di validità</li>
            </ul>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Processo di Iscrizione</h2>
            <ol className="list-decimal list-inside text-lg text-white/70 space-y-2">
              <li>Registrati con la tua email e partita IVA</li>
              <li>Completa il profilo aziendale e carica i documenti</li>
              <li>Il nostro team verifica la documentazione (entro 48h)</li>
              <li>Accedi alla piattaforma e inizia a ricevere richieste</li>
            </ol>
            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Vantaggi per i Fornitori</h2>
            <p className="text-lg text-white/70">
              Accedi a un flusso costante di richieste qualificate, gestisci preventivi e
              comunicazioni in modo centralizzato e ricevi pagamenti tracciati e sicuri.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
