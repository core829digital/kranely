"use client"

import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import Link from "next/link"
import { Logo } from "@/components/Logo"

const fallbackPosts: Record<string, { title: string; date: string; category: string; content: string }> = {
  "guida-serramenti-pvc": {
    title: "Guida alla Scelta dei Serramenti in PVC",
    date: "12 Mar 2026",
    category: "Guide",
    content: "I serramenti in PVC rappresentano una delle scelte più apprezzate nel mercato dell'edilizia moderna. Offrono un eccellente isolamento termico e acustico, richiedono poca manutenzione e hanno un ottimo rapporto qualità-prezzo. In questa guida analizziamo i fattori chiave da considerare: il tipo di profilato, la qualità delle guarnizioni, la tipologia di vetrocamera e la classe energetica. Scegliere il giusto serramento può ridurre significativamente i consumi energetici e migliorare il comfort abitativo."
  },
  "preventivo-edile-digitale": {
    title: "Come Digitalizzare i Preventivi Edili",
    date: "28 Feb 2026",
    category: "Tecnologia",
    content: "La digitalizzazione dei preventivi edili non è più un'opzione ma una necessità per rimanere competitivi. Con Kranely puoi creare, inviare e gestire preventivi in formato digitale, riducendo i tempi di elaborazione e minimizzando gli errori. Il sistema permette di allegare documenti tecnici, specifiche dei materiali e immagini, offrendo al cliente un quadro completo e professionale. Scopri come trasformare il tuo flusso di lavoro."
  },
  "manutenzione-infissi": {
    title: "Manutenzione Infissi: Consigli Pratici",
    date: "15 Feb 2026",
    category: "Manutenzione",
    content: "Una corretta manutenzione degli infissi è essenziale per garantirne la durata e l'efficienza nel tempo. La pulizia periodica delle guarnizioni, la lubrificazione delle cerniere e il controllo della tenuta sono operazioni semplici che possono prevenire problemi più seri."
  },
  "agevolazioni-fiscali-edilizia": {
    title: "Agevolazioni Fiscali per l'Edilizia 2026",
    date: "5 Gen 2026",
    category: "Normative",
    content: "Il 2026 porta con sé importanti novità in materia di agevolazioni fiscali per il settore edile. Il bonus ristrutturazioni, l'ecobonus e il superbonus sono stati riconfermati con alcune modifiche. Le detrazioni variano dal 50% al 65% a seconda del tipo di intervento."
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const dbPost = useQuery(api.blog.getBySlug, { slug: params.slug })
  const fallback = fallbackPosts[params.slug]

  const post = dbPost ?? fallback
  const title = post?.title ?? "Articolo non trovato"

  return (
    <div className="min-h-screen bg-kranely-app-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-kranely-app-bg/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <Link href="/blog" className="text-sm text-white/60 hover:text-white transition-colors">Torna al Blog</Link>
          </div>
        </div>
      </nav>
      <div className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {post ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-medium text-kranely-accent bg-kranely-accent/10 px-2 py-1 rounded">{post.category}</span>
                <span className="text-xs text-white/40">{"publishedDate" in post ? new Date(post.publishedDate ?? "").toLocaleDateString("it-IT") : (post as any).date}</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-8">{post.title}</h1>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-white/70 leading-relaxed">{post.content}</p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-white mb-8">Articolo non trovato</h1>
              <p className="text-white/60">Il contenuto richiesto non è disponibile.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
