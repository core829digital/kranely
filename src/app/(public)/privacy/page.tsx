import { Logo } from "@/components/Logo"

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-white/70 mb-6">
              Questa pagina descrive come Kranely raccoglie, utilizza e protegge i tuoi dati personali.
            </p>
            <h2 className="text-2xl font-semibold text-white mb-4">Tipi di Dati Raccolti</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60 mb-6">
              <li>Dati di contatto (nome, email, telefono)</li>
              <li>Dati di navigazione (IP, cookie, log)</li>
              <li>Dati di utilizzo del servizio</li>
            </ul>
            <h2 className="text-2xl font-semibold text-white mb-4">Utilizzo dei Dati</h2>
            <p className="text-lg text-white/70 mb-6">
              I tuoi dati vengono utilizzati per fornire i nostri servizi, migliorare l&apos;esperienza utente e inviare comunicazioni di marketing con il tuo consenso.
            </p>
            <h2 className="text-2xl font-semibold text-white mb-4">Condivisione dei Dati</h2>
            <p className="text-lg text-white/70 mb-6">
              Non condividiamo i tuoi dati con terze parti senza il tuo consenso, salvo obblighi di legge.
            </p>
            <h2 className="text-2xl font-semibold text-white mb-4">Sicurezza</h2>
            <p className="text-lg text-white/70 mb-6">
              Utilizziamo misure di sicurezza standard per proteggere i tuoi dati.
            </p>
            <h2 className="text-2xl font-semibold text-white mb-4">Contatti</h2>
            <p className="text-lg text-white/70 mb-6">
              Per domande sulla privacy, contattaci all&apos;indirizzo <a href="mailto:privacy@kranely.it" className="text-kranely-accent">privacy@kranely.it</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
