"use client"

import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import Link from "next/link"
import { PublicNav } from "@/components/PublicNav"
import { Calendar, Clock, ArrowRight } from "lucide-react"

export default function BlogPage() {
  const posts = useQuery(api.blog.listPublished, {})

  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-white mb-4">Blog</h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">Novità, guide e approfondimenti dal mondo Kranely</p>
          </div>

          {posts === undefined ? (
            <div className="flex justify-center" role="status" aria-label="Caricamento articoli">
              <div className="w-8 h-8 border-2 border-kranely-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center text-white/40"><p>Nessun articolo ancora pubblicato</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map((post) => (
                <Link key={post._id} href={`/blog/${post.slug}`} className="group p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:border-kranely-accent/30 transition-all">
                  <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-kranely-accent">{post.category}</span>
                    {post.publishedDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden="true" />{new Date(post.publishedDate).toLocaleDateString("it-IT")}</span>}
                    {post.readTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" />{post.readTime} min</span>}
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-kranely-accent transition-colors">{post.title}</h2>
                  <p className="text-sm text-white/60 mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">{post.authorName}</span>
                    <ArrowRight className="w-4 h-4 text-kranely-accent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
