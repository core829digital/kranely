import { Logo } from "@/components/Logo"

export default function ServicesPage() {
  const services = [
    { title: "Gestione Preventivi", desc: "Calcolatori integrati per infissi e edilizia con preventivi professionali automatici" },
    { title: "Gestione Fornitori", desc: "Workflow completo dalla richiesta all'ordine con 9 step tracciati e controproposte" },
    { title: "Monitoraggio Cantieri", desc: "Dashboard cantieri con progressi, team assegnato e fasi di lavorazione" },
    { title: "Pagamenti Automatizzati", desc: "Gestione acconti, saldi, piani di pagamento con notifiche e solleciti automatici" },
    { title: "Certificati e Documenti", desc: "Archiviazione sicura con alert di scadenza e condivisione controllata" },
    { title: "Comunicazione Integrata", desc: "Chat multi-canale tra admin, clienti, fornitori e collaboratori" },
    { title: "White-Label", desc: "Personalizzazione completa del branding per rivenditori e distributori" },
    { title: "Calcolatore Edilizia", desc: "Stima costi di ristrutturazione basata su MQ, zona, tipo e stato dell'immobile" },
  ]
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
          <h1 className="text-4xl font-bold text-white mb-4">Servizi</h1>
          <p className="text-lg text-white/60 mb-12 max-w-2xl">Tutto ciò che serve per gestire la tua azienda di serramenti o edilizia</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
