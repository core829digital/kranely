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
import { enUS } from 'date-fns/locale';
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

  // â”€â”€ Quote creation (public â€” no auth required) â”€â”€
  const createPublicQuote = useMutation(api.quotes.createPublic);
  const createPublicAppointment = useMutation(api.appointments.createPublic);

  // â”€â”€ Quote state â”€â”€
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

  // â”€â”€ Appointment booking (after quote) â”€â”€
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
    if (!formData.full_name.trim()) errors.full_name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
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

    // null â†’ undefined: Convex v.optional() expects absent field, not null
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
      alert("An error occurred while sending. Please try again or contact us directly.");
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
      alert(error.message || "An error occurred. Please try again.");
    } finally {
      setAptSubmitting(false);
    }
  };

  // Show bottom PDF/submit section only for finestre, or chiavi_in_mano with infissi sub-tab
  const showBottomSection = quoteType === 'finestre' || (quoteType === 'chiavi_in_mano' && chiavSubTab === 'infissi');

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // SUBMITTED STATE â€” quote success + optional appointment
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (submitted) {
    if (aptBooked) {
      return (
        <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center overflow-hidden relative px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-3xl p-12 text-center max-w-md shadow-2xl z-10"
          >
            <div className="w-20 h-20 rounded-full bg-white/ flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-white" />
            </div>
<h2 className="text-2xl font-medium text-white mb-2">All Confirmed!</h2>
            <p className="text-white/70 mb-2">Your quote has been sent.</p>
            <p className="text-white/70 mb-8">
              Appointment booked for{' '}
              <strong>{format(aptDate, 'EEEE d MMMM', { locale: enUS })}</strong> at{' '}
              <strong>{aptTime}</strong>. You will receive a confirmation email.
            </p>
            <Link to="/">
              <Button className="w-full bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:shadow-2xl rounded-full font-medium transition-all">
                Back to Home
              </Button>
            </Link>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#1C1A18] overflow-hidden relative py-12 px-6">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#F0EBE8]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Quote success card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-3xl p-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-white/ flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-white" />
            </div>
<h2 className="text-2xl font-medium text-white mb-2">Quote Sent!</h2>
            <p className="text-white/70 text-sm">
              Thank you {formData.full_name || ''}! We will contact you soon at <strong>{formData.email}</strong>.
            </p>
          </motion.div>

          {/* Appointment booking card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/ flex items-center justify-center">
                <Calendar size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-white">Book an Appointment</h3>
                <p className="text-sm text-white/70">Optional â€” vieni a trovarci in showroom</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Date picker */}
              <div>
                <Label className="text-white mb-3 block">Choose a date</Label>
                <div className="bg-[#1C1A18]/ backdrop-blur-sm border border-white/ rounded-2xl p-3">
                  <DateCalendar
                    mode="single"
                    selected={aptDate}
                    onSelect={setAptDate}
                    disabled={(date) => isBefore(date, startOfToday()) || isWeekend(date)}
                    locale={it}
                    className="rounded-xl [&_.rdp-day]:text-white [&_.rdp-caption]:text-white [&_.rdp-nav_button]:text-white [&_.rdp-head_cell]:text-white/70"
                    classNames={{
                      day_selected: "bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210]",
                      day_today: "bg-[#535252] text-white",
                    }}
                  />
                </div>
              </div>

              {/* Time slots */}
              <div>
                <Label className="text-white mb-3 block">Choose a time</Label>
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
                            ? 'bg-[#1C1A18]/ text-white/25 cursor-not-allowed line-through border border-white/'
                            : aptTime === time
                            ? 'bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210]'
                            : aptDate
                            ? 'bg-[#1C1A18]/ text-white hover:bg-[#535252] border border-white/'
                            : 'bg-[#1C1A18]/ text-white/25 cursor-not-allowed border border-white/'
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
                    className="mt-4 bg-[#1C1A18]/ border border-white/ rounded-xl p-3 flex items-center gap-3"
                  >
                    <MapPin size={16} className="text-white" />
                    <div className="text-sm text-white">
                      <strong>{format(aptDate, 'EEEE d MMMM', { locale: enUS })}</strong> alle <strong>{aptTime}</strong>
                      <br /><span className="text-white/40 text-xs">Showroom Kranely, Via Montefiorino 10/E, RE</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleBookAppointment}
                disabled={!aptDate || !aptTime || aptSubmitting}
                className="flex-1 py-5 bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:shadow-2xl rounded-full font-medium transition-all"
              >
                {aptSubmitting ? (
                  <span className="flex items-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>â³</motion.div>
                    Booking in progress...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Clock size={18} />
                    Confirm Appointment
                  </span>
                )}
              </Button>
              <Link to="/" className="flex-1">
                <Button variant="outline" className="w-full py-5 rounded-full border-white/ text-white hover:bg-white/ font-medium">
                  Skip â€” Torna alla Home
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // MAIN CALCULATOR PAGE
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 lg:py-32 bg-[#1C1A18] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#F0EBE8]/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#f0ebe8]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <span className="text-white text-sm tracking-widest uppercase">Online Calculator</span>
            <h1 className="text-4xl lg:text-6xl font-light text-white mt-4 mb-6">
Calculate your <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8]">quote</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Configure your project and get a detailed quote.
              Prices can be refined during the consultation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Type Selection */}
      <section className="relative py-12 bg-gradient-to-b from-[#535252] to-[#535252] border-b border-white/ overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #F0EBE8 1px, transparent 1px)`,
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
                ? 'border-white/10 bg-gradient-to-br from-[#F0EBE8]/20 to-[#f0ebe8]/10 backdrop-blur-sm'
                : 'border-white/ bg-[#535252]/ backdrop-blur-sm hover:border-white/'
                }`}
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${quoteType === 'finestre' ? 'bg-white/' : 'bg-white/'}`}
              >
                <Layers size={24} className={quoteType === 'finestre' ? 'text-white' : 'text-white/70'} />
              </motion.div>
              <div className="text-left">
                <div className={`font-medium ${quoteType === 'finestre' ? 'text-white' : 'text-white/70'}`}>
Windows Only
                </div>
                <div className="text-sm text-white/40">Windows and French Doors in PVC</div>
              </div>
            </motion.button>

            {/* Chiavi in Mano */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setQuoteType('chiavi_in_mano')}
              className={`flex items-center gap-4 px-8 py-5 rounded-2xl border-2 transition-all shadow-xl hover-lift ${quoteType === 'chiavi_in_mano'
                ? 'border-white/10 bg-gradient-to-br from-[#F0EBE8]/20 to-[#f0ebe8]/10 backdrop-blur-sm'
                : 'border-white/ bg-[#535252]/ backdrop-blur-sm hover:border-white/'
                }`}
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${quoteType === 'chiavi_in_mano' ? 'bg-white/' : 'bg-white/'}`}
              >
                <Home size={24} className={quoteType === 'chiavi_in_mano' ? 'text-white' : 'text-white/70'} />
              </motion.div>
              <div className="text-left">
<div className={`font-medium ${quoteType === 'chiavi_in_mano' ? 'text-white' : 'text-white/70'}`}>
                  Turnkey Project
                </div>
                <div className="text-sm text-white/40">Full renovation, construction and 3D render</div>
              </div>
            </motion.button>

          </div>
        </div>
      </section>

      {/* Calculators */}
      <section className="relative py-12 lg:py-20 bg-gradient-to-b from-[#535252] via-[#535252] to-[#1C1A18] overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#F0EBE8]/5 to-transparent rounded-full blur-3xl"
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
                <div className="flex gap-1.5 bg-[#141210]/ border border-white/ rounded-2xl p-1.5">
                  <button
                    type="button"
                    onClick={() => setChiavSubTab('infissi')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      chiavSubTab === 'infissi'
                        ? 'bg-gradient-to-br from-[#F0EBE8]/20 to-[#f0ebe8]/10 text-white border border-white/'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/'
                    }`}
                  >
                    <Layers size={15} />
<span className="hidden sm:inline">Windows & Project</span>
                    <span className="sm:hidden">Project</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChiavSubTab('edilizia')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      chiavSubTab === 'edilizia'
                        ? 'bg-gradient-to-br from-orange-400/20 to-orange-500/10 text-orange-200 border border-orange-400/30'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/'
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
                        ? 'bg-gradient-to-br from-blue-400/20 to-[#FFC703]/10 text-blue-200 border border-[#FFC703]/20'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/'
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
                      <div className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/ flex items-center justify-center">
                              <Layers size={24} className="text-white" />
                            </div>
                            <div>
<div className="font-medium text-white">Include Windows</div>
                              <div className="text-sm text-white/70">Add windows to the project</div>
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
                    className="px-10 py-5 bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] rounded-full font-medium text-lg flex items-center gap-3 mx-auto hover:shadow-2xl transition-all"
                  >
                    Richiedi Preventivo Dettagliato
                    <ArrowRight size={20} />
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl"
                  >
                    <h3 className="text-2xl font-medium text-white mb-2">
                      Completa la richiesta
                    </h3>
                    <p className="text-white/70 mb-6">
                      Inserisci i tuoi dati per ricevere il preventivo dettagliato.
                      {user && (
                        <span className="block mt-1 text-sm text-green-400">
                          âœ“ Account linked â€” email pre-compilata
                        </span>
                      )}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-white mb-2 flex items-center gap-2">
                            <User size={16} /> Nome e Cognome <span className="text-red-400 text-xs font-medium">*obbligatorio</span>
                          </Label>
                          <Input
                            value={formData.full_name}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, full_name: e.target.value }));
                              if (formErrors.full_name) setFormErrors(prev => ({ ...prev, full_name: '' }));
                            }}
                            placeholder="Mario Rossi"
                            className={`rounded-xl bg-[#1C1A18]/ border-white/ text-white placeholder:text-white/40 focus:ring-[#F0EBE8] ${formErrors.full_name ? 'border-red-500 focus:border-red-500' : 'focus:border-white/10'}`}
                          />
                          {formErrors.full_name && (
                            <p className="text-red-400 text-xs mt-1">{formErrors.full_name}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-white mb-2 flex items-center gap-2">
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
                            className={`rounded-xl bg-[#1C1A18]/ border-white/ text-white placeholder:text-white/40 focus:ring-[#F0EBE8] ${formErrors.phone ? 'border-red-500 focus:border-red-500' : 'focus:border-white/10'}`}
                          />
                          {formErrors.phone && (
                            <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-white mb-2 flex items-center gap-2">
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
                          className={`rounded-xl bg-[#1C1A18]/ border-white/ text-white placeholder:text-white/40 focus:ring-[#F0EBE8] disabled:opacity-70 ${formErrors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-white/10'}`}
                        />
                        {formErrors.email && (
                          <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-white mb-2">Note Aggiuntive</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Descrivi il tuo progetto o aggiungi dettagli..."
                          className="rounded-xl bg-[#1C1A18]/ border-white/ text-white placeholder:text-white/40 focus:border-white/10 focus:ring-[#F0EBE8] min-h-[100px]"
                        />
                      </div>

                      <div className="bg-gradient-to-r from-[#1C1A18] to-[#535252] rounded-xl p-4 flex items-center justify-between border border-white/">
                        <span className="text-white/70">Stima Preventivo</span>
                        <span className="text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8]">
                          â‚¬{getTotalPrice().toLocaleString()}
                        </span>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-6 bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:shadow-2xl rounded-full text-lg font-medium transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              â³
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



