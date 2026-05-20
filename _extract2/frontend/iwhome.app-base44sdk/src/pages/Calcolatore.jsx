import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as DateCalendar } from '@/components/ui/calendar';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import WindowCalculator from '../components/calculator/WindowCalculator';
import ProjectCalculator from '../components/calculator/ProjectCalculator';
import CalcolatoreEdilizia from '../components/calculator/CalcolatoreEdilizia';
import CalcolatoreRender3D from '../components/calculator/CalcolatoreRender3D';
import QuoteDownload from '../components/quote/QuoteDownload';
import { format, isBefore, isWeekend, startOfToday } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Layers,
  Home,
  HardHat,
  Box,
  ArrowRight,
  Mail,
  Phone,
  User,
  Send,
  Check,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export default function Calcolatore() {
  const { user } = useUser();

  // ── Quote creation (public — no auth required) ──
  const createPublicQuote = useMutation(api.quotes.createPublic);
  const createPublicAppointment = useMutation(api.appointments.createPublic);

  // ── Quote state ──
  const [quoteType, setQuoteType] = useState('chiavi_in_mano');
  const [chiavSubTab, setChiavSubTab] = useState('infissi');
  const [includeWindows, setIncludeWindows] = useState(true);
  const [windowConfig, setWindowConfig] = useState(null);
  const [projectConfig, setProjectConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({ full_name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Appointment booking (after quote) ──
  const [aptDate, setAptDate] = useState(null);
  const [aptTime, setAptTime] = useState(null);
  const [aptSubmitting, setAptSubmitting] = useState(false);
  const [aptBooked, setAptBooked] = useState(false);

  const bookedSlots = useQuery(
    api.appointments.getBookedSlots,
    aptDate ? { date: format(aptDate, 'yyyy-MM-dd') } : 'skip'
  ) ?? [];

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: prev.full_name || user.fullName || '',
        email: prev.email || user.primaryEmailAddress?.emailAddress || ''
      }));
    }
  }, [user]);

  const handleRequestQuote = () => {
    setShowForm(true);
  };

  const getTotalPrice = () => {
    if (quoteType === 'finestre') {
      return windowConfig?.estimatedPrice || 0;
    } else {
      const windowsPrice = includeWindows ? (windowConfig?.estimatedPrice || 0) : 0;
      return projectConfig?.estimatedPrice || windowsPrice;
    }
  };

  const validateForm = () => {
    const errors = { full_name: '', email: '', phone: '' };
    if (!formData.full_name.trim()) errors.full_name = 'Nome obbligatorio';
    if (!formData.email.trim()) errors.email = 'Email obbligatoria';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email non valida';
    if (!formData.phone.trim()) errors.phone = 'Telefono obbligatorio';
    return errors;
  };

  const hasFormErrors = (e) => Object.values(e).some(v => v !== '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (hasFormErrors(errors)) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({ full_name: '', email: '', phone: '' });
    setIsSubmitting(true);

    // null → undefined: Convex v.optional() expects absent field, not null
    const windowCfg = (quoteType === 'finestre' || includeWindows) && windowConfig ? windowConfig : undefined;
    const projectCfg = quoteType === 'chiavi_in_mano' && projectConfig ? projectConfig : undefined;
    const totalPrice = getTotalPrice() || undefined;

    const quoteData = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      notes: formData.notes.trim() || undefined,
      quote_type: quoteType === 'finestre' ? 'finestre' : (includeWindows ? 'completo' : 'chiavi_in_mano'),
      window_config: windowCfg,
      project_config: projectCfg,
      estimated_price: totalPrice,
    };

    try {
      await createPublicQuote(quoteData);
      setSubmitted(true);
    } catch (error) {
      console.error("Error creating quote", error);
      alert("Si è verificato un errore nell'invio. Riprova o contattaci direttamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!aptDate || !aptTime) return;
    setAptSubmitting(true);
    try {
      await createPublicAppointment({
        full_name: formData.full_name || 'Non specificato',
        email: formData.email,
        phone: formData.phone,
        appointment_date: format(aptDate, 'yyyy-MM-dd'),
        appointment_time: aptTime,
        project_type: quoteType === 'finestre' ? 'finestre' : 'chiavi_in_mano',
        notes: formData.notes || undefined,
      });
      setAptBooked(true);
    } catch (error) {
      console.error("Error booking appointment", error);
      alert(error.message || "Si è verificato un errore. Riprova.");
    } finally {
      setAptSubmitting(false);
    }
  };

  // Show bottom PDF/submit section only for finestre, or chiavi_in_mano with infissi sub-tab
  const showBottomSection = quoteType === 'finestre' || (quoteType === 'chiavi_in_mano' && chiavSubTab === 'infissi');

  // ────────────────────────────────────────────────────────
  // SUBMITTED STATE — quote success + optional appointment
  // ────────────────────────────────────────────────────────
  if (submitted) {
    if (aptBooked) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center overflow-hidden relative px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl p-12 text-center max-w-md shadow-2xl z-10"
          >
            <div className="w-20 h-20 rounded-full bg-[#f8f9fa]/10 flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-[#f8f9fa]" />
            </div>
            <h2 className="text-2xl font-medium text-[#f8f9fa] mb-2">Tutto Confermato!</h2>
            <p className="text-[#dee2e6] mb-2">Il tuo preventivo è stato inviato.</p>
            <p className="text-[#dee2e6] mb-8">
              Appuntamento prenotato per il{' '}
              <strong>{format(aptDate, 'EEEE d MMMM', { locale: it })}</strong> alle{' '}
              <strong>{aptTime}</strong>. Riceverai una email di conferma.
            </p>
            <Link to="/">
              <Button className="w-full bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full font-medium transition-all">
                Torna alla Home
              </Button>
            </Link>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] overflow-hidden relative py-12 px-6">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Quote success card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl p-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-[#f8f9fa]/10 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-[#f8f9fa]" />
            </div>
            <h2 className="text-2xl font-medium text-[#f8f9fa] mb-2">Preventivo Inviato!</h2>
            <p className="text-[#dee2e6] text-sm">
              Grazie {formData.full_name || ''}! Ti contatteremo a breve a <strong>{formData.email}</strong>.
            </p>
          </motion.div>

          {/* Appointment booking card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center">
                <Calendar size={24} className="text-[#f8f9fa]" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-[#f8f9fa]">Prenota un Appuntamento</h3>
                <p className="text-sm text-[#dee2e6]">Facoltativo — vieni a trovarci in showroom</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Date picker */}
              <div>
                <Label className="text-[#f8f9fa] mb-3 block">Scegli una data</Label>
                <div className="bg-[#343a40]/50 backdrop-blur-sm border border-[#f8f9fa]/10 rounded-2xl p-3">
                  <DateCalendar
                    mode="single"
                    selected={aptDate}
                    onSelect={setAptDate}
                    disabled={(date) => isBefore(date, startOfToday()) || isWeekend(date)}
                    locale={it}
                    className="rounded-xl [&_.rdp-day]:text-[#f8f9fa] [&_.rdp-caption]:text-[#f8f9fa] [&_.rdp-nav_button]:text-[#f8f9fa] [&_.rdp-head_cell]:text-[#dee2e6]"
                    classNames={{
                      day_selected: "bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529]",
                      day_today: "bg-[#6c757d] text-[#f8f9fa]",
                    }}
                  />
                </div>
              </div>

              {/* Time slots */}
              <div>
                <Label className="text-[#f8f9fa] mb-3 block">Scegli un orario</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => !isBooked && setAptTime(time)}
                        disabled={!aptDate || isBooked}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                          isBooked
                            ? 'bg-[#343a40]/20 text-[#6c757d] cursor-not-allowed line-through border border-[#f8f9fa]/5'
                            : aptTime === time
                            ? 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529]'
                            : aptDate
                            ? 'bg-[#343a40]/50 text-[#f8f9fa] hover:bg-[#495057] border border-[#f8f9fa]/10'
                            : 'bg-[#343a40]/30 text-[#6c757d] cursor-not-allowed border border-[#f8f9fa]/5'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>

                {aptDate && aptTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-[#343a40]/50 border border-[#f8f9fa]/20 rounded-xl p-3 flex items-center gap-3"
                  >
                    <MapPin size={16} className="text-[#f8f9fa]" />
                    <div className="text-sm text-[#f8f9fa]">
                      <strong>{format(aptDate, 'EEEE d MMMM', { locale: it })}</strong> alle <strong>{aptTime}</strong>
                      <br /><span className="text-[#adb5bd] text-xs">Showroom IwHome, Via Montefiorino 10/E, RE</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleBookAppointment}
                disabled={!aptDate || !aptTime || aptSubmitting}
                className="flex-1 py-5 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full font-medium transition-all"
              >
                {aptSubmitting ? (
                  <span className="flex items-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.div>
                    Prenotazione in corso...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Clock size={18} />
                    Conferma Appuntamento
                  </span>
                )}
              </Button>
              <Link to="/" className="flex-1">
                <Button variant="outline" className="w-full py-5 rounded-full border-[#f8f9fa]/30 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 font-medium">
                  Salta — Torna alla Home
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // MAIN CALCULATOR PAGE
  // ────────────────────────────────────────────────────────
  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#e9ecef]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Calcolatore Online</span>
            <h1 className="text-4xl lg:text-6xl font-light text-[#f8f9fa] mt-4 mb-6">
              Calcola il tuo <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">preventivo</span>
            </h1>
            <p className="text-[#dee2e6] max-w-2xl mx-auto text-lg">
              Configura il tuo progetto e ottieni un preventivo dettagliato.
              I prezzi potranno essere perfezionati durante la consulenza.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Type Selection */}
      <section className="relative py-12 bg-gradient-to-b from-[#495057] to-[#6c757d] border-b border-[#f8f9fa]/10 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #f8f9fa 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 justify-center">

            {/* Solo Infissi */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setQuoteType('finestre')}
              className={`flex items-center gap-4 px-8 py-5 rounded-2xl border-2 transition-all shadow-xl hover-lift ${quoteType === 'finestre'
                ? 'border-[#f8f9fa] bg-gradient-to-br from-[#f8f9fa]/20 to-[#e9ecef]/10 backdrop-blur-sm'
                : 'border-[#f8f9fa]/20 bg-[#495057]/50 backdrop-blur-sm hover:border-[#f8f9fa]/40'
                }`}
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${quoteType === 'finestre' ? 'bg-[#f8f9fa]/30' : 'bg-[#f8f9fa]/10'}`}
              >
                <Layers size={24} className={quoteType === 'finestre' ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'} />
              </motion.div>
              <div className="text-left">
                <div className={`font-medium ${quoteType === 'finestre' ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'}`}>
                  Solo Infissi
                </div>
                <div className="text-sm text-[#adb5bd]">Finestre e Porte Finestre in PVC</div>
              </div>
            </motion.button>

            {/* Chiavi in Mano */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setQuoteType('chiavi_in_mano')}
              className={`flex items-center gap-4 px-8 py-5 rounded-2xl border-2 transition-all shadow-xl hover-lift ${quoteType === 'chiavi_in_mano'
                ? 'border-[#f8f9fa] bg-gradient-to-br from-[#f8f9fa]/20 to-[#e9ecef]/10 backdrop-blur-sm'
                : 'border-[#f8f9fa]/20 bg-[#495057]/50 backdrop-blur-sm hover:border-[#f8f9fa]/40'
                }`}
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${quoteType === 'chiavi_in_mano' ? 'bg-[#f8f9fa]/30' : 'bg-[#f8f9fa]/10'}`}
              >
                <Home size={24} className={quoteType === 'chiavi_in_mano' ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'} />
              </motion.div>
              <div className="text-left">
                <div className={`font-medium ${quoteType === 'chiavi_in_mano' ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'}`}>
                  Progetto Chiavi in Mano
                </div>
                <div className="text-sm text-[#adb5bd]">Ristrutturazione completa, edilizia e render 3D</div>
              </div>
            </motion.button>

          </div>
        </div>
      </section>

      {/* Calculators */}
      <section className="relative py-12 lg:py-20 bg-gradient-to-b from-[#6c757d] via-[#495057] to-[#343a40] overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/5 to-transparent rounded-full blur-3xl"
        />
        <div className="max-w-5xl mx-auto px-6">
          <AnimatePresence mode="wait">

            {/* Solo Infissi */}
            {quoteType === 'finestre' && (
              <motion.div
                key="windows"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <WindowCalculator onQuoteChange={setWindowConfig} />
              </motion.div>
            )}

            {/* Chiavi in Mano */}
            {quoteType === 'chiavi_in_mano' && (
              <motion.div
                key="project"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Sub-tab navigation */}
                <div className="flex gap-1.5 bg-[#212529]/60 border border-[#f8f9fa]/10 rounded-2xl p-1.5">
                  <button
                    type="button"
                    onClick={() => setChiavSubTab('infissi')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      chiavSubTab === 'infissi'
                        ? 'bg-gradient-to-br from-[#f8f9fa]/20 to-[#e9ecef]/10 text-[#f8f9fa] border border-[#f8f9fa]/20'
                        : 'text-[#adb5bd] hover:text-[#dee2e6] hover:bg-[#f8f9fa]/5'
                    }`}
                  >
                    <Layers size={15} />
                    <span className="hidden sm:inline">Infissi &amp; Progetto</span>
                    <span className="sm:hidden">Progetto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChiavSubTab('edilizia')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      chiavSubTab === 'edilizia'
                        ? 'bg-gradient-to-br from-orange-400/20 to-orange-500/10 text-orange-200 border border-orange-400/30'
                        : 'text-[#adb5bd] hover:text-[#dee2e6] hover:bg-[#f8f9fa]/5'
                    }`}
                  >
                    <HardHat size={15} />
                    <span className="hidden sm:inline">Calcola Edilizia</span>
                    <span className="sm:hidden">Edilizia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChiavSubTab('render3d')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      chiavSubTab === 'render3d'
                        ? 'bg-gradient-to-br from-blue-400/20 to-blue-500/10 text-blue-200 border border-blue-400/30'
                        : 'text-[#adb5bd] hover:text-[#dee2e6] hover:bg-[#f8f9fa]/5'
                    }`}
                  >
                    <Box size={15} />
                    <span className="hidden sm:inline">Render 3D</span>
                    <span className="sm:hidden">Render</span>
                  </button>
                </div>

                {/* Sub-tab content */}
                <AnimatePresence mode="wait">
                  {chiavSubTab === 'infissi' && (
                    <motion.div
                      key="sub-infissi"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      className="space-y-8"
                    >
                      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center">
                              <Layers size={24} className="text-[#f8f9fa]" />
                            </div>
                            <div>
                              <div className="font-medium text-[#f8f9fa]">Includi Infissi</div>
                              <div className="text-sm text-[#dee2e6]">Aggiungi infissi al progetto</div>
                            </div>
                          </div>
                          <Switch
                            checked={includeWindows}
                            onCheckedChange={setIncludeWindows}
                          />
                        </div>
                      </div>

                      {includeWindows && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <WindowCalculator onQuoteChange={setWindowConfig} />
                        </motion.div>
                      )}

                      <ProjectCalculator
                        onQuoteChange={setProjectConfig}
                        windowsPrice={includeWindows ? (windowConfig?.estimatedPrice || 0) : 0}
                      />
                    </motion.div>
                  )}

                  {chiavSubTab === 'edilizia' && (
                    <motion.div
                      key="sub-edilizia"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                    >
                      <CalcolatoreEdilizia />
                    </motion.div>
                  )}

                  {chiavSubTab === 'render3d' && (
                    <motion.div
                      key="sub-render3d"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                    >
                      <CalcolatoreRender3D />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Download & Request Quote */}
          {showBottomSection && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-6"
            >
              {/* Download PDF */}
              <QuoteDownload
                quoteData={{
                  quote_type: quoteType === 'finestre' ? 'finestre' : (includeWindows ? 'completo' : 'chiavi_in_mano'),
                  window_config: quoteType === 'finestre' || includeWindows ? windowConfig : null,
                  project_config: quoteType === 'chiavi_in_mano' ? projectConfig : null,
                  notes: formData.notes
                }}
                totalPrice={getTotalPrice()}
              />

              {/* Request Quote */}
              <div className="text-center">
                {!showForm ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRequestQuote}
                    className="px-10 py-5 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full font-medium text-lg flex items-center gap-3 mx-auto hover:shadow-2xl transition-all"
                  >
                    Richiedi Preventivo Dettagliato
                    <ArrowRight size={20} />
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl"
                  >
                    <h3 className="text-2xl font-medium text-[#f8f9fa] mb-2">
                      Completa la richiesta
                    </h3>
                    <p className="text-[#dee2e6] mb-6">
                      Inserisci i tuoi dati per ricevere il preventivo dettagliato.
                      {user && (
                        <span className="block mt-1 text-sm text-green-400">
                          ✓ Account collegato — email pre-compilata
                        </span>
                      )}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-[#f8f9fa] mb-2 flex items-center gap-2">
                            <User size={16} /> Nome e Cognome <span className="text-red-400 text-xs font-medium">*obbligatorio</span>
                          </Label>
                          <Input
                            value={formData.full_name}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, full_name: e.target.value }));
                              if (formErrors.full_name) setFormErrors(prev => ({ ...prev, full_name: '' }));
                            }}
                            placeholder="Mario Rossi"
                            className={`rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:ring-[#f8f9fa] ${formErrors.full_name ? 'border-red-500 focus:border-red-500' : 'focus:border-[#f8f9fa]'}`}
                          />
                          {formErrors.full_name && (
                            <p className="text-red-400 text-xs mt-1">{formErrors.full_name}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-[#f8f9fa] mb-2 flex items-center gap-2">
                            <Phone size={16} /> Telefono <span className="text-red-400 text-xs font-medium">*obbligatorio</span>
                          </Label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, phone: e.target.value }));
                              if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                            }}
                            placeholder="+39 333 000 0000"
                            className={`rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:ring-[#f8f9fa] ${formErrors.phone ? 'border-red-500 focus:border-red-500' : 'focus:border-[#f8f9fa]'}`}
                          />
                          {formErrors.phone && (
                            <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-[#f8f9fa] mb-2 flex items-center gap-2">
                          <Mail size={16} /> Email <span className="text-red-400 text-xs font-medium">*obbligatoria</span>
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, email: e.target.value }));
                            if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                          }}
                          placeholder="mario@email.it"
                          disabled={!!user}
                          className={`rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:ring-[#f8f9fa] disabled:opacity-70 ${formErrors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-[#f8f9fa]'}`}
                        />
                        {formErrors.email && (
                          <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-[#f8f9fa] mb-2">Note Aggiuntive</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Descrivi il tuo progetto o aggiungi dettagli..."
                          className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa] min-h-[100px]"
                        />
                      </div>

                      <div className="bg-gradient-to-r from-[#343a40] to-[#495057] rounded-xl p-4 flex items-center justify-between border border-[#f8f9fa]/20">
                        <span className="text-[#dee2e6]">Stima Preventivo</span>
                        <span className="text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">
                          €{getTotalPrice().toLocaleString()}
                        </span>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-6 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full text-lg font-medium transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              ⏳
                            </motion.div>
                            Invio in corso...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send size={18} />
                            Invia Richiesta
                          </span>
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
