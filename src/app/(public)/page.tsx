import Link from "next/link"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Truck,
  Building2,
  CreditCard,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Preventivi Intelligenti",
    description: "Crea e gestisci preventivi con calcolatori integrati per infissi e edilizia",
  },
  {
    icon: Truck,
    title: "Gestione Fornitori",
    description: "Workflow completo dalla richiesta all'ordine con 9 step tracciati",
  },
  {
    icon: Building2,
    title: "Cantieri sotto Controllo",
    description: "Monitora progressi, team assegnato e fasi di lavorazione in tempo reale",
  },
  {
    icon: CreditCard,
    title: "Pagamenti Automatizzati",
    description: "Gestisci acconti, saldi e piani di pagamento con notifiche automatiche",
  },
  {
    icon: ShieldCheck,
    title: "Certificati & Documenti",
    description: "Archiviazione sicura con alert di scadenza e condivisione controllata",
  },
  {
    icon: MessageSquare,
    title: "Comunicazione Integrata",
    description: "Chat multi-canale tra admin, clienti, fornitori e collaboratori",
  },
]

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    period: "/mese",
    description: "Per iniziare a provare la piattaforma",
    features: ["1 organizzazione", "Fino a 5 utenti", "Funzionalità base", "Supporto email"],
    cta: "Inizia Gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "97",
    period: "/mese",
    description: "Per serramentisti e imprese in crescita",
    features: [
      "Utenti illimitati",
      "White-label base",
      "Tutti i moduli",
      "Chat integrata",
      "Calcolatore edilizia",
      "Supporto prioritario",
    ],
    cta: "Scegli Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Soluzione su misura per grandi aziende",
    features: [
      "White-label completo",
      "Custom domain",
      "API access",
      "SLA garantito",
      "Supporto dedicato",
      "Formazione inclusa",
    ],
    cta: "Contattaci",
    highlighted: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-kranely-app-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-kranely-app-bg/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">
                Chi Siamo
              </Link>
              <Link href="/services" className="text-sm text-white/60 hover:text-white transition-colors">
                Servizi
              </Link>
              <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">
                Prezzi
              </Link>
              <Link href="/blog" className="text-sm text-white/60 hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/contact" className="text-sm text-white/60 hover:text-white transition-colors">
                Contatti
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <Button variant="ghost">
                  Accedi
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-medium">
                  Inizia Ora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-kranely-accent/5 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-kranely-accent/10 border border-kranely-accent/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-kranely-accent animate-pulse" />
            <span className="text-sm text-kranely-accent font-medium">Piattaforma SaaS per Serramentisti</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            La piattaforma che{" "}
            <span className="text-kranely-accent">trasforma</span>
            <br />
            il tuo business
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Gestisci preventivi, fornitori, cantieri e pagamenti in un unico posto.
            Dalla richiesta alla consegna, tutto sotto controllo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold px-8">
                Inizia Gratis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/20 px-8">
                Richiedi Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tutto ciò che ti serve
            </h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Strumenti potenti progettati per serramentisti e imprese edili
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-kranely-accent/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-kranely-accent/10 flex items-center justify-center mb-4 group-hover:bg-kranely-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-kranely-accent" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-32 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Piani Semplici e Trasparenti
            </h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Scegli il piano perfetto per la tua azienda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-xl border transition-all duration-300 ${
                  plan.highlighted
                    ? "border-kranely-accent/50 bg-kranely-accent/5"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-kranely-accent text-kranely-app-bg text-xs font-semibold rounded-full">
                    Più Popolare
                  </div>
                )}
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-white/60 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price !== "Custom" && "€"}{plan.price}
                  </span>
                  <span className="text-white/60">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-kranely-accent flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto a trasformare il tuo business?
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Unisciti a centinaia di serramentisti che hanno già scelto Kranely
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold px-8">
              Inizia Gratis Oggi
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-white/40 hover:text-white/60 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-white/40 hover:text-white/60 transition-colors">
                Termini
              </Link>
              <Link href="/cookie" className="text-sm text-white/40 hover:text-white/60 transition-colors">
                Cookie
              </Link>
            </div>
            <p className="text-sm text-white/40">
              &copy; {new Date().getFullYear()} Kranely. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
