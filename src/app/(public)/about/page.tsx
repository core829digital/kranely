export default function AboutPage() {
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
      </div>
    </div>
  )
}
