"use client"

import { useState } from "react"
import { PublicNav } from "@/components/PublicNav"
import { PublicFooter } from "@/components/PublicFooter"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Star, Send, CheckCircle, Loader2 } from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { toast } from "sonner"

export default function ReviewsPage() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", company: "", text: "", rating: 5 })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const reviews = useQuery(api.reviews.listPublic)

  const submitReview = useMutation(api.reviews.submit)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.text || formData.text.length < 10) {
      toast.error("Inserisci nome e una recensione di almeno 10 caratteri")
      return
    }
    setSubmitting(true)
    try {
      await submitReview({
        organizationId: "admin" as any,
        name: formData.name,
        email: formData.email || undefined,
        company: formData.company || undefined,
        text: formData.text,
        rating: formData.rating,
      })
      setSubmitted(true)
      setFormData({ name: "", email: "", company: "", text: "", rating: 5 })
      toast.success("Recensione inviata! Sarà pubblicata dopo l'approvazione.")
    } catch (err: any) {
      toast.error(err.message || "Errore invio recensione")
    } finally {
      setSubmitting(false)
    }
  }

  const reviewList = reviews || []

  const avgRating = reviewList.length > 0
    ? (reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length).toFixed(1)
    : "0.0"

  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main id="main-content" className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white">Recensioni</h1>
              <p className="text-lg text-white/70 mt-2">
                Cosa dicono i nostri clienti della piattaforma Kranely.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold text-kranely-accent">{avgRating}</p>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3 h-3 ${parseFloat(avgRating) >= s ? "text-kranely-accent" : "text-white/20"}`} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-white/40">{reviewList.length} recensioni</p>
              </div>
              <Button onClick={() => setShowForm(!showForm)} className="bg-kranely-accent text-kranely-app-bg">
                {showForm ? "Chiudi" : "Scrivi Recensione"}
              </Button>
            </div>
          </div>

          {showForm && (
            <div className="mb-8 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-lg font-semibold text-white mb-4">Condividi la tua esperienza</h2>
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-white font-medium">Recensione inviata con successo!</p>
                  <p className="text-white/60 text-sm mt-1">Sarà pubblicata dopo l&apos;approvazione del nostro team.</p>
                  <Button onClick={() => { setSubmitted(false); setShowForm(false) }} variant="outline" className="mt-4 border-white/10">OK</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-white/50">Valutazione</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setFormData({ ...formData, rating: s })}>
                          <Star className={`w-6 h-6 ${s <= formData.rating ? "text-kranely-accent" : "text-white/20"}`} fill={s <= formData.rating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50">Nome *</label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Il tuo nome" required />
                    </div>
                    <div>
                      <label className="text-xs text-white/50">Azienda</label>
                      <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="La tua azienda (opzionale)" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50">Email (non pubblicata)</label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@esempio.it (opzionale)" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50">Recensione *</label>
                    <Textarea value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} rows={4} placeholder="Raccontaci la tua esperienza con Kranely..." required />
                  </div>
                  <Button type="submit" disabled={submitting} className="bg-kranely-accent text-kranely-app-bg">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {submitting ? "Invio in corso..." : "Invia Recensione"}
                  </Button>
                </form>
              )}
            </div>
          )}

          {reviewList.length === 0 ? (
            <div className="text-center py-16">
              <Star className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 text-lg">Ancora nessuna recensione.</p>
              <p className="text-white/30 text-sm mt-1">Sii il primo a condividere la tua esperienza!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviewList.map((review) => (
                <article key={review._id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex items-center gap-1 mb-3" role="img" aria-label={`${review.rating} stelle su 5`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} className={`w-5 h-5 ${j < review.rating ? "text-kranely-accent" : "text-white/20"}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="text-white/80 text-sm mb-4">&ldquo;{review.text}&rdquo;</blockquote>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-white font-medium text-sm">{review.name}</p>
                    {review.company && <p className="text-white/40 text-xs">{review.company}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}