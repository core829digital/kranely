import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../Backend/convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { Tag, X, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

export default function ReferralWidget() {
  const { user: clerkUser, isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const email = clerkUser?.primaryEmailAddress?.emailAddress || '';
  const convexUser = useQuery(api.users.getByEmail, email ? { email } : 'skip');
  const applyCode = useMutation(api.referralCodes.apply);
  const removeFromUser = useMutation(api.referralCodes.removeFromUser);

  const hasCode = !!convexUser?.referral_code_applied;
  const discount = convexUser?.referral_discount_percent;

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setStatus(null);
    setMessage('');
    try {
      const result = await applyCode({ code });
      setStatus('success');
      setMessage(`Codice applicato! Hai uno sconto del ${result.discount_percent}% su tutti i servizi IWHome.`);
      setCode('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Codice non valido.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Vuoi rimuovere il codice referral applicato?')) return;
    try {
      await removeFromUser({});
      setStatus(null);
      setMessage('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Errore durante la rimozione.');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed right-6 w-80 max-w-[calc(100vw-3rem)] bg-white border border-[#dee2e6] rounded-3xl shadow-2xl z-50 overflow-hidden"
            style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#212529] to-[#343a40] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shadow">
                  <Tag size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Codice Referral</h3>
                  <p className="text-[10px] text-[#adb5bd]">Inserisci un codice per ottenere uno sconto</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#adb5bd] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {!isSignedIn ? (
                <div className="text-center py-4">
                  <Tag size={32} className="mx-auto mb-3 text-orange-400 opacity-60" />
                  <p className="text-sm text-[#495057] font-medium">Accedi per usare i codici referral</p>
                  <p className="text-xs text-[#6c757d] mt-1">Solo gli utenti registrati possono applicare uno sconto.</p>
                </div>
              ) : hasCode ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <CheckCircle2 size={24} className="mx-auto text-green-500 mb-2" />
                    <p className="text-sm font-semibold text-green-700">Codice attivo!</p>
                    <p className="text-xs text-green-600 mt-1">
                      Stai beneficiando di uno sconto del <strong>{discount}%</strong> su tutti i servizi IWHome.
                    </p>
                    <span className="inline-block mt-2 font-mono text-xs bg-white border border-green-300 text-green-700 px-3 py-1 rounded-full font-bold">
                      {convexUser.referral_code_applied}
                    </span>
                  </div>
                  <button
                    onClick={handleRemove}
                    className="w-full flex items-center justify-center gap-2 text-xs text-[#adb5bd] hover:text-red-500 transition-colors py-1"
                  >
                    <Trash2 size={13} /> Rimuovi codice
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#6c757d]">Hai un codice referral? Inseriscilo qui per ottenere uno sconto sui servizi IWHome.</p>
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApply()}
                      placeholder="es. ESTATE25"
                      className="flex-1 border border-[#dee2e6] rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                      disabled={loading}
                    />
                    <button
                      onClick={handleApply}
                      disabled={loading || !code.trim()}
                      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                    >
                      {loading ? '...' : 'Applica'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {status && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${
                          status === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {status === 'success'
                          ? <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                          : <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                        }
                        {message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 w-14 h-14 bg-gradient-to-br from-[#212529] to-[#343a40] rounded-full shadow-2xl flex items-center justify-center z-50"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        title="Codice Referral"
      >
        <Tag size={22} className="text-orange-400" />
        {hasCode && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </motion.button>
    </>
  );
}
