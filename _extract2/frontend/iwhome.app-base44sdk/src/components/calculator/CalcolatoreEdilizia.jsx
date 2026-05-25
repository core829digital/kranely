import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../Backend/convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import {
  User, Mail, Home, MapPin, Zap, Flame, Paintbrush,
  Send, Check, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

// ── Pure calculation function ────────────────────────────────────────────────
function calculateEdilizia(form, prices) {
  if (!prices) return 0;
  const mq = Number(form.mq) || 0;
  if (mq <= 0 || !form.ubicazione) return 0;

  // 1. Base
  let base = mq * prices.price_per_mq;

  // 2. Location
  const locMap = { nord: prices.multiplier_nord, centro: prices.multiplier_centro, sud: prices.multiplier_sud };
  base *= (locMap[form.ubicazione] ?? 1.0);

  // 3. Property type
  if (form.tipo_immobile) {
    const tipoMap = {
      villa_unifamiliare: prices.multiplier_villa,
      casale: prices.multiplier_casale,
      appartamento: prices.multiplier_appartamento,
    };
    base *= (tipoMap[form.tipo_immobile] ?? 1.0);
  }

  // 4. Conservation state
  if (form.stato_conservazione) {
    const statoMap = { media: prices.multiplier_media, degradato: prices.multiplier_degradato };
    base *= (statoMap[form.stato_conservazione] ?? 1.0);
  }

  // 5. Tramezzi
  if (form.spostamento_tramezzi) {
    const tm = { '20pct': prices.tramezzi_20, '50pct': prices.tramezzi_50, '100pct': prices.tramezzi_100 };
    base += mq * (tm[form.spostamento_tramezzi] ?? 0);
  }

  // 6. Electrical
  if (form.impianto_elettrico) {
    const el = { piccole: prices.elettrico_piccole, standard: prices.elettrico_standard, domotico: prices.elettrico_domotico };
    base += mq * (el[form.impianto_elettrico] ?? 0);
  }

  // 7. Heating
  if (form.riscaldamento === 'adeguamento') {
    base += mq * prices.riscaldamento_adeguamento;
  }

  // 8. Completamento
  let extra = 0;
  extra += (Number(form.controsoffittature_mq) || 0) * prices.controsoffittature_mq;
  extra += (Number(form.porte_num) || 0) * prices.porta_unit;
  extra += (Number(form.finestre_num) || 0) * prices.finestra_unit;
  extra += (Number(form.parquet_mq) || 0) * prices.parquet_mq;
  extra += (Number(form.marmo_mq) || 0) * prices.marmo_mq;
  extra += (Number(form.monocottura_mq) || 0) * prices.monocottura_mq;
  extra += (Number(form.resina_mq) || 0) * prices.resina_mq;
  extra += (Number(form.bagni_num) || 0) * prices.bagno_unit;
  if (form.pittura === 'incluse') extra += mq * prices.pittura_mq;

  return Math.round(base + extra);
}

const EMPTY_FORM = {
  email: '',
  full_name: '',
  mq: '',
  tipo_immobile: '',
  ubicazione: '',
  stato_conservazione: '',
  spostamento_tramezzi: '',
  impianto_elettrico: '',
  riscaldamento: '',
  controsoffittature_mq: '',
  porte_num: '',
  finestre_num: '',
  parquet_mq: '',
  marmo_mq: '',
  monocottura_mq: '',
  resina_mq: '',
  bagni_num: '',
  pittura: '',
  notes: '',
};

// ── Small helper components ───────────────────────────────────────────────────

/** @param {{ icon: import('react').ElementType, title: string, step: string }} props */
const SectionHeader = ({ icon: Icon, title, step }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center flex-shrink-0">
      <Icon size={18} className="text-[#f8f9fa]" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[#adb5bd]">Sezione {step}</p>
      <h3 className="text-[#f8f9fa] font-medium text-base">{title}</h3>
    </div>
  </div>
);

/** @param {{ value: string, current: string, onChange: (v: string) => void, label: string, sub?: string }} props */
const RadioCard = ({ value, current, onChange, label, sub }) => (
  <button
    type="button"
    onClick={() => onChange(value === current ? '' : value)}
    className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
      current === value
        ? 'border-[#f8f9fa] bg-[#f8f9fa]/15'
        : 'border-[#f8f9fa]/20 bg-[#343a40]/40 hover:border-[#f8f9fa]/40'
    }`}
  >
    <div className={`font-medium text-xs sm:text-sm leading-tight ${current === value ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'}`}>{label}</div>
    {sub && <div className="text-[10px] text-[#adb5bd] mt-0.5 leading-tight">{sub}</div>}
  </button>
);

/** @param {{ label: string, value: string, onChange: (v: string) => void, unit: string, placeholder?: string }} props */
const NumberField = ({ label, value, onChange, unit, placeholder = '0' }) => (
  <div>
    <Label className="text-[#dee2e6] text-xs mb-1.5 block">{label} <span className="text-[#adb5bd]">({unit})</span></Label>
    <Input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-xl bg-[#212529]/60 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/50 h-9 text-sm"
    />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function CalcolatoreEdilizia() {
  const { user } = useUser();
  const prices = useQuery(api.edilizia.getPrices);
  const createRequest = useMutation(api.edilizia.createRequest);

  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */({}));
  const [showCompletamento, setShowCompletamento] = useState(false);

  // Sync Clerk data when user logs in
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        email: prev.email || user.primaryEmailAddress?.emailAddress || '',
        full_name: prev.full_name || user.fullName || '',
      }));
    }
  }, [user]);

  /** @param {string} key @param {string} value */
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const estimatedPrice = useMemo(() => calculateEdilizia(form, prices), [form, prices]);

  const validate = () => {
    /** @type {Record<string, string>} */
    const e = {};
    if (!form.email) e.email = 'Email obbligatoria';
    if (!form.full_name) e.full_name = 'Nome obbligatorio';
    if (!form.mq || Number(form.mq) <= 0) e.mq = 'Inserisci i metri quadri';
    if (!form.ubicazione) e.ubicazione = 'Seleziona ubicazione';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** @param {import('react').FormEvent<HTMLFormElement>} e */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createRequest({
        email: form.email,
        full_name: form.full_name,
        mq: Number(form.mq),
        tipo_immobile: form.tipo_immobile || undefined,
        ubicazione: form.ubicazione,
        stato_conservazione: form.stato_conservazione || undefined,
        spostamento_tramezzi: form.spostamento_tramezzi || undefined,
        impianto_elettrico: form.impianto_elettrico || undefined,
        riscaldamento: form.riscaldamento || undefined,
        controsoffittature_mq: form.controsoffittature_mq ? Number(form.controsoffittature_mq) : undefined,
        porte_num: form.porte_num ? Number(form.porte_num) : undefined,
        finestre_num: form.finestre_num ? Number(form.finestre_num) : undefined,
        parquet_mq: form.parquet_mq ? Number(form.parquet_mq) : undefined,
        marmo_mq: form.marmo_mq ? Number(form.marmo_mq) : undefined,
        monocottura_mq: form.monocottura_mq ? Number(form.monocottura_mq) : undefined,
        resina_mq: form.resina_mq ? Number(form.resina_mq) : undefined,
        bagni_num: form.bagni_num ? Number(form.bagni_num) : undefined,
        pittura: form.pittura || undefined,
        estimated_price: estimatedPrice,
        notes: form.notes || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Edilizia request error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({
      ...EMPTY_FORM,
      email: user?.primaryEmailAddress?.emailAddress || '',
      full_name: user?.fullName || '',
    });
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/20 rounded-3xl p-10 text-center max-w-lg mx-auto shadow-2xl"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-5">
          <Check size={28} className="text-green-400" />
        </div>
        <h3 className="text-2xl font-medium text-[#f8f9fa] mb-3">Richiesta Inviata!</h3>
        <p className="text-[#dee2e6] text-sm leading-relaxed mb-6">
          Il nostro team ha ricevuto la tua richiesta. Ti contatteremo entro 24/48h per concordare un sopralluogo gratuito e fornirti un preventivo definitivo.
        </p>
        <div className="bg-[#343a40]/60 rounded-xl p-4 mb-6 text-left">
          <p className="text-[#adb5bd] text-xs uppercase tracking-wider mb-2">Preventivo calcolato</p>
          <p className="text-[#f8f9fa] text-2xl font-light">€{estimatedPrice.toLocaleString('it-IT')}</p>
        </div>
        <button onClick={handleReset} className="text-[#adb5bd] text-sm hover:text-[#f8f9fa] transition-colors">
          Nuova richiesta
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">

      {/* ── Sezione 1 — Dati di Contatto ── */}
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/15 rounded-2xl p-6 shadow-xl">
        <SectionHeader icon={User} title="Dati di Contatto" step="1" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[#dee2e6] text-xs mb-1.5 flex items-center gap-1.5">
              <User size={12} /> Nome e Cognome *
            </Label>
            <Input
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              disabled={!!user?.fullName}
              placeholder="Mario Rossi"
              className={`rounded-xl bg-[#212529]/60 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/50 disabled:opacity-60 ${errors.full_name ? 'border-red-400' : ''}`}
            />
            {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <Label className="text-[#dee2e6] text-xs mb-1.5 flex items-center gap-1.5">
              <Mail size={12} /> Email *
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              disabled={!!user}
              placeholder="mario@email.it"
              className={`rounded-xl bg-[#212529]/60 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/50 disabled:opacity-60 ${errors.email ? 'border-red-400' : ''}`}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>
        {user && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
            <Check size={12} /> Dati pre-compilati dal tuo account
          </div>
        )}
      </div>

      {/* ── Sezione 2 — Immobile ── */}
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/15 rounded-2xl p-6 shadow-xl">
        <SectionHeader icon={Home} title="L'Immobile" step="2" />

        {/* MQ */}
        <div className="mb-5">
          <Label className="text-[#dee2e6] text-xs mb-1.5 block">Metri quadri dell&apos;immobile *</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              value={form.mq}
              onChange={(e) => set('mq', e.target.value)}
              placeholder="es. 80"
              className={`w-36 rounded-xl bg-[#212529]/60 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/50 ${errors.mq ? 'border-red-400' : ''}`}
            />
            <span className="text-[#adb5bd] text-sm">MQ</span>
          </div>
          {errors.mq && <p className="text-red-400 text-xs mt-1">{errors.mq}</p>}
        </div>

        {/* Tipo immobile */}
        <div className="mb-5">
          <Label className="text-[#dee2e6] text-xs mb-2 block">Tipo di immobile <span className="text-[#6c757d]">(opzionale)</span></Label>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'villa_unifamiliare', l: 'Villa unifamiliare' },
              { v: 'casale', l: 'Casale' },
              { v: 'appartamento', l: 'Appartamento' },
            ].map(o => <RadioCard key={o.v} value={o.v} current={form.tipo_immobile} onChange={(v) => set('tipo_immobile', v)} label={o.l} />)}
          </div>
        </div>

        {/* Ubicazione */}
        <div className="mb-5">
          <Label className="text-[#dee2e6] text-xs mb-2 flex items-center gap-1.5">
            <MapPin size={12} /> Ubicazione *
            {errors.ubicazione && <span className="text-red-400 ml-1">{errors.ubicazione}</span>}
          </Label>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'nord', l: 'Nord Italia' },
              { v: 'centro', l: 'Centro Italia' },
              { v: 'sud', l: 'Sud Italia' },
            ].map(o => <RadioCard key={o.v} value={o.v} current={form.ubicazione} onChange={(v) => set('ubicazione', v)} label={o.l} />)}
          </div>
        </div>

        {/* Stato conservazione */}
        <div>
          <Label className="text-[#dee2e6] text-xs mb-2 block">Stato di conservazione <span className="text-[#6c757d]">(opzionale)</span></Label>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'media', l: 'Nella media', sub: 'Condizioni normali' },
              { v: 'degradato', l: 'Degradato', sub: 'Richiede interventi significativi' },
            ].map(o => <RadioCard key={o.v} value={o.v} current={form.stato_conservazione} onChange={(v) => set('stato_conservazione', v)} label={o.l} sub={o.sub} />)}
          </div>
        </div>
      </div>

      {/* ── Sezione 3 — Lavori ── */}
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/15 rounded-2xl p-6 shadow-xl">
        <SectionHeader icon={Zap} title="Lavori da Eseguire" step="3" />

        {/* Tramezzi */}
        <div className="mb-5">
          <Label className="text-[#dee2e6] text-xs mb-2 block">Spostamento tramezzi</Label>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: '20pct', l: '20%', sub: 'Variazione minima' },
              { v: '50pct', l: '50%', sub: 'Variazione media' },
              { v: '100pct', l: '100%', sub: 'Completa ridistribuzione' },
            ].map(o => <RadioCard key={o.v} value={o.v} current={form.spostamento_tramezzi} onChange={(v) => set('spostamento_tramezzi', v)} label={o.l} sub={o.sub} />)}
          </div>
        </div>

        {/* Elettrico */}
        <div className="mb-5">
          <Label className="text-[#dee2e6] text-xs mb-2 flex items-center gap-1.5">
            <Zap size={12} /> Impianto elettrico
          </Label>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'piccole', l: 'Piccole modifiche' },
              { v: 'standard', l: 'Nuovo impianto standard' },
              { v: 'domotico', l: 'Nuovo impianto domotico' },
            ].map(o => <RadioCard key={o.v} value={o.v} current={form.impianto_elettrico} onChange={(v) => set('impianto_elettrico', v)} label={o.l} />)}
          </div>
        </div>

        {/* Riscaldamento */}
        <div className="mb-5">
          <Label className="text-[#dee2e6] text-xs mb-2 flex items-center gap-1.5">
            <Flame size={12} /> Impianto di riscaldamento
          </Label>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'incluso', l: 'Incluso' },
              { v: 'escluso', l: 'Escluso' },
              { v: 'adeguamento', l: 'Lavori di adeguamento' },
            ].map(o => <RadioCard key={o.v} value={o.v} current={form.riscaldamento} onChange={(v) => set('riscaldamento', v)} label={o.l} />)}
          </div>
        </div>

      </div>

      {/* ── Sezione 4 — Completamento ── */}
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/15 rounded-2xl p-6 shadow-xl">
        <button
          type="button"
          onClick={() => setShowCompletamento(prev => !prev)}
          className="w-full flex items-center justify-between"
        >
          <SectionHeader icon={Paintbrush} title="Opere di Completamento" step="4" />
          <div className="text-[#adb5bd] flex-shrink-0 ml-2">
            {showCompletamento ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>
        <p className="text-[#adb5bd] text-xs -mt-3 mb-4">Aggiungi le opere di completamento per perfezionare il preventivo</p>

        <AnimatePresence>
          {showCompletamento && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                <NumberField label="Controsoffittature" value={form.controsoffittature_mq} onChange={(v) => set('controsoffittature_mq', v)} unit="MQ" />
                <NumberField label="Porte" value={form.porte_num} onChange={(v) => set('porte_num', v)} unit="n." />
                <NumberField label="Finestre" value={form.finestre_num} onChange={(v) => set('finestre_num', v)} unit="n." />
                <NumberField label="Parquet" value={form.parquet_mq} onChange={(v) => set('parquet_mq', v)} unit="MQ" />
                <NumberField label="Marmo" value={form.marmo_mq} onChange={(v) => set('marmo_mq', v)} unit="MQ" />
                <NumberField label="Monocottura" value={form.monocottura_mq} onChange={(v) => set('monocottura_mq', v)} unit="MQ" />
                <NumberField label="Resina" value={form.resina_mq} onChange={(v) => set('resina_mq', v)} unit="MQ" />
                <NumberField label="Bagni completi" value={form.bagni_num} onChange={(v) => set('bagni_num', v)} unit="n." />
              </div>

              <div>
                <Label className="text-[#dee2e6] text-xs mb-2 flex items-center gap-1.5">
                  <Paintbrush size={12} /> Opere di pittura
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { v: 'incluse', l: 'Incluse' },
                    { v: 'escluse', l: 'Escluse' },
                  ].map(o => <RadioCard key={o.v} value={o.v} current={form.pittura} onChange={(v) => set('pittura', v)} label={o.l} />)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Note ── */}
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/15 rounded-2xl p-5 shadow-xl">
        <Label className="text-[#dee2e6] text-xs mb-2 block">Note aggiuntive <span className="text-[#6c757d]">(opzionale)</span></Label>
        <Textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Descrivi il tuo progetto, eventuali vincoli, materiali preferiti..."
          className="rounded-xl bg-[#212529]/60 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/50 min-h-[90px] text-sm"
        />
      </div>

      {/* ── Price Summary + Submit ── */}
      <div className="bg-gradient-to-r from-[#212529] to-[#343a40] border border-[#f8f9fa]/20 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-[#adb5bd] text-xs uppercase tracking-wider">Preventivo</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={estimatedPrice}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="text-3xl sm:text-4xl font-light text-[#f8f9fa]"
              >
                {estimatedPrice > 0
                  ? `€${estimatedPrice.toLocaleString('it-IT')}`
                  : <span className="text-[#6c757d] text-2xl">Compila i campi...</span>
                }
              </motion.p>
            </AnimatePresence>
            <p className="text-[#6c757d] text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={10} /> Il preventivo definitivo verrà inviato via email entro 24/48 ore
            </p>
          </div>
          {estimatedPrice > 0 && (
            <div className="flex-shrink-0 bg-[#495057]/50 rounded-xl p-3 text-right hidden sm:block">
              <p className="text-[#adb5bd] text-xs">{form.mq} MQ · {form.ubicazione}</p>
              <p className="text-[#dee2e6] text-xs mt-0.5">
                ≈ €{form.mq ? Math.round(estimatedPrice / Number(form.mq)).toLocaleString('it-IT') : '-'}/MQ
              </p>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !prices}
          className="w-full py-5 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full text-base font-medium transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-[#212529] border-t-transparent rounded-full" />
              Invio in corso...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send size={16} />
              Invia Richiesta Preventivo
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
