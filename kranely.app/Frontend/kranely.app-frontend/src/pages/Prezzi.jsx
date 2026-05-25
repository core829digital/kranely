import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Euro, Percent, Hash } from 'lucide-react';
import useRBAC from '../hooks/useRBAC';

const PRICE_SECTIONS = [
  {
    title: 'Prezzo Base',
    fields: [
      { key: 'price_per_mq', label: 'Prezzo base per MQ', unit: 'â‚¬/MQ', type: 'currency' },
    ],
  },
  {
    title: 'Moltiplicatori Ubicazione',
    description: 'Fattori moltiplicativi applicati al prezzo base. 1.0 = invariato, 1.1 = +10%, 0.85 = -15%',
    fields: [
      { key: 'multiplier_nord', label: 'Nord Italia', unit: 'x', type: 'multiplier' },
      { key: 'multiplier_centro', label: 'Centro Italia', unit: 'x', type: 'multiplier' },
      { key: 'multiplier_sud', label: 'Sud Italia', unit: 'x', type: 'multiplier' },
    ],
  },
  {
    title: 'Moltiplicatori Tipo Immobile',
    fields: [
      { key: 'multiplier_villa', label: 'Villa unifamiliare', unit: 'x', type: 'multiplier' },
      { key: 'multiplier_casale', label: 'Casale', unit: 'x', type: 'multiplier' },
      { key: 'multiplier_appartamento', label: 'Appartamento', unit: 'x', type: 'multiplier' },
    ],
  },
  {
    title: 'Moltiplicatori Stato Conservazione',
    fields: [
      { key: 'multiplier_media', label: 'Nella media', unit: 'x', type: 'multiplier' },
      { key: 'multiplier_degradato', label: 'Degradato', unit: 'x', type: 'multiplier' },
    ],
  },
  {
    title: 'Spostamento Tramezzi',
    description: 'Prezzi aggiuntivi per MQ in base alla variazione',
    fields: [
      { key: 'tramezzi_20', label: 'Variazione 20%', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'tramezzi_50', label: 'Variazione 50%', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'tramezzi_100', label: 'Variazione 100%', unit: 'â‚¬/MQ', type: 'currency' },
    ],
  },
  {
    title: 'Impianto Elettrico',
    description: 'Prezzi aggiuntivi per MQ',
    fields: [
      { key: 'elettrico_piccole', label: 'Piccole modifiche', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'elettrico_standard', label: 'Nuovo impianto standard', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'elettrico_domotico', label: 'Nuovo impianto domotico', unit: 'â‚¬/MQ', type: 'currency' },
    ],
  },
  {
    title: 'Riscaldamento & Finiture',
    fields: [
      { key: 'riscaldamento_adeguamento', label: 'Adeguamento riscaldamento', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'finiture_alta_qualita_extra', label: 'Extra alta qualitÃ ', unit: 'x (es. 0.20 = +20%)', type: 'multiplier' },
    ],
  },
  {
    title: 'Opere di Completamento',
    description: 'Prezzi per unitÃ  (MQ o numero)',
    fields: [
      { key: 'controsoffittature_mq', label: 'Controsoffittature', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'porta_unit', label: 'Sostituzione porta', unit: 'â‚¬/cad.', type: 'currency' },
      { key: 'finestra_unit', label: 'Sostituzione finestra', unit: 'â‚¬/cad.', type: 'currency' },
      { key: 'parquet_mq', label: 'Parquet', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'marmo_mq', label: 'Marmo', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'monocottura_mq', label: 'Monocottura', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'resina_mq', label: 'Resina', unit: 'â‚¬/MQ', type: 'currency' },
      { key: 'bagno_unit', label: 'Bagno completo', unit: 'â‚¬/cad.', type: 'currency' },
      { key: 'pittura_mq', label: 'Pittura (se inclusa)', unit: 'â‚¬/MQ', type: 'currency' },
    ],
  },
];

export default function Prezzi() {
  const { t } = useTranslation();
  const { isAdmin, isLoading } = useRBAC();
  const currentPrices = useQuery(api.edilizia.getPrices);
  const updatePrices = useMutation(api.edilizia.updatePrices);

  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync form state when prices load
  useEffect(() => {
    if (currentPrices) {
      const f = {};
      PRICE_SECTIONS.forEach(s => s.fields.forEach(field => {
        f[field.key] = String(currentPrices[field.key] ?? '');
      }));
      setForm(f);
    }
  }, [currentPrices]);

  if (isLoading) {
    return (
      <div className="pt-0 min-h-screen bg-[#1C1A18] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/ border-t-[#F0EBE8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="pt-0 min-h-screen bg-[#1C1A18] flex items-center justify-center">
        <div className="text-center p-8 bg-[#1C1A18]/ border border-red-500/30 rounded-2xl max-w-sm">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-white text-lg font-medium mb-2">Accesso negato</h2>
          <p className="text-white/40 text-sm">Solo gli amministratori possono gestire i prezzi.</p>
        </div>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {};
      PRICE_SECTIONS.forEach(s => s.fields.forEach(field => {
        payload[field.key] = parseFloat(form[field.key]) || 0;
      }));
      await updatePrices(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="pt-0 min-h-screen bg-[#1C1A18]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-white">Gestione Prezzi Edilizia</h1>
              <p className="text-white/40 text-sm mt-1">
                I prezzi configurati qui vengono usati in tempo reale nel calcolatore pubblico.
              </p>
            </div>
            {currentPrices?.updated_date && (
              <div className="text-right flex-shrink-0">
                <p className="text-white/25 text-xs">Ultimo aggiornamento</p>
                <p className="text-white/40 text-sm">
                  {new Date(currentPrices.updated_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                {currentPrices.updated_by && (
                  <p className="text-white/25 text-xs">{currentPrices.updated_by}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <form onSubmit={handleSave} className="space-y-6">
          {PRICE_SECTIONS.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6"
            >
              <h3 className="text-white font-medium mb-1">{section.title}</h3>
              {section.description && (
                <p className="text-white/25 text-xs mb-4">{section.description}</p>
              )}
              {!section.description && <div className="mb-4" />}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.fields.map(field => (
                  <div key={field.key}>
                    <Label className="text-white/40 text-xs mb-1.5 flex items-center gap-1.5">
                      {field.type === 'currency' ? <Euro size={10} /> : field.type === 'multiplier' ? <Percent size={10} /> : <Hash size={10} />}
                      {field.label}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form[field.key] ?? ''}
                        onChange={e => set(field.key, e.target.value)}
                        className="rounded-xl bg-[#141210] border-white/ text-white focus:border-white/ h-9 text-sm"
                      />
                      <span className="text-white/25 text-xs whitespace-nowrap flex-shrink-0">{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Save button */}
          <div className="flex items-center gap-4 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#F0EBE8] text-[#141210] hover:bg-white/10 rounded-full px-8 py-2.5 font-medium transition-all"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-[#141210] border-t-transparent rounded-full" />
                  Salvataggio...
                </span>
              ) : saved ? (
                <span className="flex items-center gap-2 text-green-700">
                  <Check size={16} /> Prezzi salvati
                </span>
              ) : (
                'Save Prices'
              )}
            </Button>
            {error && (
              <p className="text-red-400 text-sm flex items-center gap-1.5">
                <AlertCircle size={14} /> {error}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}


