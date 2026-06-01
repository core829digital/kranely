import Link from "next/link"
import { Logo } from "@/components/Logo"

export function PublicFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-white/10 py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/privacy" className="text-sm text-white/40 hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-white/40 hover:text-white/60 transition-colors">Termini</Link>
            <Link href="/cookie" className="text-sm text-white/40 hover:text-white/60 transition-colors">Cookie</Link>
            <Link href="/contact" className="text-sm text-white/40 hover:text-white/60 transition-colors">Contatti</Link>
          </div>
          <p className="text-sm text-white/40">&copy; {year} Kranely. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  )
}
