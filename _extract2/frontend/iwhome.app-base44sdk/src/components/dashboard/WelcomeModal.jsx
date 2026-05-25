import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Key, Mail, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function WelcomeModal({ user, onClose }) {
  const [step, setStep] = useState(1);
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Invia email di benvenuto automaticamente
    if (user && !user.welcome_email_sent) {
      sendWelcomeEmail();
    }
  }, [user]);

  const sendWelcomeEmail = async () => {
    try {
      await base44.functions.invoke('sendWelcomeEmail', {});
      await base44.auth.updateMe({ welcome_email_sent: true });
      setEmailSent(true);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('verifyAccessCode', {
        code: accessCode.trim()
      });

      if (response.data.success) {
        setStep(3);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Codice non valido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-[#343a40] to-[#495057] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#f8f9fa]/20"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Sparkles size={40} className="text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Benvenuto in IwHome!
            </h2>
            <p className="text-white/80">
              Ciao {user?.full_name || user?.email}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center mb-6">
                  <Mail size={48} className="text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-[#f8f9fa] mb-3">
                    Ti abbiamo inviato una email! 📧
                  </h3>
                  <p className="text-[#dee2e6] leading-relaxed">
                    Controlla la tua casella di posta. Ti abbiamo inviato il <strong>codice di accesso</strong> per attivare la tua area privata.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-300 text-center">
                    💡 Non trovi l'email? Controlla anche nella cartella spam
                  </p>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl py-6 text-lg rounded-xl"
                >
                  <Key size={20} className="mr-2" />
                  Ho ricevuto il codice
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center mb-6">
                  <Key size={48} className="text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-[#f8f9fa] mb-3">
                    Inserisci il codice di accesso
                  </h3>
                  <p className="text-[#dee2e6]">
                    Copia il codice dall'email e incollalo qui sotto
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <Label className="text-[#dee2e6] mb-2 block">Codice di Accesso</Label>
                    <Input
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="IWSHOWROOMLIVELLO1@AREAPRIVATA"
                      className="bg-[#212529] border-[#f8f9fa]/20 text-[#f8f9fa] text-center font-mono text-sm py-6"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-[#f8f9fa]/30 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 py-6 rounded-xl"
                  >
                    Indietro
                  </Button>
                  <Button
                    onClick={verifyCode}
                    disabled={!accessCode || loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl py-6 rounded-xl"
                  >
                    {loading ? 'Verifica...' : 'Attiva'}
                  </Button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full mt-4 text-sm text-[#adb5bd] hover:text-[#f8f9fa] transition-colors"
                >
                  Attiva più tardi
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="w-24 h-24 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle size={60} className="text-green-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-[#f8f9fa] mb-3">
                  Area Privata Attivata! 🎉
                </h3>
                <p className="text-[#dee2e6]">
                  Ricaricamento in corso...
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}