import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import InfoTooltip from '@/components/ui/InfoTooltip';
import AISuggestions from './AISuggestions';
import ComparativeAnalysis from './ComparativeAnalysis';
import { base44 } from '@/api/base44Client';
import {
  Square,
  Maximize2,
  Palette,
  Layers,
  Plus,
  Minus,
  Calculator,
  Trash2,
  ListOrdered
} from 'lucide-react';

const MATERIALS = [
  {
    id: 'pvc',
    name: 'PVC',
    description: 'Economico, isolante, bassa manutenzione',
    available: true
  },
  {
    id: 'alluminio',
    name: 'Alluminio',
    description: 'Richiedi preventivo in sede',
    available: false
  },
  {
    id: 'legno',
    name: 'Legno',
    description: 'Richiedi preventivo in sede',
    available: false
  }
];

const GLASS_TYPES = [
  {
    id: 'doppio',
    name: 'Doppio Vetro'
  },
  {
    id: 'triplo',
    name: 'Triplo Vetro'
  }
];

const WINDOW_TYPES = [
  { id: 'finestra', name: 'Finestra' },
  { id: 'porta_finestra', name: 'Porta Finestra' }
];

const ANTE_OPTIONS = [
  { id: '1', name: '1 Anta' },
  { id: '2', name: '2 Ante' },
  { id: '3', name: '3 Ante' }
];

const COLORS = [
  { id: 'bianco_pasta', name: 'Bianco Pasta', hex: '#FFFFFF' },
  { id: 'bianco_legno', name: 'Bianco/Effetto Legno', hex: '#E8DCC4' },
  { id: 'effetto_legno', name: 'Effetto Legno', hex: '#8B6914' }
];

// Prezzi al m² per PVC
const PRICE_TABLE = {
  finestra: {
    '1': {
      bianco_pasta: { doppio: 290, triplo: 315 },
      bianco_legno: { doppio: 370, triplo: 390 },
      effetto_legno: { doppio: 425, triplo: 445 }
    },
    '2': {
      bianco_pasta: { doppio: 290, triplo: 315 },
      bianco_legno: { doppio: 395, triplo: 415 },
      effetto_legno: { doppio: 430, triplo: 455 }
    },
    '3': {
      bianco_pasta: { doppio: 285, triplo: 315 },
      bianco_legno: { doppio: 425, triplo: 455 },
      effetto_legno: { doppio: 485, triplo: 505 }
    }
  },
  porta_finestra: {
    '1': {
      bianco_pasta: { doppio: 285, triplo: 315 },
      bianco_legno: { doppio: 340, triplo: 365 },
      effetto_legno: { doppio: 380, triplo: 410 }
    },
    '2': {
      bianco_pasta: { doppio: 295, triplo: 325 },
      bianco_legno: { doppio: 390, triplo: 415 },
      effetto_legno: { doppio: 420, triplo: 445 }
    },
    '3': {
      bianco_pasta: { doppio: 255, triplo: 325 },
      bianco_legno: { doppio: 380, triplo: 405 },
      effetto_legno: { doppio: 425, triplo: 445 }
    }
  }
};

// Window preview images mapping
const WINDOW_IMAGES = {
  finestra: {
    '1': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/4935d8cde_FINESTRA1ANTAZ40.png',
    '2': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/71fddd632_FINESTRA2ANTEZ40.png',
    '3': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/d591db523_FINESTRA3ANTEZ40.png'
  },
  porta_finestra: {
    '1': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/1bbd03ab6_PORTAFINESTRA1ANTAZ40.png',
    '2': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/34ba48cf2_PORTAFINESTRA2ANTEZ40.png',
    '3': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/36dacf868_PORTAFINESTRA3ANTEZ40.png'
  }
};

export default function WindowCalculator({ onQuoteChange }) {
  const [config, setConfig] = useState({
    material: 'pvc',
    windowType: 'finestra',
    quantity: 1,
    ante: '1',
    width: 120,
    height: 140,
    glassType: 'doppio',
    color: 'bianco_pasta'
  });

  const [windows, setWindows] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    calculatePrice();
  }, [config]);

  useEffect(() => {
    if (showAI) {
      generateAISuggestions();
    }
  }, [config, showAI]);

  const calculatePrice = () => {
    const area = (config.width * config.height) / 10000; // m²
    const pricePerSqm = PRICE_TABLE[config.windowType][config.ante][config.color][config.glassType];
    const price = pricePerSqm * area * config.quantity;

    setCurrentPrice(Math.round(price));

    // Calculate total including all added windows
    const windowsTotal = windows.reduce((sum, w) => sum + w.price, 0);
    const total = windowsTotal + Math.round(price);

    setTotalPrice(total);
    onQuoteChange?.({
      windows: [...windows, {
        ...config,
        price: Math.round(price),
        pricePerSqm,
        previewImage: WINDOW_IMAGES[config.windowType][config.ante]
      }],
      estimatedPrice: total
    });
  };

  const addWindow = () => {
    const area = (config.width * config.height) / 10000;
    const pricePerSqm = PRICE_TABLE[config.windowType][config.ante][config.color][config.glassType];
    const price = Math.round(pricePerSqm * area * config.quantity);

    const newWindow = {
      ...config,
      price,
      pricePerSqm,
      previewImage: WINDOW_IMAGES[config.windowType][config.ante],
      id: Date.now()
    };

    const updatedWindows = [...windows, newWindow];
    setWindows(updatedWindows);

    // Reset config for new window
    setConfig({
      material: 'pvc',
      windowType: 'finestra',
      quantity: 1,
      ante: '1',
      width: 120,
      height: 140,
      glassType: 'doppio',
      color: 'bianco_pasta'
    });

    // Update total
    const newTotal = updatedWindows.reduce((sum, w) => sum + w.price, 0);
    setTotalPrice(newTotal);
    setCurrentPrice(0);

    onQuoteChange?.({
      windows: updatedWindows,
      estimatedPrice: newTotal
    });
  };

  const removeWindow = (id) => {
    const updatedWindows = windows.filter(w => w.id !== id);
    setWindows(updatedWindows);

    const newTotal = updatedWindows.reduce((sum, w) => sum + w.price, 0) + currentPrice;
    setTotalPrice(newTotal);

    onQuoteChange?.({
      windows: updatedWindows,
      estimatedPrice: newTotal
    });
  };

  // Get color filter for image
  const getColorFilter = (color) => {
    switch (color) {
      case 'bianco_pasta':
        return 'brightness(1.1) saturate(0.8)';
      case 'bianco_legno':
        return 'sepia(0.15) saturate(1.2)';
      case 'effetto_legno':
        return 'sepia(0.4) saturate(1.3) hue-rotate(10deg)';
      default:
        return 'none';
    }
  };



  const generateAISuggestions = async () => {
    setLoadingAI(true);

    const windowType = WINDOW_TYPES.find((w) => w.id === config.windowType);
    const glass = GLASS_TYPES.find((g) => g.id === config.glassType);
    const color = COLORS.find((c) => c.id === config.color);

    const prompt = `Sei un esperto di infissi in PVC per IwHome. Analizza questa configurazione e fornisci suggerimenti professionali in italiano:

Configurazione attuale:
- Tipo: ${windowType.name} - ${config.ante} ante
- Materiale: PVC
- Dimensioni: ${config.width}cm x ${config.height}cm
- Quantità: ${config.quantity}
- Tipo vetro: ${glass.name}
- Colore: ${color.name}
- Prezzo totale: €${totalPrice}

Fornisci:
1. Una raccomandazione principale (max 2 righe) - considera efficienza energetica, durabilità, budget
2. Un suggerimento per ottimizzare il budget (max 2 righe)
3. Un suggerimento per migliorare la qualità (max 2 righe)
4. 3 consigli brevi e pratici

Inoltre genera 2 alternative comparative con:
- Nome alternativa
- Breve descrizione (1 riga)
- Prezzo stimato
- Differenza percentuale rispetto alla configurazione attuale
- 2 pro
- 2 contro`;

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
        <div className="flex items-center gap-4 mb-6">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/927932459_icon.png"
            alt="IwHome"
            className="h-14 w-auto"
          />
          <div>
            <h3 className="text-2xl font-medium text-[#f8f9fa]">Calcolatore Infissi</h3>
            <p className="text-[#dee2e6] text-sm">Telaio Z40 - Configura e ottieni un preventivo istantaneo</p>
          </div>
        </div>

        {/* Window Preview with color filter and Technical Drawing */}
        {config.material === 'pvc' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Window Preview */}
            <motion.div
              key={`${config.windowType}-${config.ante}-${config.color}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f8f9fa]/10"
            >
              <img
                src={WINDOW_IMAGES[config.windowType][config.ante]}
                alt={`${config.windowType} ${config.ante} ante`}
                className="h-48 lg:h-56 w-auto object-contain mx-auto"
                style={{ filter: getColorFilter(config.color) }}
              />
              <div className="absolute top-2 right-2 bg-[#343a40]/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-[#f8f9fa] text-xs font-medium">Anteprima</span>
              </div>
            </motion.div>

            {/* Technical Drawing Z40 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f8f9fa]/10"
            >
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/cdb44c5dd_ideal4000schemaz40blackandwhite.png"
                alt="Schema Telaio Z40"
                className="h-48 lg:h-56 w-auto object-contain mx-auto"
              />
              <div className="absolute top-2 left-2 bg-[#343a40]/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-[#f8f9fa] text-xs font-medium">Schema Tecnico Profilo Standard</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <div className="p-6 lg:p-8 space-y-8">
        {/* Material Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Materiale</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MATERIALS.map((mat) => (
              <motion.div
                key={mat.id}
                className={`relative flex flex-col p-4 rounded-xl border-2 transition-all backdrop-blur-sm ${mat.available
                    ? config.material === mat.id
                      ? 'border-[#f8f9fa] bg-[#f8f9fa]/20'
                      : 'border-[#f8f9fa]/20 bg-[#343a40]/50'
                    : 'border-[#f8f9fa]/10 bg-[#343a40]/20 opacity-60'
                  }`}
              >
                {!mat.available && (
                  <div className="absolute top-2 right-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#adb5bd]">
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 11V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                )}
                <span className="font-medium text-[#f8f9fa]">{mat.name}</span>
                <span className="text-xs text-[#dee2e6] mt-1">{mat.description}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Window Type Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Square size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Tipo</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {WINDOW_TYPES.map((type) => (
              <motion.button
                key={type.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setConfig((prev) => ({ ...prev, windowType: type.id }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all backdrop-blur-sm ${config.windowType === type.id
                    ? 'border-[#f8f9fa] bg-[#f8f9fa]/20'
                    : 'border-[#f8f9fa]/20 hover:border-[#f8f9fa]/40 bg-[#343a40]/50'
                  }`}
              >
                <img
                  src={WINDOW_IMAGES[type.id][config.ante]}
                  alt={type.name}
                  className="h-20 w-auto object-contain opacity-80"
                  style={{ filter: getColorFilter(config.color) }}
                />
                <span className="font-medium text-[#f8f9fa] text-sm">{type.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Ante Selection with Preview */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Numero Ante</Label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {ANTE_OPTIONS.map((ante) => (
              <motion.button
                key={ante.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setConfig((prev) => ({ ...prev, ante: ante.id }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all backdrop-blur-sm ${config.ante === ante.id
                    ? 'border-[#f8f9fa] bg-[#f8f9fa]/20'
                    : 'border-[#f8f9fa]/20 hover:border-[#f8f9fa]/40 bg-[#343a40]/50'
                  }`}
              >
                <img
                  src={WINDOW_IMAGES[config.windowType][ante.id]}
                  alt={ante.name}
                  className="h-16 w-auto object-contain opacity-80"
                  style={{ filter: getColorFilter(config.color) }}
                />
                <span className="font-medium text-[#f8f9fa] text-sm">{ante.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Quantità</Label>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setConfig((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
              className="w-12 h-12 rounded-full bg-[#343a40]/50 border border-[#f8f9fa]/20 flex items-center justify-center hover:bg-[#f8f9fa]/10 transition-colors"
            >
              <Minus size={20} className="text-[#f8f9fa]" />
            </motion.button>
            <span className="text-3xl font-light text-[#f8f9fa] w-16 text-center">
              {config.quantity}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setConfig((prev) => ({ ...prev, quantity: prev.quantity + 1 }))}
              className="w-12 h-12 rounded-full bg-[#343a40]/50 border border-[#f8f9fa]/20 flex items-center justify-center hover:bg-[#f8f9fa]/10 transition-colors"
            >
              <Plus size={20} className="text-[#f8f9fa]" />
            </motion.button>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Maximize2 size={18} className="text-[#f8f9fa]" />
              <Label className="text-sm font-medium text-[#f8f9fa]">Larghezza (cm)</Label>
              <InfoTooltip content="Larghezza del telaio esterno della finestra." />
            </div>
            <div className="space-y-3">
              <Slider
                value={[config.width]}
                onValueChange={([value]) => setConfig((prev) => ({ ...prev, width: value }))}
                min={40}
                max={300}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-sm text-[#dee2e6]">
                <span>40 cm</span>
                <span className="font-medium text-[#f8f9fa]">{config.width} cm</span>
                <span>300 cm</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Square size={18} className="text-[#f8f9fa]" />
              <Label className="text-sm font-medium text-[#f8f9fa]">Altezza (cm)</Label>
              <InfoTooltip content="Altezza del telaio esterno della finestra." />
            </div>
            <div className="space-y-3">
              <Slider
                value={[config.height]}
                onValueChange={([value]) => setConfig((prev) => ({ ...prev, height: value }))}
                min={40}
                max={280}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-sm text-[#dee2e6]">
                <span>40 cm</span>
                <span className="font-medium text-[#f8f9fa]">{config.height} cm</span>
                <span>280 cm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Glass Type */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Tipo di Vetro</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {GLASS_TYPES.map((glass) => (
              <motion.button
                key={glass.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setConfig((prev) => ({ ...prev, glassType: glass.id }))}
                className={`p-4 rounded-xl border-2 text-left transition-all backdrop-blur-sm ${config.glassType === glass.id
                    ? 'border-[#f8f9fa] bg-[#f8f9fa]/20'
                    : 'border-[#f8f9fa]/20 hover:border-[#f8f9fa]/40 bg-[#343a40]/50'
                  }`}
              >
                <span className="font-medium text-[#f8f9fa]">{glass.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette size={18} className="text-[#f8f9fa]" />
            <Label className="text-sm font-medium text-[#f8f9fa]">Colore</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLORS.map((color) => (
              <motion.button
                key={color.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setConfig((prev) => ({ ...prev, color: color.id }))}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all backdrop-blur-sm ${config.color === color.id
                    ? 'border-[#f8f9fa] bg-[#f8f9fa]/20'
                    : 'border-[#f8f9fa]/20 hover:border-[#f8f9fa]/40 bg-[#343a40]/50'
                  }`}
              >
                {color.id === 'bianco_legno' ? (
                  <div className="w-8 h-8 rounded-full border-2 border-[#f8f9fa]/30 flex-shrink-0 overflow-hidden">
                    <div className="flex h-full">
                      <div className="w-1/2 bg-white" />
                      <div
                        className="w-1/2"
                        style={{
                          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/6a8f058d8_brave_screenshot_wwwaluplastcompl.png)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </div>
                  </div>
                ) : color.id === 'effetto_legno' ? (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-[#f8f9fa]/30 flex-shrink-0"
                    style={{
                      backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/6a8f058d8_brave_screenshot_wwwaluplastcompl.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-[#f8f9fa]/30 flex-shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                )}
                <span className="text-sm font-medium text-[#f8f9fa]">{color.name}</span>
              </motion.button>
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

        {/* Added Windows List */}
        {windows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <ListOrdered size={18} className="text-[#f8f9fa]" />
              <Label className="text-sm font-medium text-[#f8f9fa]">Finestre Aggiunte ({windows.length})</Label>
            </div>

            <div className="grid gap-3">
              {windows.map((window, index) => (
                <motion.div
                  key={window.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#343a40]/50 border border-[#f8f9fa]/10 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1">
                      <img
                        src={window.previewImage}
                        alt="Preview"
                        className="h-12 w-auto object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#f8f9fa] font-medium text-sm">
                          Finestra #{index + 1}
                        </p>
                        <p className="text-[#dee2e6] text-xs">
                          {window.windowType === 'finestra' ? 'Finestra' : 'Porta Finestra'} •
                          {window.ante} {window.ante === '1' ? 'Anta' : 'Ante'} •
                          {window.width}×{window.height}cm •
                          Qtà: {window.quantity}
                        </p>
                        <p className="text-[#adb5bd] text-xs mt-1">
                          {window.glassType === 'doppio' ? 'Doppio' : 'Triplo'} Vetro •
                          {COLORS.find(c => c.id === window.color)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[#f8f9fa] font-medium">€{window.price.toLocaleString()}</p>
                        <p className="text-[#adb5bd] text-xs">IVA escl.</p>
                      </div>
                      <button
                        onClick={() => removeWindow(window.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Add Window Button */}
        <div className="flex justify-center">
          <Button
            onClick={addWindow}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl"
          >
            <Plus size={18} className="mr-2" />
            Aggiungi Finestra al Preventivo
          </Button>
        </div>

        {/* Price Display */}
        <motion.div
          layout
          className="bg-gradient-to-r from-[#343a40] to-[#495057] border border-[#f8f9fa]/20 rounded-2xl p-6 shadow-xl"
        >
          {currentPrice > 0 && (
            <div className="mb-4 pb-4 border-b border-[#f8f9fa]/10">
              <div className="flex justify-between items-center">
                <p className="text-[#dee2e6] text-sm">Finestra Corrente</p>
                <p className="text-[#f8f9fa] text-lg font-medium">€{currentPrice.toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[#dee2e6] text-sm">Prezzo Totale Stimato</p>
              <p className="text-xs text-[#adb5bd]">
                {windows.length > 0 ? `${windows.length} finestra/e aggiunte` : 'Nessuna finestra aggiunta'}
              </p>
            </div>
            <div className="text-right">
              <motion.div
                key={totalPrice}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl lg:text-5xl font-light text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]"
              >
                €{totalPrice.toLocaleString()}
              </motion.div>
              <p className="text-[#adb5bd] text-xs mt-1">
                Posa in opera inclusa - IVA esclusa
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 pt-4 border-t border-[#f8f9fa]/10 space-y-2">
            <p className="text-[#adb5bd] text-xs text-center leading-relaxed">
              ⚠️ <span className="font-medium">Prezzo indicativo e stimato</span> - Non rappresenta il costo reale del preventivo finale.
              Il prezzo definitivo sarà comunicato dopo un sopralluogo e valutazione specifica del progetto.
            </p>
            <p className="text-[#adb5bd] text-xs text-center leading-relaxed">
              📋 Per configurazioni diverse o materiali specifici (Alluminio, Legno),
              contattaci in sede o <span className="font-medium">richiedi un sopralluogo gratuito</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}