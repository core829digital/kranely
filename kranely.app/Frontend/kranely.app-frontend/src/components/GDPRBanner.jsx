import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, Settings, Shield } from 'lucide-react';

export default function GDPRBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('gdpr-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    localStorage.setItem('gdpr-consent', JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const acceptSelected = () => {
    localStorage.setItem('gdpr-consent', JSON.stringify(preferences));
    setShowBanner(false);
  };

  const rejectAll = () => {
    const minimal = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    localStorage.setItem('gdpr-consent', JSON.stringify(minimal));
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-[#212529] to-[#343a40] backdrop-blur-xl border border-[#f8f9fa]/20 rounded-2xl shadow-2xl overflow-hidden">
              {!showSettings ? (
                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center flex-shrink-0">
                      <Shield size={24} className="text-[#f8f9fa]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-[#f8f9fa] mb-2">
                        Rispettiamo la tua Privacy
                      </h3>
                      <p className="text-[#dee2e6] text-sm leading-relaxed">
                        Utilizziamo cookie per migliorare la tua esperienza sul nostro sito. 
                        I cookie necessari sono essenziali per il funzionamento del sito, 
                        mentre altri ci aiutano a migliorare i nostri servizi e mostrarti contenuti personalizzati.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={acceptAll}
                      size="lg"
                      className="bg-gradient-to-r from-[#FFC703] to-[#FFC703] text-white hover:from-[#FFC703] hover:to-blue-800 hover:shadow-xl rounded-full font-medium shadow-lg"
                    >
                      Accetta Tutti
                    </Button>
                    <Button
                      onClick={rejectAll}
                      size="lg"
                      className="bg-white text-[#212529] hover:bg-[#dee2e6] rounded-full font-medium shadow-lg border-2 border-white"
                    >
                      Rifiuta Tutti
                    </Button>
                    <Button
                      onClick={() => setShowSettings(true)}
                      size="lg"
                      className="bg-white text-[#212529] hover:bg-[#dee2e6] rounded-full font-medium shadow-lg border-2 border-white"
                    >
                      <Settings size={18} className="mr-2" />
                      Personalizza
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-[#f8f9fa]">
                      Preferenze Cookie
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-[#dee2e6] hover:text-[#f8f9fa]"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-[#343a40]/50 rounded-xl p-4 border border-[#f8f9fa]/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-[#f8f9fa]">Cookie Necessari</h4>
                          <p className="text-sm text-[#dee2e6]">
                            Essenziali per il funzionamento del sito
                          </p>
                        </div>
                        <Switch checked={true} disabled />
                      </div>
                    </div>

                    <div className="bg-[#343a40]/50 rounded-xl p-4 border border-[#f8f9fa]/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-[#f8f9fa]">Cookie Analitici</h4>
                          <p className="text-sm text-[#dee2e6]">
                            Ci aiutano a capire come gli utenti utilizzano il sito
                          </p>
                        </div>
                        <Switch
                          checked={preferences.analytics}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, analytics: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="bg-[#343a40]/50 rounded-xl p-4 border border-[#f8f9fa]/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-[#f8f9fa]">Cookie di Marketing</h4>
                          <p className="text-sm text-[#dee2e6]">
                            Utilizzati per mostrare pubblicità pertinenti
                          </p>
                        </div>
                        <Switch
                          checked={preferences.marketing}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, marketing: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="bg-[#343a40]/50 rounded-xl p-4 border border-[#f8f9fa]/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-[#f8f9fa]">Cookie di Preferenze</h4>
                          <p className="text-sm text-[#dee2e6]">
                            Memorizzano le tue preferenze di navigazione
                          </p>
                        </div>
                        <Switch
                          checked={preferences.preferences}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, preferences: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={acceptSelected}
                      size="lg"
                      className="bg-gradient-to-r from-[#FFC703] to-[#FFC703] text-white hover:from-[#FFC703] hover:to-blue-800 hover:shadow-xl rounded-full font-medium shadow-lg"
                    >
                      Salva Preferenze
                    </Button>
                    <Button
                      onClick={() => setShowSettings(false)}
                      size="lg"
                      className="bg-white text-[#212529] hover:bg-[#dee2e6] rounded-full font-medium shadow-lg border-2 border-white"
                    >
                      Annulla
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
