import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import InfoTooltip from '@/components/ui/InfoTooltip';
import AISuggestions from './AISuggestions';
import ComparativeAnalysis from './ComparativeAnalysis';
import { base44 } from '@/api/base44Client';
import {
  Home,
  Ruler,
  BedDouble,
  Bath,
  Sparkles,
  Paintbrush,
  Plug,
  Droplets,
  Wind,
  Flame,
  Shield,
  Star
} from 'lucide-react';

const PROPERTY_TYPES = [
  { id: 'appartamento', name: 'Appartamento', basePrice: 585 },
  { id: 'villa', name: 'Villa', basePrice: 675 },
  { id: 'ufficio', name: 'Ufficio', basePrice: 520 },
  { id: 'locale_commerciale', name: 'Locale Commerciale', basePrice: 470 }
];

const QUALITY_LEVELS = [
  {
    id: 'standard',
    name: 'Standard',
    multiplier: 1,
    description: 'Materiali di buona qualità, finiture essenziali'
  },
  {
    id: 'premium',
    name: 'Premium',
    multiplier: 1.4,
    description: 'Materiali pregiati, finiture di alta qualità'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    multiplier: 2,
    description: 'Materiali top di gamma, finiture su misura'
  }
];

const SERVICES = [
  {
    id: 'demolizioni',
    name: 'Demolizioni',
    pricePerSqm: 30,
    icon: Sparkles,
    info: 'Rimozione tramezzi, pavimenti esistenti e intonaci.'
  },
  {
    id: 'impianto_elettrico',
    name: 'Impianto Elettrico',
    pricePerSqm: 75,
    icon: Plug,
    info: 'Nuovo impianto a norma con certificazione.'
  },
  {
    id: 'impianto_idraulico',
    name: 'Impianto Idraulico',
    pricePerSqm: 85,
    icon: Droplets,
    info: 'Tubazioni nuove, sanitari e rubinetteria.'
  },
  {
    id: 'climatizzazione',
    name: 'Climatizzazione',
    pricePerSqm: 68,
    icon: Wind,
    info: 'Impianto di aria condizionata con split.'
  },
  {
    id: 'riscaldamento',
    name: 'Riscaldamento',
    pricePerSqm: 99,
    icon: Flame,
    info: 'Nuovo impianto radiante o tradizionale.'
  },
  {
    id: 'pavimentazione',
    name: 'Pavimentazione',
    pricePerSqm: 58,
    icon: Ruler,
    info: 'Posa pavimenti in ceramica, parquet o resina.'
  },
  {
    id: 'tinteggiatura',
    name: 'Tinteggiatura',
    pricePerSqm: 22,
    icon: Paintbrush,
    info: 'Tinteggiatura pareti e soffitti.'
  },
  {
    id: 'coibentazione',
    name: 'Coibentazione',
    pricePerSqm: 50,
    icon: Shield,
    info: 'Isolamento termico pareti e soffitti.'
  }
];

export default function ProjectCalculator({ onQuoteChange, windowsPrice = 0 }) {
  const [config, setConfig] = useState({
    propertyType: 'appartamento',
    squareMeters: 80,
    rooms: 3,
    bathrooms: 1,
    qualityLevel: 'standard',
    services: ['tinteggiatura']
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [breakdown, setBreakdown] = useState({ base: 0, services: 0, bathrooms: 0, windows: 0, servicesDetail: {} });
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    calculatePrice();
  }, [config, windowsPrice]);

  useEffect(() => {
    if (showAI) {
      generateAISuggestions();
    }
  }, [config, showAI]);

  const calculatePrice = () => {
    const property = PROPERTY_TYPES.find((p) => p.id === config.propertyType);
    const quality = QUALITY_LEVELS.find((q) => q.id === config.qualityLevel);

    let basePrice = property.basePrice * config.squareMeters * quality.multiplier;

    let servicesPrice = 0;
    const servicesBreakdown = {};

    config.services.forEach((serviceId) => {
      const service = SERVICES.find((s) => s.id === serviceId);
      if (service) {
        const price = service.pricePerSqm * config.squareMeters * quality.multiplier;
        servicesPrice += price;
        servicesBreakdown[serviceId] = price;
      }
    });

    const bathroomExtra = config.bathrooms * 3150 * quality.multiplier;

    const total = Math.round(basePrice + servicesPrice + bathroomExtra + windowsPrice);

    setBreakdown({
      base: Math.round(basePrice),
      services: Math.round(servicesPrice),
      bathrooms: Math.round(bathroomExtra),
      windows: windowsPrice,
      servicesDetail: servicesBreakdown
    });

    setTotalPrice(total);
    onQuoteChange?.({
      ...config,
      estimatedPrice: total,
      breakdown
    });
  };

  const toggleService = (serviceId) => {
    setConfig((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const generateAISuggestions = async () => {
    setLoadingAI(true);

    const property = PROPERTY_TYPES.find((p) => p.id === config.propertyType);
    const quality = QUALITY_LEVELS.find((q) => q.id === config.qualityLevel);

    const prompt = `Sei un esperto di ristrutturazioni chiavi in mano per IwHome. Analizza questa configurazione e fornisci suggerimenti professionali in italiano:

Configurazione attuale:
- Tipo immobile: ${property.name}
- Superficie: ${config.squareMeters} m²
- Stanze: ${config.rooms}
- Bagni: ${config.bathrooms}
- Livello qualità: ${quality.name}
- Servizi selezionati: ${config.services.map((s) => SERVICES.find((srv) => srv.id === s)?.name).join(', ')}
- Infissi inclusi: ${windowsPrice > 0 ? 'Sì (€' + windowsPrice + ')' : 'No'}
- Prezzo totale: €${totalPrice}

Fornisci:
1. Una raccomandazione principale (max 2 righe) considerando budget, spazi e qualità
2. Un suggerimento per ottimizzare i costi (max 2 righe)
3. Un suggerimento per migliorare la qualità/funzionalità (max 2 righe)
4. 3 consigli pratici specifici per questo progetto

Genera 2 configurazioni alternative con:
- Nome configurazione
- Descrizione (1 riga)
- Prezzo stimato
- Differenza percentuale
- 2 vantaggi
- 2 svantaggi`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          mainRecommendation: { type: "string" },
          budgetOptimization: { type: "string" },
          qualityUpgrade: { type: "string" },
          tips: { type: "array", items: { type: "string" } },
          alternatives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                price: { type: "number" },
                priceDifference: { type: "number" },
                pros: { type: "array", items: { type: "string" } },
                cons: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    setAiSuggestions(response);
    setAlternatives(response.alternatives || []);
    setLoadingAI(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-[#343a40] to-[#495057] p-6 lg:p-8 border-b border-[#f8f9fa]/10">
        <div className="flex items-center gap-4">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/927932459_icon.png"
            alt="IwHome"
            className="h-14 w-auto"
          />
          <div>
            <h3 className="text-2xl font-medium text-[#f8f9fa]">Progetto Chiavi in Mano</h3>
            <p className="text-[#dee2e6] text-sm">Ristrutturazione completa con tutti i servizi</p>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-8">
        {/* Property Type */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Home size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Tipo di Immobile</Label>
            <InfoTooltip content="Il tipo di immobile influenza la complessità e i costi del progetto." />
          </div>
          <RadioGroup
            value={config.propertyType}
            onValueChange={(value) => setConfig((prev) => ({ ...prev, propertyType: value }))}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {PROPERTY_TYPES.map((type) => (
              <motion.label
                key={type.id}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all backdrop-blur-sm ${config.propertyType === type.id
                  ? 'border-[#f8f9fa] bg-[#f8f9fa]/20'
                  : 'border-[#f8f9fa]/20 hover:border-[#f8f9fa]/40 bg-[#343a40]/50'
                  }`}
              >
                <RadioGroupItem value={type.id} className="sr-only" />
                <span className="font-medium text-[#f8f9fa] text-sm">{type.name}</span>
                <span className="text-xs text-[#f8f9fa] mt-1">da €{type.basePrice}/m²</span>
              </motion.label>
            ))}
          </RadioGroup>
        </div>

        {/* Square Meters */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Ruler size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Superficie (m²)</Label>
            <InfoTooltip content="Superficie calpestabile totale dell'immobile." />
          </div>
          <div className="space-y-3">
            <Slider
              value={[config.squareMeters]}
              onValueChange={([value]) => setConfig((prev) => ({ ...prev, squareMeters: value }))}
              min={30}
              max={500}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-sm text-[#dee2e6]">
              <span>30 m²</span>
              <span className="font-medium text-[#f8f9fa] text-lg">{config.squareMeters} m²</span>
              <span>500 m²</span>
            </div>
          </div>
        </div>

        {/* Rooms & Bathrooms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BedDouble size={18} className="text-[#f8f9fa]" />
              <Label className="text-sm font-medium text-[#f8f9fa]">Stanze</Label>
            </div>
            <div className="space-y-3">
              <Slider
                value={[config.rooms]}
                onValueChange={([value]) => setConfig((prev) => ({ ...prev, rooms: value }))}
                min={1}
                max={10}
                step={1}
                className="py-2"
              />
              <div className="text-center font-medium text-[#f8f9fa]">{config.rooms} stanze</div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bath size={18} className="text-[#f8f9fa]" />
              <Label className="text-sm font-medium text-[#f8f9fa]">Bagni</Label>
              <InfoTooltip content="Ogni bagno aggiuntivo comporta costi extra per sanitari e impiantistica." />
            </div>
            <div className="space-y-3">
              <Slider
                value={[config.bathrooms]}
                onValueChange={([value]) => setConfig((prev) => ({ ...prev, bathrooms: value }))}
                min={1}
                max={5}
                step={1}
                className="py-2"
              />
              <div className="text-center font-medium text-[#f8f9fa]">{config.bathrooms} bagno/i</div>
            </div>
          </div>
        </div>

        {/* Quality Level */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Livello Qualità</Label>
            <InfoTooltip content="Il livello di qualità determina i materiali e le finiture utilizzate." />
          </div>
          <RadioGroup
            value={config.qualityLevel}
            onValueChange={(value) => setConfig((prev) => ({ ...prev, qualityLevel: value }))}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {QUALITY_LEVELS.map((level) => (
              <motion.label
                key={level.id}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all backdrop-blur-sm ${config.qualityLevel === level.id
                  ? 'border-[#f8f9fa] bg-[#f8f9fa]/20'
                  : 'border-[#f8f9fa]/20 hover:border-[#f8f9fa]/40 bg-[#343a40]/50'
                  }`}
              >
                <RadioGroupItem value={level.id} className="sr-only" />
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#f8f9fa]">{level.name}</span>
                  {level.multiplier > 1 && (
                    <span className="text-xs px-2 py-1 bg-[#f8f9fa]/10 text-[#f8f9fa] rounded-full">
                      x{level.multiplier}
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#dee2e6]">{level.description}</span>
              </motion.label>
            ))}
          </RadioGroup>
        </div>

        {/* Services */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Servizi Inclusi</Label>
            <InfoTooltip content="Seleziona i lavori da includere nel preventivo." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICES.map((service) => (
              <motion.label
                key={service.id}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all backdrop-blur-sm ${config.services.includes(service.id)
                  ? 'border-[#f8f9fa] bg-[#f8f9fa]/20'
                  : 'border-[#f8f9fa]/20 hover:border-[#f8f9fa]/40 bg-[#343a40]/50'
                  }`}
              >
                <Checkbox
                  checked={config.services.includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                  className="border-[#f8f9fa]"
                />
                <div className="w-10 h-10 rounded-lg bg-[#f8f9fa]/10 flex items-center justify-center">
                  <service.icon size={18} className="text-[#f8f9fa]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#f8f9fa] text-sm">{service.name}</span>
                    <InfoTooltip content={service.info} />
                  </div>
                  <span className="text-xs text-[#f8f9fa]">+€{service.pricePerSqm}/m²</span>
                </div>
              </motion.label>
            ))}
          </div>
        </div>



        {/* AI Suggestions */}
        {showAI && (
          <div className="space-y-4">
            <AISuggestions suggestions={aiSuggestions} loading={loadingAI} />
            <ComparativeAnalysis
              currentConfig={config}
              alternatives={alternatives}
              loading={loadingAI}
            />
          </div>
        )}

        {/* Price Breakdown */}
        <div className="bg-gradient-to-br from-[#343a40]/50 to-[#495057]/50 backdrop-blur-sm border border-[#f8f9fa]/20 rounded-2xl p-6 shadow-xl">
          <h4 className="font-medium text-[#f8f9fa] mb-4">Riepilogo Preventivo</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#dee2e6]">Base ristrutturazione</span>
              <span className="text-[#f8f9fa]">€{breakdown.base?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#dee2e6]">Servizi aggiuntivi</span>
              <span className="text-[#f8f9fa]">€{breakdown.services?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#dee2e6]">Bagni ({config.bathrooms})</span>
              <span className="text-[#f8f9fa]">€{breakdown.bathrooms?.toLocaleString()}</span>
            </div>
            {windowsPrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#dee2e6]">Infissi</span>
                <span className="text-[#f8f9fa]">€{windowsPrice.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-[#f8f9fa]/20 pt-3 mt-3">
              <div className="flex justify-between items-end">
                <span className="font-medium text-[#f8f9fa]">Totale Stimato</span>
                <motion.span
                  key={totalPrice}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]"
                >
                  €{totalPrice.toLocaleString()}
                </motion.span>
              </div>
              <p className="text-xs text-[#adb5bd] text-right mt-1">IVA esclusa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}