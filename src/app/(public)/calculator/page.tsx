"use client"

import { Logo } from "@/components/Logo"
import { useState } from "react"

export default function CalculatorPage() {
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [result, setResult] = useState<number | null>(null)

  const calculateVolume = (e: React.FormEvent) => {
    e.preventDefault()
    const l = parseFloat(length)
    const w = parseFloat(width)
    const h = parseFloat(height)
    if (l > 0 && w > 0 && h > 0) {
      setResult(l * w * h)
    }
  }

  return (
    <div className="min-h-screen bg-kranely-app-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-kranely-app-bg/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <Logo />
            </a>
            <a href="/" className="text-sm text-white/60 hover:text-white transition-colors">Torna alla Home</a>
          </div>
        </div>
      </nav>
      <div className="pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-4">Calcolatore Volumi</h1>
          <p className="text-lg text-white/70 mb-8">
            Inserisci le dimensioni per calcolare il volume in metri cubi (m³).
          </p>
          <form onSubmit={calculateVolume} className="bg-white/5 rounded-lg p-8 border border-white/10">
            <div className="space-y-5 mb-8">
              <div>
                <label htmlFor="length" className="block text-sm font-medium text-white mb-1">
                  Lunghezza (m)
                </label>
                <input
                  id="length"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="es. 3.50"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30"
                />
              </div>
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-white mb-1">
                  Larghezza (m)
                </label>
                <input
                  id="width"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="es. 2.00"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30"
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-white mb-1">
                  Altezza (m)
                </label>
                <input
                  id="height"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="es. 2.70"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-kranely-accent px-4 py-3 text-sm font-semibold text-kranely-app-bg hover:bg-kranely-accent/90 transition-colors"
            >
              Calcola Volume
            </button>
          </form>
          {result !== null && (
            <div className="mt-8 bg-white/5 rounded-lg p-6 border border-white/10 text-center">
              <p className="text-sm text-white/60 mb-1">Volume calcolato</p>
              <p className="text-4xl font-bold text-kranely-accent">{result.toFixed(2)} <span className="text-xl">m³</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
