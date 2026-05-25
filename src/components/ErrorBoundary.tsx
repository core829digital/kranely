"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Qualcosa è andato storto</h2>
          <p className="text-white/60 mb-6 max-w-md">
            Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
          </p>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Ricarica pagina
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
