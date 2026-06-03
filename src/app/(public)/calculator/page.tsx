"use client"

import { useState } from "react"
import { PublicNav } from "@/components/PublicNav"
import { Calculator, Ruler, Home, Maximize } from "lucide-react"

const CALC_TYPES = [
  { id: "volume", name: "Volume", icon: Maximize, description: "Calcola volume in m³ di un ambiente" },
  { id: "pavimento", name: "Pavimentazione", icon: Ruler, description: "Costo pavimento (parquet, marmo, resina, piastrelle)" },
  { id: "intonaco", name: "Pittura/Intonaco", icon: Home, description: "Costo pittura/mq per pareti e soffitto" },
  { id: "tramezzi", name: "Tramezzi", icon: Home, description: "Costo costruzione tramezzi interni" },
  { id: "infissi", name: "Infissi", icon: Home, description: "Costo porte e finestre" },
  { id: "bagni", name: "Bagni", icon: Home, description: "Costo realizzazione bagno" },
  { id: "ristrutturazione", name: "Ristrutturazione", icon: Home, description: "Stima completa ristrutturazione" },
]

const FINISHING_OPTIONS = [
  { id: "standard", name: "Standard", multiplier: 1.0 },
  { id: "media", name: "Media qualità", multiplier: 1.3 },
  { id: "alta", name: "Alta qualità", multiplier: 1.8 },
]

const AREA_OPTIONS = [
  { id: "nord", name: "Nord Italia", multiplier: 1.1 },
  { id: "centro", name: "Centro Italia", multiplier: 1.0 },
  { id: "sud", name: "Sud Italia", multiplier: 0.85 },
]

const PROPERTY_TYPES = [
  { id: "appartamento", name: "Appartamento", multiplier: 1.0 },
  { id: "villa", name: "Villa", multiplier: 1.2 },
  { id: "casale", name: "Casale/Rustico", multiplier: 0.9 },
]

const FLOORING_TYPES = [
  { id: "parquet", name: "Parquet", pricePerMq: 45 },
  { id: "marmo", name: "Marmo", pricePerMq: 80 },
  { id: "monocottura", name: "Monocottura/Gres", pricePerMq: 25 },
  { id: "resina", name: "Resina", pricePerMq: 35 },
]

const WALL_TYPES = [
  { id: "20", name: "Tramezzo 20cm", pricePerMq: 55 },
  { id: "50", name: "Tramezzo 50cm", pricePerMq: 85 },
  { id: "100", name: "Tramezzo 100cm", pricePerMq: 130 },
]

const PAINT_QUALITY = [
  { id: "standard", name: "Pittura standard", pricePerMq: 8 },
  { id: "premium", name: "Pittura premium", pricePerMq: 14 },
  { id: "decorativa", name: "Pittura decorativa", pricePerMq: 22 },
]

export default function CalculatorPage() {
  const [calcType, setCalcType] = useState("volume")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [area, setArea] = useState("centro")
  const [finishing, setFinishing] = useState("standard")
  const [propertyType, setPropertyType] = useState("appartamento")
  const [flooring, setFlooring] = useState("parquet")
  const [wallType, setWallType] = useState("20")
  const [paintQuality, setPaintQuality] = useState("standard")
  const [hasControsoffitto, setHasControsoffitto] = useState(false)
  const [bathroomCount, setBathroomCount] = useState("1")
  const [result, setResult] = useState<{ label: string; value: number; unit: string }[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getMultiplier = (id: string, options: { id: string; multiplier: number }[]) =>
    options.find((o) => o.id === id)?.multiplier || 1

  const calculate = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const l = parseFloat(length)
    const w = parseFloat(width)
    const h = parseFloat(height)
    const qty = Math.max(1, parseInt(quantity) || 1)
    const areaMult = getMultiplier(area, AREA_OPTIONS)
    const finishMult = getMultiplier(finishing, FINISHING_OPTIONS)
    const propMult = getMultiplier(propertyType, PROPERTY_TYPES)

    const sqm = l * w
    const volume = sqm * h
    const wallArea = 2 * (l + w) * h

    let results: { label: string; value: number; unit: string }[] = []

    switch (calcType) {
      case "volume": {
        results = [
          { label: "Volume", value: volume, unit: "m³" },
          { label: "Superficie", value: sqm, unit: "m²" },
          { label: "Superficie pareti", value: wallArea, unit: "m²" },
          { label: "Perimetro", value: 2 * (l + w), unit: "m" },
        ]
        break
      }
      case "pavimento": {
        const floor = FLOORING_TYPES.find((f) => f.id === flooring)
        const basePrice = floor?.pricePerMq || 25
        const totalPrice = sqm * basePrice * areaMult * finishMult
        results = [
          { label: "Superficie pavimento", value: sqm, unit: "m²" },
          { label: `Costo ${floor?.name || "pavimento"}`, value: totalPrice, unit: "EUR" },
          { label: "Costo al m²", value: basePrice * areaMult * finishMult, unit: "EUR/m²" },
        ]
        break
      }
      case "intonaco": {
        const paint = PAINT_QUALITY.find((p) => p.id === paintQuality)
        const paintPrice = paint?.pricePerMq || 8
        const ceilingArea = hasControsoffitto ? sqm * 1.4 : sqm
        const totalWallArea = wallArea + ceilingArea
        const totalPrice = totalWallArea * paintPrice * areaMult
        results = [
          { label: "Superficie totale da pitturare", value: totalWallArea, unit: "m²" },
          { label: `Costo ${paint?.name || "pittura"}`, value: totalPrice, unit: "EUR" },
          { label: "Costo al m²", value: paintPrice * areaMult, unit: "EUR/m²" },
        ]
        break
      }
      case "tramezzi": {
        const wall = WALL_TYPES.find((w) => w.id === wallType)
        const wallPrice = wall?.pricePerMq || 55
        const totalLength = l + w
        const wallSqm = totalLength * h * qty
        const totalPrice = wallSqm * wallPrice * areaMult
        results = [
          { label: "Lunghezza tramezzi", value: totalLength * qty, unit: "m" },
          { label: "Superficie tramezzi", value: wallSqm, unit: "m²" },
          { label: `Costo ${wall?.name || "tramezzo"}`, value: totalPrice, unit: "EUR" },
        ]
        break
      }
      case "infissi": {
        const windowPrice = 650 * areaMult
        const doorPrice = 450 * areaMult
        const windowCount = Math.ceil(qty / 2)
        const doorCount = Math.ceil(qty / 2)
        const totalPrice = windowCount * windowPrice + doorCount * doorPrice
        results = [
          { label: "Finestre", value: windowCount, unit: "pz" },
          { label: "Porte interne", value: doorCount, unit: "pz" },
          { label: "Costo finestre", value: windowCount * windowPrice, unit: "EUR" },
          { label: "Costo porte", value: doorCount * doorPrice, unit: "EUR" },
          { label: "Totale infissi", value: totalPrice, unit: "EUR" },
        ]
        break
      }
      case "bagni": {
        const bathCount = parseInt(bathroomCount) || 1
        const baseBathPrice = 3500 * areaMult * finishMult
        const totalPrice = bathCount * baseBathPrice
        results = [
          { label: "Numero bagni", value: bathCount, unit: "pz" },
          { label: "Costo base per bagno", value: baseBathPrice, unit: "EUR" },
          { label: "Totale bagni", value: totalPrice, unit: "EUR" },
        ]
        break
      }
      case "ristrutturazione": {
        const baseRenovation = 400 * areaMult * propMult * finishMult
        const demolitionCost = 25 * sqm
        const flooringCost = sqm * 35 * finishMult
        const paintingCost = wallArea * 10
        const bathroomRenovation = 3500 * areaMult
        const electricalCost = sqm * 30
        const plumbingCost = sqm * 25
        const totalPrice = sqm * baseRenovation + demolitionCost + flooringCost + paintingCost + bathroomRenovation + electricalCost + plumbingCost
        results = [
          { label: "Superficie", value: sqm, unit: "m²" },
          { label: "Demolizioni", value: demolitionCost, unit: "EUR" },
          { label: "Pavimentazione", value: flooringCost, unit: "EUR" },
          { label: "Pittura/Intonaco", value: paintingCost, unit: "EUR" },
          { label: "Impianto elettrico", value: electricalCost, unit: "EUR" },
          { label: "Impianto idraulico", value: plumbingCost, unit: "EUR" },
          { label: "Ristrutturazione bagno", value: bathroomRenovation, unit: "EUR" },
          { label: "Costo base al m²", value: baseRenovation, unit: "EUR/m²" },
          { label: "Stima totale", value: totalPrice, unit: "EUR" },
        ]
        break
      }
    }

    if (results.length > 0 && (l <= 0 || w <= 0)) {
      setError("Inserisci lunghezza e larghezza positive")
      setResult(null)
      return
    }

    setResult(results)
  }

  return (
    <div className="min-h-screen bg-kranely-app-bg flex flex-col">
      <PublicNav />
      <main id="main-content" className="flex-1 pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-2">Calcolatore Edile</h1>
          <p className="text-lg text-white/70 mb-6">
            Calcola costi di ristrutturazione, pavimentazione, tramezzi e volumi per i tuoi progetti edili.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
            {CALC_TYPES.map((ct) => (
              <button
                key={ct.id}
                onClick={() => { setCalcType(ct.id); setResult(null); setError(null) }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  calcType === ct.id
                    ? "border-kranely-accent bg-kranely-accent/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <ct.icon className={`w-5 h-5 mb-2 ${calcType === ct.id ? "text-kranely-accent" : "text-white/40"}`} />
                <h3 className="text-sm font-medium text-white">{ct.name}</h3>
                <p className="text-[10px] text-white/40 leading-tight mt-1">{ct.description}</p>
              </button>
            ))}
          </div>

          <form onSubmit={calculate} className="bg-white/5 rounded-xl p-6 border border-white/10" aria-label="Calcolatore edile">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Lunghezza (m)</label>
                <input type="number" step="0.01" min="0" placeholder="es. 6.00" value={length} onChange={(e) => setLength(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Larghezza (m)</label>
                <input type="number" step="0.01" min="0" placeholder="es. 4.00" value={width} onChange={(e) => setWidth(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50" />
              </div>
              {calcType !== "bagni" && calcType !== "infissi" && (
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Altezza (m)</label>
                  <input type="number" step="0.01" min="0" placeholder="es. 2.70" value={height} onChange={(e) => setHeight(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50" />
                </div>
              )}
              {(calcType === "tramezzi" || calcType === "infissi" || calcType === "bagni") && (
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    {calcType === "tramezzi" ? "Numero tramezzi" : calcType === "infissi" ? "Numero ambienti" : "Numero bagni"}
                  </label>
                  <input type="number" min="1" placeholder="1" value={calcType === "bagni" ? bathroomCount : quantity} onChange={(e) => calcType === "bagni" ? setBathroomCount(e.target.value) : setQuantity(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kranely-accent/50" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs text-white/50 mb-1">Zona geografica</label>
                <select value={area} onChange={(e) => setArea(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                  {AREA_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Tipo finitura</label>
                <select value={finishing} onChange={(e) => setFinishing(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                  {FINISHING_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Tipo immobile</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                  {PROPERTY_TYPES.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              {calcType === "pavimento" && (
                <div>
                  <label className="block text-xs text-white/50 mb-1">Materiale pavimento</label>
                  <select value={flooring} onChange={(e) => setFlooring(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                    {FLOORING_TYPES.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}
              {calcType === "tramezzi" && (
                <div>
                  <label className="block text-xs text-white/50 mb-1">Tipo tramezzo</label>
                  <select value={wallType} onChange={(e) => setWallType(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                    {WALL_TYPES.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}
              {calcType === "intonaco" && (
                <div>
                  <label className="block text-xs text-white/50 mb-1">Tipo pittura</label>
                  <select value={paintQuality} onChange={(e) => setPaintQuality(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                    {PAINT_QUALITY.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}
              {calcType === "intonaco" && (
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="controsoffitto" checked={hasControsoffitto} onChange={(e) => setHasControsoffitto(e.target.checked)} className="rounded border-white/20" />
                  <label htmlFor="controsoffitto" className="text-xs text-white/60">Controsoffitto</label>
                </div>
              )}
            </div>

            {error && <p role="alert" className="text-sm text-red-400 mb-4">{error}</p>}

            <button type="submit" className="w-full rounded-lg bg-kranely-accent px-4 py-3 text-sm font-semibold text-kranely-app-bg hover:bg-kranely-accent/90 transition-colors inline-flex items-center justify-center gap-2">
              <Calculator className="w-4 h-4" /> Calcola
            </button>
          </form>

          {result && result.length > 0 && (
            <div role="status" aria-live="polite" className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Risultati</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.map((r, i) => (
                  <div key={i} className={`p-4 rounded-lg ${r.label.includes("totale") || r.label.includes("Totale") || r.label.includes("Stima") ? "bg-kranely-accent/10 border border-kranely-accent/20" : "bg-white/[0.03] border border-white/5"}`}>
                    <p className="text-xs text-white/50 mb-1">{r.label}</p>
                    <p className={`text-2xl font-bold ${r.label.includes("totale") || r.label.includes("Totale") || r.label.includes("Stima") ? "text-kranely-accent" : "text-white"}`}>
                      {r.unit === "EUR" ? `EUR${r.value.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `${r.value.toFixed(2)}`}
                      <span className="text-sm font-normal text-white/40 ml-1">{r.unit !== "EUR" ? r.unit : ""}</span>
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/30 mt-4 text-center">
                I costi sono indicativi e basati su prezzi medi di mercato. Per un preventivo preciso, contatta i nostri professionisti.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}