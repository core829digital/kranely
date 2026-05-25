export default function BlogPostPage({ params }: { params: { slug: string } }) {
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
            <a href="/blog" className="text-sm text-white/60 hover:text-white transition-colors">Torna al Blog</a>
          </div>
        </div>
      </nav>
      <div className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Articolo: {params.slug}</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-white/60">Contenuto dell&apos;articolo in arrivo...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
