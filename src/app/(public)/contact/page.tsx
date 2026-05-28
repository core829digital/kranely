"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"

export default function ContactPage() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: send to backend API (Resend will be added later)
    toast.success('Messaggio inviato! Grazie per averci contattato.');
  };

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Contattaci</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-white/70 mb-6">
              Hai domande? Vuoi un preventivo su misura? Compila il form qui sotto e ti ricontatteremo al più presto.
            </p>

            <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white/5 px-8 py-10 rounded-lg">
              <div className="space-y-4 mb-8">
                <Label htmlFor="name" className="block text-sm font-medium text-white">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Mario Rossi"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                />

                <Label htmlFor="email" className="block text-sm font-medium text-white mt-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mario@example.com"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                />

                <Label htmlFor="message" className="block text-sm font-medium text-white mt-2">
                  Messaggio
                </Label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Describe la tua richiesta..."
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold"
              >
                Invia
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
