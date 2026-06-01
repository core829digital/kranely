import Link from "next/link"
import { Logo } from "@/components/Logo"
import { ArrowLeft } from "lucide-react"

type PublicNavProps = {
  backLabel?: string
  backHref?: string
  variant?: "marketing" | "minimal"
}

export function PublicNav({ backLabel = "Torna alla Home", backHref = "/", variant = "minimal" }: PublicNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-kranely-app-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="Kranely - Home" className="flex items-center gap-2">
            <Logo />
          </Link>
          {variant === "marketing" ? (
            <div className="hidden md:flex items-center gap-8">
              <Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">Chi Siamo</Link>
              <Link href="/services" className="text-sm text-white/60 hover:text-white transition-colors">Servizi</Link>
              <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">Prezzi</Link>
              <Link href="/blog" className="text-sm text-white/60 hover:text-white transition-colors">Blog</Link>
              <Link href="/contact" className="text-sm text-white/60 hover:text-white transition-colors">Contatti</Link>
            </div>
          ) : (
            <Link href={backHref} className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
