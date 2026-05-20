import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAction } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  Check,
  User,
  MessageSquare,
  Instagram,
  Facebook,
  Linkedin
} from 'lucide-react';

export default function Contatti() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const sendEmail = useAction(api.actions.sendEmail);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await sendEmail({
        to: 'info@iwhome.it',
        subject: `Nuovo Contatto: ${formData.subject || 'Richiesta dal sito'} — ${formData.full_name}`,
        html: `<h2>Nuovo messaggio dal form di contatto</h2>
          <p><strong>Nome:</strong> ${formData.full_name}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Telefono:</strong> ${formData.phone || 'Non specificato'}</p>
          <p><strong>Oggetto:</strong> ${formData.subject || 'Non specificato'}</p>
          <p><strong>Messaggio:</strong><br/>${formData.message}</p>`
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Errore invio contatto:', err);
      setSubmitError('Errore durante l\'invio. Riprova o contattaci direttamente a info@iwhome.it');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-24 min-h-screen bg-[#F5F5F3] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 text-center max-w-md mx-6 shadow-xl"
        >
          <div className="w-20 h-20 rounded-full bg-[#C9A962]/10 flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-[#C9A962]" />
          </div>
          <h2 className="text-2xl font-medium text-[#2D3B35] mb-4">
            Messaggio Inviato!
          </h2>
          <p className="text-[#2D3B35]/60 mb-8">
            Grazie per averci contattato. Ti risponderemo il prima possibile.
          </p>
          <Button 
            onClick={() => setSubmitted(false)} 
            variant="outline"
            className="rounded-full"
          >
            Invia un altro messaggio
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-[#2D3B35]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <span className="text-[#C9A962] text-sm tracking-widest uppercase">Contatti</span>
            <h1 className="text-4xl lg:text-5xl font-light text-white mt-4 mb-6">
              Parliamo del tuo <span className="font-medium">progetto</span>
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto">
              Siamo qui per rispondere alle tue domande e aiutarti a realizzare 
              i tuoi progetti di ristrutturazione.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 lg:py-24 bg-[#F5F5F3]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-medium text-[#2D3B35] mb-6">
                  Informazioni di Contatto
                </h2>
                <p className="text-[#2D3B35]/60 mb-8">
                  Vieni a trovarci nel nostro showroom o contattaci per una consulenza gratuita.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2D3B35] flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-[#C9A962]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2D3B35] mb-1">Showroom</h3>
                    <p className="text-[#2D3B35]/60 text-sm">
                      Showroom IwHome<br />
                      Italia
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2D3B35] flex items-center justify-center flex-shrink-0">
                    <Phone size={20} className="text-[#C9A962]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2D3B35] mb-1">Telefono</h3>
                    <p className="text-[#2D3B35]/60 text-sm">+39 XXX XXX XXXX</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2D3B35] flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-[#C9A962]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2D3B35] mb-1">Email</h3>
                    <p className="text-[#2D3B35]/60 text-sm">info@iwhome.it</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2D3B35] flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-[#C9A962]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2D3B35] mb-1">Orari di Apertura</h3>
                    <p className="text-[#2D3B35]/60 text-sm">
                      Lunedì - Venerdì: 9:00 - 18:00<br />
                      Sabato: Su appuntamento<br />
                      Domenica: Chiuso
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="pt-6 border-t border-[#2D3B35]/10">
                <h3 className="font-medium text-[#2D3B35] mb-4">Seguici sui Social</h3>
                <div className="flex gap-3">
                  <a href="#" className="w-12 h-12 rounded-xl bg-[#2D3B35]/5 flex items-center justify-center hover:bg-[#2D3B35] hover:text-[#C9A962] transition-all text-[#2D3B35]">
                    <Instagram size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-[#2D3B35]/5 flex items-center justify-center hover:bg-[#2D3B35] hover:text-[#C9A962] transition-all text-[#2D3B35]">
                    <Facebook size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-[#2D3B35]/5 flex items-center justify-center hover:bg-[#2D3B35] hover:text-[#C9A962] transition-all text-[#2D3B35]">
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-10">
                <h2 className="text-2xl font-medium text-[#2D3B35] mb-2">
                  Inviaci un Messaggio
                </h2>
                <p className="text-[#2D3B35]/60 mb-8">
                  Compila il form e ti risponderemo entro 24 ore.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-[#2D3B35] mb-2 flex items-center gap-2">
                        <User size={16} /> Nome e Cognome *
                      </Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        required
                        className="rounded-xl border-gray-200 focus:border-[#C9A962] focus:ring-[#C9A962]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#2D3B35] mb-2 flex items-center gap-2">
                        <Phone size={16} /> Telefono
                      </Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="rounded-xl border-gray-200 focus:border-[#C9A962] focus:ring-[#C9A962]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#2D3B35] mb-2 flex items-center gap-2">
                      <Mail size={16} /> Email *
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="rounded-xl border-gray-200 focus:border-[#C9A962] focus:ring-[#C9A962]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#2D3B35] mb-2">Oggetto</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Di cosa vorresti parlare?"
                      className="rounded-xl border-gray-200 focus:border-[#C9A962] focus:ring-[#C9A962]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#2D3B35] mb-2 flex items-center gap-2">
                      <MessageSquare size={16} /> Messaggio *
                    </Label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      required
                      placeholder="Descrivi il tuo progetto o la tua richiesta..."
                      className="rounded-xl border-gray-200 focus:border-[#C9A962] focus:ring-[#C9A962] min-h-[150px]"
                    />
                  </div>

                  {submitError && (
                    <p className="text-red-500 text-sm text-center">{submitError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-6 bg-[#2D3B35] hover:bg-[#3D4F47] rounded-full text-lg"
                  >
                    {isSubmitting ? (
                      <span>Invio in corso...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send size={18} />
                        Invia Messaggio
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section Placeholder */}
      <section className="h-96 bg-[#2D3B35] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/60">
            <MapPin size={48} className="mx-auto mb-4 text-[#C9A962]" />
            <p>Showroom IwHome</p>
            <p className="text-sm">Mappa interattiva in arrivo</p>
          </div>
        </div>
      </section>
    </div>
  );
}