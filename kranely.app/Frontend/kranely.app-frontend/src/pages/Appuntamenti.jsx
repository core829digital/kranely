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
  { id: 'finestre', name: 'Windows & Doors', description: 'Window and door fitting consultation' },
  { id: 'chiavi_in_mano', name: 'Turnkey Renovation', description: 'Full renovation project' },
  { id: 'consulenza', name: 'Consultation', description: 'Initial site visit' }
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
      <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center overflow-hidden relative">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#F0EBE8]/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-3xl p-12 text-center max-w-md mx-6 shadow-2xl z-10"
        >
          <div className="w-20 h-20 rounded-full bg-white/ flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-medium text-white mb-4">
            Appointment Booked!
          </h2>
          <div className="bg-[#1C1A18]/ backdrop-blur-sm border border-white/ rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 text-white mb-2">
              <CalendarIcon size={18} className="text-white" />
              <span>{format(selectedDate, 'EEEE d MMMM yyyy', { locale: it })}</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Clock size={18} className="text-white" />
              <span>at {selectedTime}</span>
            </div>
          </div>
          <p className="text-white/70 mb-4">
            We have received your appointment request.
          </p>
          <p className="text-sm text-white/40 mb-8">
            You will receive a confirmation email shortly.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:shadow-2xl rounded-full"
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
            <span className="text-white text-sm tracking-widest uppercase">Appointments</span>
            <h1 className="text-4xl lg:text-6xl font-light text-white mt-4 mb-6">
              Book a <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8]">visit</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Come visit us in our showroom. Our experts are available
              for a free, personalized consultation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="relative py-8 bg-gradient-to-b from-[#535252] to-[#535252] border-b border-white/ overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #F0EBE8 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Date & Time' },
              { num: 2, label: 'Project Type' },
              { num: 3, label: 'Your Details' }
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all shadow-lg ${step >= s.num
                      ? 'bg-gradient-to-br from-[#F0EBE8] to-[#f0ebe8] text-[#141210]'
                      : 'bg-[#535252] text-white/40 border border-white/'
                      }`}>
                    {step > s.num ? <Check size={18} /> : s.num}
                  </motion.div>
                  <span className={`text-xs mt-2 hidden sm:block ${step >= s.num ? 'text-white' : 'text-white/40'
                    }`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? 'bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8]' : 'bg-[#535252]'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar Widget for Logged Users */}
      {user && (
        <section className="relative py-12 bg-gradient-to-b from-[#535252] to-[#535252]">
          <div className="max-w-7xl mx-auto px-6">
            <CalendarWidget onSelectDate={handleCalendarSelectDate} user={user} />
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="relative py-12 lg:py-20 bg-gradient-to-b from-[#535252] via-[#535252] to-[#1C1A18] overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#F0EBE8]/5 to-transparent rounded-full blur-3xl"
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
                className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#1C1A18] to-[#535252] p-6 border-b border-white/ flex items-center gap-4">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/927932459_icon.png"
                    alt="Kranely"
                    className="h-12 w-auto"
                  />
                  <h2 className="text-xl font-medium text-white flex items-center gap-3">
                    <CalendarIcon size={24} className="text-white" />
                    Select Date & Time
                  </h2>
                </div>

                <div className="p-6 lg:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Calendar */}
                    <div>
                      <Label className="text-white mb-4 block">Choose a date</Label>
                      <div className="bg-[#1C1A18]/ backdrop-blur-sm border border-white/ rounded-2xl p-4">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={disabledDays}
                          locale={it}
                          className="rounded-xl [&_.rdp-day]:text-white [&_.rdp-caption]:text-white [&_.rdp-nav_button]:text-white [&_.rdp-head_cell]:text-white/70"
                          classNames={{
                            day_selected: "bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:from-[#f0ebe8] hover:to-[#F0EBE8]",
                            day_today: "bg-[#535252] text-white",
                          }}
                        />
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                      <Label className="text-white mb-4 block">Choose a time</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map((time) => (
                          <motion.button
                            key={time}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTime(time)}
                            disabled={!selectedDate}
                            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all shadow-lg hover-lift ${selectedTime === time
                              ? 'bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210]'
                              : selectedDate
                                ? 'bg-[#1C1A18]/ text-white hover:bg-[#535252] border border-white/'
                                : 'bg-[#1C1A18]/ text-white/25 cursor-not-allowed border border-white/'
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
                      className="mt-8 bg-gradient-to-r from-[#1C1A18] to-[#535252] border border-white/ rounded-xl p-4 flex items-center justify-between shadow-xl"
                    >
                      <div className="flex items-center gap-4">
                        <CalendarIcon size={20} className="text-white" />
                        <span className="text-white font-medium">
                          {format(selectedDate, 'EEEE d MMMM', { locale: it })} alle {selectedTime}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-8 flex justify-end">
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selectedDate || !selectedTime}
                      className="bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:shadow-2xl rounded-full px-8 font-medium transition-all"
                    >
                      Continue
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
                className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#1C1A18] to-[#535252] p-6 border-b border-white/ flex items-center gap-4">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/927932459_icon.png"
                    alt="Kranely"
                    className="h-12 w-auto"
                  />
                  <h2 className="text-xl font-medium text-white flex items-center gap-3">
                    <FileText size={24} className="text-white" />
                    Appointment Type
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
                          ? 'border-white/10 bg-white/'
                          : 'border-white/ hover:border-white/ bg-[#1C1A18]/'
                          }`}
                      >
                        <RadioGroupItem value={type.id} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${projectType === type.id ? 'border-white/10' : 'border-white/'
                          }`}>
                          {projectType === type.id && (
                            <div className="w-3 h-3 rounded-full bg-[#F0EBE8]" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">{type.name}</div>
                          <div className="text-sm text-white/70">{type.description}</div>
                        </div>
                      </motion.label>
                    ))}
                  </RadioGroup>

                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="rounded-full px-8 border-white/ text-white hover:bg-white/"
                    >
                      <ArrowLeft size={18} className="mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:shadow-2xl rounded-full px-8"
                    >
                      Continue
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
                className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#1C1A18] to-[#535252] p-6 border-b border-white/ flex items-center gap-4">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/927932459_icon.png"
                    alt="Kranely"
                    className="h-12 w-auto"
                  />
                  <h2 className="text-xl font-medium text-white flex items-center gap-3">
                    <User size={24} className="text-white" />
                    Your Details
                  </h2>
                </div>

                <div className="p-6 lg:p-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-white mb-2 flex items-center gap-2">
                          <User size={16} /> Full Name *
                        </Label>
                        <Input
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          required
                          className="rounded-xl bg-[#1C1A18]/ border-white/ text-white placeholder:text-white/40 focus:border-white/10 focus:ring-[#F0EBE8]"
                        />
                      </div>
                      <div>
                        <Label className="text-white mb-2 flex items-center gap-2">
                          <Phone size={16} /> Phone
                        </Label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="rounded-xl bg-[#1C1A18]/ border-white/ text-white placeholder:text-white/40 focus:border-white/10 focus:ring-[#F0EBE8]"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white mb-2 flex items-center gap-2">
                        <Mail size={16} /> Email *
                      </Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="rounded-xl bg-[#1C1A18]/ border-white/ text-white placeholder:text-white/40 focus:border-white/10 focus:ring-[#F0EBE8]"
                      />
                    </div>

                    <div>
                      <Label className="text-white mb-2">Notes or Special Requests</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Briefly describe your project or any special requests..."
                        className="rounded-xl bg-[#1C1A18]/ border-white/ text-white placeholder:text-white/40 focus:border-white/10 focus:ring-[#F0EBE8] min-h-[100px]"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-8 bg-[#1C1A18]/ backdrop-blur-sm border border-white/ rounded-xl p-6">
                    <h3 className="font-medium text-white mb-4">Appointment Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <CalendarIcon size={16} className="text-white" />
                        <span className="text-white">
                          {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: it })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-white" />
                        <span className="text-white">at {selectedTime}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-white" />
                        <span className="text-white">
                          {PROJECT_TYPES.find(t => t.id === projectType)?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-white" />
                        <span className="text-white">Showroom Kranely</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="rounded-full px-8 border-white/ text-white hover:bg-white/"
                    >
                      <ArrowLeft size={18} className="mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!formData.full_name || !formData.email || isSubmitting}
                      className="bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:shadow-2xl rounded-full px-8"
                    >
                      {isSubmitting ? (
                        <span>Confirming...</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Confirm Appointment
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
      <section className="py-16 bg-gradient-to-b from-[#535252] to-[#1C1A18]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#141210] rounded-3xl overflow-hidden shadow-2xl border border-white/"
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
                className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/ flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-2">ðŸ“ Dove Siamo</h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      <strong>Kranely Showroom</strong><br />
                      Via Montefiorino 10/E<br />
                      42124 Reggio Emilia (RE)<br />
                      Italy
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      Easily accessible from the highway exit.<br />
                      Free parking available.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/ flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-2">ðŸ•’ Orari di Apertura</h3>
                    <div className="space-y-1 text-sm text-white/70">
                      <div className="flex justify-between gap-8">
                        <span>Lunedì - Venerdì:</span>
                        <span className="font-medium text-white">9:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span>Sabato:</span>
                        <span className="font-medium text-white">By appointment</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span>Domenica:</span>
                        <span className="text-white/40">Chiuso</span>
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
                className="bg-gradient-to-br from-[#535252] to-[#535252] backdrop-blur-sm border border-white/ rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/ flex items-center justify-center flex-shrink-0">
                    <Phone size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-2">ðŸ“ž Contatti</h3>
                    <div className="space-y-2 text-sm">
                      <a href="tel:+393402921052" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <Phone size={14} />
                        <span>+39 340 292 1052</span>
                      </a>
                      <a href="mailto:info@kranely.app" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <Mail size={14} />
                        <span>info@kranely.app</span>
                      </a>
                    </div>
                    <p className="text-white/40 text-xs mt-3">
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

