"use client"

import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { PublicNav } from "@/components/PublicNav"

const plans = [
  { name: "Free", price: "0", period: "/mese", features: ["1 organizzazione", "Fino a 5 utenti", "Funzionalità base", "Supporto email"], cta: "Inizia Gratis", planId: null as null | "pro" | "enterprise" },
  { name: "Pro", price: "97", period: "/mese", features: ["Utenti illimitati", "White-label base", "Tutti i moduli", "Chat integrata", "Calcolatore edilizia", "Supporto prioritario"], cta: "Scegli Pro", highlighted: true, planId: "pro" as const },
  { name: "Enterprise", price: "Custom", period: "", features: ["White-label completo", "Custom domain", "API access", "SLA garantito", "Supporto dedicato", "Formazione inclusa"], cta: "Contattaci", planId: "enterprise" as const },
]

export default function PricingPage() {
  const { user } = useAuth()
  const createCheckout = useMutation(api.stripe.createCheckoutSession)

  const handleSubscribe = async (planId: "pro" | "enterprise") => {
    if (!user?.email || !user?.organizationId) {
      window.location.href = "/sign-up"
      return
    }
    try {
      const { url } = await createCheckout({
        organizationId: user.organizationId as any,
        plan: planId,
        email: user.email,
        returnUrl: window.location.origin + "/pricing",
      })
      window.location.href = url
    } catch (err: any) {
      toast.error(err.data || "Errore durante l'attivazione")
    }
  }

  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main id="main-content" className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-white mb-4">Piani e Prezzi</h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">Scegli il piano perfetto per la tua azienda</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`p-8 rounded-xl border ${plan.highlighted ? "border-kranely-accent/50 bg-kranely-accent/5" : "border-white/10 bg-white/[0.02]"}`}>
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="mb-6"><span className="text-4xl font-bold text-white">{plan.price !== "Custom" && "€"}{plan.price}</span><span className="text-white/60">{plan.period}</span></div>
                <ul className="space-y-3 mb-8">{plan.features.map((f, i) => (<li key={i} className="flex items-start gap-2 text-sm text-white/80"><CheckCircle2 className="w-4 h-4 text-kranely-accent flex-shrink-0 mt-0.5" />{f}</li>))}</ul>
                {plan.planId ? (
                  <Button onClick={() => handleSubscribe(plan.planId!)} className={`w-full ${plan.highlighted ? "bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90" : "bg-white/10 text-white hover:bg-white/20"}`}>{plan.cta}</Button>
                ) : (
                  <Link href="/sign-up" className="block"><Button className="w-full bg-white/10 text-white hover:bg-white/20">{plan.cta}</Button></Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
