export default function RentYourAppPage() {
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
      </div>
    </div>
  )
}
