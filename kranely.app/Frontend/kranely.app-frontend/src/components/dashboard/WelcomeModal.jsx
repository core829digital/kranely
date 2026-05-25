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
      setError(err.response?.data?.error || 'Invalid code');
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
          className="bg-gradient-to-br from-[#1C1A18] to-[#535252] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FFC703] to-[#FFC703] p-8 text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Sparkles size={40} className="text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome to Kranely!
            </h2>
            <p className="text-white/80">
              Hi {user?.full_name || user?.email}
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
                  <Mail size={48} className="text-[#FFC703] mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-3">
                    We sent you an email! 📧
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    Check your inbox. We sent you the <strong>access code</strong> to activate your private area.
                  </p>
                </div>

                <div className="bg-[#FFC703]/10 border border-[#FFC703]/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-[#FFC703] text-center">
                    💡 Can't find the email? Check your spam folder too
                  </p>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-[#FFC703] to-[#FFC703] text-white hover:shadow-xl py-6 text-lg rounded-xl"
                >
                  <Key size={20} className="mr-2" />
                  I received the code
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center mb-6">
                  <Key size={48} className="text-[#FFC703]/70 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-3">
                    Enter your access code
                  </h3>
                  <p className="text-white/70">
                    Copy the code from the email and paste it below
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <Label className="text-white/70 mb-2 block">Access Code</Label>
                    <Input
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="IWSHOWROOMLIVELLO1@AREAPRIVATA"
                      className="bg-[#141210] border-white/ text-white text-center font-mono text-sm py-6"
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
                    className="flex-1 border-white/ text-white hover:bg-white/ py-6 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={verifyCode}
                    disabled={!accessCode || loading}
                    className="flex-1 bg-gradient-to-r from-[#FFC703] to-[#FFC703] text-white hover:shadow-xl py-6 rounded-xl"
                  >
                    {loading ? 'Verifying...' : 'Activate'}
                  </Button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full mt-4 text-sm text-white/40 hover:text-white transition-colors"
                >
                  Activate later
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
                  className="w-24 h-24 mx-auto mb-6 bg-[#FFC703]/10 rounded-full flex items-center justify-center"
                >
                  <CheckCircle size={60} className="text-[#FFC703]" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Private Area Activated! 🎉
                </h3>
                <p className="text-white/70">
                  Reloading...
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

