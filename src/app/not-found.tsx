import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export const metadata = {
  title: "Pagina non trovata",
  description: "La pagina che stai cercando non esiste o è stata spostata.",
}

export default function NotFound() {
  return (
    <html lang="it">
      <body className="bg-kranely-app-bg text-white antialiased">
        <main id="main-content" className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-7xl font-bold text-kranely-accent mb-2">404</p>
            <h1 className="text-2xl md:text-3xl font-semibold mb-3">Pagina non trovata</h1>
            <p className="text-white/70 mb-8">
              La pagina che stai cercando non esiste, è stata spostata o non hai i permessi per accedervi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                  Torna alla home
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">
                  <Search className="w-4 h-4 mr-2" aria-hidden="true" />
                  Contattaci
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
