import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { format, isBefore, isWeekend, startOfToday } from 'date-fns';
import { it } from 'date-fns/locale';
import CalendarWidget from '../components/appointments/CalendarWidget';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  Check,
  MapPin,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const PROJECT_TYPES = [
  { id: 'finestre', name: 'Solo Finestre', description: 'Consulenza per infissi' },
  { id: 'chiavi_in_mano', name: 'Chiavi in Mano', description: 'Ristrutturazione completa' },
  { id: 'consulenza', name: 'Consulenza', description: 'Prima visita conoscitiva' }
];

export default function Appuntamenti() {
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [projectType, setProjectType] = useState('consulenza');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const createAppointment = useMutation(api.appointments.create);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
    }
  }, [user]);

  const handleCalendarSelectDate = (date) => {
    setSelectedDate(date);
    setStep(1);
  };

  const disabledDays = (date) => {
    return isBefore(date, startOfToday()) || isWeekend(date);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const appointmentData = {
      ...formData,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      appointment_time: selectedTime,
      project_type: projectType,
      status: 'confirmed'
    };

    try {
      await createAppointment(appointmentData);

      // TODO: Send emails via Convex Action
      // await base44.integrations.Core.SendEmail(...)

      // TODO: Create Calendar Event via Convex Action
      // await base44.functions.invoke('createCalendarEvent', ...)

      setSubmitted(true);
    } catch (error) {
      console.error("Error booking appointment", error);
      // Handle error (show toast etc)
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center overflow-hidden relative">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl p-12 text-center max-w-md mx-6 shadow-2xl z-10"
        >
          <div className="w-20 h-20 rounded-full bg-[#f8f9fa]/10 flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-[#f8f9fa]" />
          </div>
          <h2 className="text-2xl font-medium text-[#f8f9fa] mb-4">
            Appuntamento Prenotato!
          </h2>
          <div className="bg-[#343a40]/50 backdrop-blur-sm border border-[#f8f9fa]/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 text-[#f8f9fa] mb-2">
              <CalendarIcon size={18} className="text-[#f8f9fa]" />
              <span>{format(selectedDate, 'EEEE d MMMM yyyy', { locale: it })}</span>
            </div>
            <div className="flex items-center gap-3 text-[#f8f9fa]">
              <Clock size={18} className="text-[#f8f9fa]" />
              <span>ore {selectedTime}</span>
            </div>
          </div>
          <p className="text-[#dee2e6] mb-4">
            Abbiamo ricevuto la tua richiesta di appuntamento.
          </p>
          <p className="text-sm text-[#adb5bd] mb-8">
            Riceverai una email di conferma a breve.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full"
          >
            Torna alla Home
          </Button>
        </motion.div>
      </div>
    );
  }

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
            <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Appuntamenti</span>
            <h1 className="text-4xl lg:text-6xl font-light text-[#f8f9fa] mt-4 mb-6">
              Prenota una <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">visita</span>
            </h1>
            <p className="text-[#dee2e6] max-w-2xl mx-auto text-lg">
              Vieni a trovarci nel nostro showroom. I nostri esperti sono a tua disposizione
              per una consulenza gratuita e personalizzata.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="relative py-8 bg-gradient-to-b from-[#495057] to-[#6c757d] border-b border-[#f8f9fa]/10 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #f8f9fa 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Data e Ora' },
              { num: 2, label: 'Tipo Progetto' },
              { num: 3, label: 'I Tuoi Dati' }
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all shadow-lg ${step >= s.num
                      ? 'bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] text-[#212529]'
                      : 'bg-[#495057] text-[#adb5bd] border border-[#f8f9fa]/20'
                      }`}>
                    {step > s.num ? <Check size={18} /> : s.num}
                  </motion.div>
                  <span className={`text-xs mt-2 hidden sm:block ${step >= s.num ? 'text-[#f8f9fa]' : 'text-[#adb5bd]'
                    }`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]' : 'bg-[#495057]'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar Widget for Logged Users */}
      {user && (
        <section className="relative py-12 bg-gradient-to-b from-[#495057] to-[#6c757d]">
          <div className="max-w-7xl mx-auto px-6">
            <CalendarWidget onSelectDate={handleCalendarSelectDate} user={user} />
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="relative py-12 lg:py-20 bg-gradient-to-b from-[#6c757d] via-[#495057] to-[#343a40] overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/5 to-transparent rounded-full blur-3xl"
        />
        <div className="max-w-4xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Date & Time */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#343a40] to-[#495057] p-6 border-b border-[#f8f9fa]/10 flex items-center gap-4">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/927932459_icon.png"
                    alt="IwHome"
                    className="h-12 w-auto"
                  />
                  <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-3">
                    <CalendarIcon size={24} className="text-[#f8f9fa]" />
                    Seleziona Data e Orario
                  </h2>
                </div>

                <div className="p-6 lg:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Calendar */}
                    <div>
                      <Label className="text-[#f8f9fa] mb-4 block">Scegli una data</Label>
                      <div className="bg-[#343a40]/50 backdrop-blur-sm border border-[#f8f9fa]/10 rounded-2xl p-4">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={disabledDays}
                          locale={it}
                          className="rounded-xl [&_.rdp-day]:text-[#f8f9fa] [&_.rdp-caption]:text-[#f8f9fa] [&_.rdp-nav_button]:text-[#f8f9fa] [&_.rdp-head_cell]:text-[#dee2e6]"
                          classNames={{
                            day_selected: "bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:from-[#e9ecef] hover:to-[#f8f9fa]",
                            day_today: "bg-[#6c757d] text-[#f8f9fa]",
                          }}
                        />
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                      <Label className="text-[#f8f9fa] mb-4 block">Scegli un orario</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map((time) => (
                          <motion.button
                            key={time}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTime(time)}
                            disabled={!selectedDate}
                            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all shadow-lg hover-lift ${selectedTime === time
                              ? 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529]'
                              : selectedDate
                                ? 'bg-[#343a40]/50 text-[#f8f9fa] hover:bg-[#495057] border border-[#f8f9fa]/10'
                                : 'bg-[#343a40]/30 text-[#6c757d] cursor-not-allowed border border-[#f8f9fa]/5'
                              }`}
                          >
                            {time}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Selected Summary */}
                  {selectedDate && selectedTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 bg-gradient-to-r from-[#343a40] to-[#495057] border border-[#f8f9fa]/20 rounded-xl p-4 flex items-center justify-between shadow-xl"
                    >
                      <div className="flex items-center gap-4">
                        <CalendarIcon size={20} className="text-[#f8f9fa]" />
                        <span className="text-[#f8f9fa] font-medium">
                          {format(selectedDate, 'EEEE d MMMM', { locale: it })} alle {selectedTime}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-8 flex justify-end">
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selectedDate || !selectedTime}
                      className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full px-8 font-medium transition-all"
                    >
                      Continua
                      <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Project Type */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#343a40] to-[#495057] p-6 border-b border-[#f8f9fa]/10 flex items-center gap-4">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/927932459_icon.png"
                    alt="IwHome"
                    className="h-12 w-auto"
                  />
                  <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-3">
                    <FileText size={24} className="text-[#f8f9fa]" />
                    Tipo di Appuntamento
                  </h2>
                </div>

                <div className="p-6 lg:p-8">
                  <RadioGroup
                    value={projectType}
                    onValueChange={setProjectType}
                    className="space-y-4"
                  >
                    {PROJECT_TYPES.map((type) => (
                      <motion.label
                        key={type.id}
                        whileTap={{ scale: 0.99 }}
                        className={`flex items-center gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all backdrop-blur-sm ${projectType === type.id
                          ? 'border-[#f8f9fa] bg-[#f8f9fa]/20'
                          : 'border-[#f8f9fa]/20 hover:border-[#f8f9fa]/40 bg-[#343a40]/50'
                          }`}
                      >
                        <RadioGroupItem value={type.id} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${projectType === type.id ? 'border-[#f8f9fa]' : 'border-[#f8f9fa]/30'
                          }`}>
                          {projectType === type.id && (
                            <div className="w-3 h-3 rounded-full bg-[#f8f9fa]" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-[#f8f9fa]">{type.name}</div>
                          <div className="text-sm text-[#dee2e6]">{type.description}</div>
                        </div>
                      </motion.label>
                    ))}
                  </RadioGroup>

                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="rounded-full px-8 border-[#f8f9fa]/30 text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                    >
                      <ArrowLeft size={18} className="mr-2" />
                      Indietro
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full px-8"
                    >
                      Continua
                      <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Personal Info */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#343a40] to-[#495057] p-6 border-b border-[#f8f9fa]/10 flex items-center gap-4">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/927932459_icon.png"
                    alt="IwHome"
                    className="h-12 w-auto"
                  />
                  <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-3">
                    <User size={24} className="text-[#f8f9fa]" />
                    I Tuoi Dati
                  </h2>
                </div>

                <div className="p-6 lg:p-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-[#f8f9fa] mb-2 flex items-center gap-2">
                          <User size={16} /> Nome e Cognome *
                        </Label>
                        <Input
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          required
                          className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa]"
                        />
                      </div>
                      <div>
                        <Label className="text-[#f8f9fa] mb-2 flex items-center gap-2">
                          <Phone size={16} /> Telefono
                        </Label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa]"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[#f8f9fa] mb-2 flex items-center gap-2">
                        <Mail size={16} /> Email *
                      </Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa]"
                      />
                    </div>

                    <div>
                      <Label className="text-[#f8f9fa] mb-2">Note o Richieste Particolari</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Descrivi brevemente il tuo progetto o eventuali richieste..."
                        className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa] min-h-[100px]"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-8 bg-[#343a40]/50 backdrop-blur-sm border border-[#f8f9fa]/20 rounded-xl p-6">
                    <h3 className="font-medium text-[#f8f9fa] mb-4">Riepilogo Appuntamento</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <CalendarIcon size={16} className="text-[#f8f9fa]" />
                        <span className="text-[#f8f9fa]">
                          {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: it })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-[#f8f9fa]" />
                        <span className="text-[#f8f9fa]">ore {selectedTime}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-[#f8f9fa]" />
                        <span className="text-[#f8f9fa]">
                          {PROJECT_TYPES.find(t => t.id === projectType)?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-[#f8f9fa]" />
                        <span className="text-[#f8f9fa]">Showroom IwHome</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="rounded-full px-8 border-[#f8f9fa]/30 text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                    >
                      <ArrowLeft size={18} className="mr-2" />
                      Indietro
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!formData.full_name || !formData.email || isSubmitting}
                      className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full px-8"
                    >
                      {isSubmitting ? (
                        <span>Conferma in corso...</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Conferma Appuntamento
                          <Check size={18} />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Map & Info Section */}
      <section className="py-16 bg-gradient-to-b from-[#495057] to-[#343a40]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#212529] rounded-3xl overflow-hidden shadow-2xl border border-[#f8f9fa]/10"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2843.8!2d10.63!3d44.698!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDTCsDQxJzUyLjgiTiAxMMKwMzcnNDguMCJF!5e0!3m2!1sit!2sit!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[400px]"
              />
            </motion.div>

            {/* Info Cards */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/20 flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-[#f8f9fa]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#f8f9fa] mb-2">📍 Dove Siamo</h3>
                    <p className="text-[#dee2e6] text-sm leading-relaxed">
                      <strong>IwHome Showroom</strong><br />
                      Via Montefiorino 10/E<br />
                      42124 Reggio Emilia (RE)<br />
                      Italia
                    </p>
                    <p className="text-[#adb5bd] text-xs mt-2">
                      Facilmente raggiungibile dall'uscita autostradale.<br />
                      Parcheggio gratuito disponibile.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/20 flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-[#f8f9fa]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#f8f9fa] mb-2">🕒 Orari di Apertura</h3>
                    <div className="space-y-1 text-sm text-[#dee2e6]">
                      <div className="flex justify-between gap-8">
                        <span>Lunedì - Venerdì:</span>
                        <span className="font-medium text-[#f8f9fa]">9:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span>Sabato:</span>
                        <span className="font-medium text-[#f8f9fa]">Su appuntamento</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span>Domenica:</span>
                        <span className="text-[#adb5bd]">Chiuso</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/20 flex items-center justify-center flex-shrink-0">
                    <Phone size={24} className="text-[#f8f9fa]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#f8f9fa] mb-2">📞 Contatti</h3>
                    <div className="space-y-2 text-sm">
                      <a href="tel:+393402921052" className="flex items-center gap-2 text-[#dee2e6] hover:text-[#f8f9fa] transition-colors">
                        <Phone size={14} />
                        <span>+39 340 292 1052</span>
                      </a>
                      <a href="mailto:info@iwhome.it" className="flex items-center gap-2 text-[#dee2e6] hover:text-[#f8f9fa] transition-colors">
                        <Mail size={14} />
                        <span>info@iwhome.it</span>
                      </a>
                    </div>
                    <p className="text-[#adb5bd] text-xs mt-3">
                      Rispondiamo entro 24 ore
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}