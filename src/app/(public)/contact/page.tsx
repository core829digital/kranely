"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { PublicNav } from "@/components/PublicNav"
import { Mail, Loader2 } from "lucide-react"
import { useState } from "react"

export default function ContactPage() {
  const [isSending, setIsSending] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })
      if (!res.ok) throw new Error("Errore invio")
      toast.success("Messaggio inviato! Grazie per averci contattato.")
      setName("")
      setEmail("")
      setMessage("")
    } catch {
      toast.error("Impossibile inviare il messaggio. Riprova o scrivici a info@kranely.it")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main id="main-content" className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Contattaci</h1>
          <p className="text-lg text-white/70 mb-8 max-w-2xl">
            Hai domande? Vuoi un preventivo su misura? Compila il form qui sotto e ti ricontatteremo al più presto.
          </p>

          <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white/5 px-8 py-10 rounded-lg border border-white/10">
            <div className="space-y-4 mb-8">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-white mb-1">Nome completo</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mario Rossi" required autoComplete="name" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" />
              </div>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-white mb-1">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mario@example.com" required autoComplete="email" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" />
              </div>
              <div>
                <Label htmlFor="message" className="block text-sm font-medium text-white mb-1">Messaggio</Label>
                <textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descrivi la tua richiesta..." required className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none" />
              </div>
            </div>
            <Button type="submit" disabled={isSending} className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold disabled:opacity-60">
              {isSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Invio...</> : <><Mail className="w-4 h-4 mr-2" />Invia</>}
            </Button>
            <p className="text-xs text-white/40 text-center mt-4">oppure scrivi a <a href="mailto:info@kranely.it" className="text-kranely-accent hover:underline">info@kranely.it</a></p>
          </form>
        </div>
      </main>
    </div>
  )
}
