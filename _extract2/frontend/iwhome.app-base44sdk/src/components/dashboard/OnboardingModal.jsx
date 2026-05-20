import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import {
  X,
  FileText,
  MessageSquare,
  Upload,
  Share2,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles
} from 'lucide-react';

const steps = [
  {
    title: 'Benvenuto nell\'Area Privata! 🎉',
    description: 'Ti guideremo attraverso le principali funzionalità della tua area personale.',
    icon: Sparkles,
    color: 'from-blue-500 to-purple-500'
  },
  {
    title: 'Gestisci i tuoi Documenti 📄',
    description: 'Carica, organizza e condividi documenti in modo sicuro. Preventivi, contratti, fatture - tutto in un unico posto.',
    icon: FileText,
    color: 'from-green-500 to-teal-500'
  },
  {
    title: 'Carica File 📤',
    description: 'Trascina i file o clicca per caricarli. Supportiamo tutti i formati: PDF, immagini, video e molto altro.',
    icon: Upload,
    color: 'from-orange-500 to-red-500'
  },
  {
    title: 'Condividi con il Team 🤝',
    description: 'Condividi documenti con collaboratori e con l\'azienda. Gestisci i permessi in modo granulare.',
    icon: Share2,
    color: 'from-pink-500 to-rose-500'
  },
  {
    title: 'Chat Live 💬',
    description: 'Comunica in tempo reale con il team. Invia messaggi, file, foto, video, audio, crea sondaggi ed eventi!',
    icon: MessageSquare,
    color: 'from-indigo-500 to-blue-500'
  },
  {
    title: 'Sei Pronto! ✨',
    description: 'Ora puoi iniziare a utilizzare tutte le funzionalità dell\'area privata. Buon lavoro!',
    icon: Check,
    color: 'from-yellow-500 to-orange-500'
  }
];

export default function OnboardingModal({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsClosing(true);
    await base44.auth.updateMe({ onboarding_completed: true });
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleSkip = async () => {
    await base44.auth.updateMe({ onboarding_completed: true });
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: isClosing ? 0.9 : 1, opacity: isClosing ? 0 : 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-[#343a40] to-[#495057] rounded-3xl shadow-2xl border border-[#f8f9fa]/20 max-w-2xl w-full overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 pb-8">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-[#adb5bd] hover:text-[#f8f9fa] transition-colors"
            >
              <X size={24} />
            </button>

            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full flex-1 transition-all ${
                    index <= currentStep ? 'bg-gradient-to-r ' + step.color : 'bg-[#6c757d]'
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <motion.div
              key={currentStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-xl`}
            >
              <Icon size={40} className="text-white" />
            </motion.div>

            {/* Content */}
            <motion.div
              key={currentStep + 'content'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h2 className="text-3xl font-medium text-[#f8f9fa] mb-4">
                {step.title}
              </h2>
              <p className="text-[#dee2e6] text-lg leading-relaxed max-w-lg mx-auto">
                {step.description}
              </p>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="bg-[#212529]/50 p-6 flex items-center justify-between">
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              variant="ghost"
              className="text-[#dee2e6] hover:text-[#f8f9fa] disabled:opacity-30"
            >
              <ArrowLeft size={18} className="mr-2" />
              Indietro
            </Button>

            <div className="text-sm text-[#adb5bd]">
              {currentStep + 1} / {steps.length}
            </div>

            <Button
              onClick={handleNext}
              className={`bg-gradient-to-r ${step.color} text-white hover:shadow-xl`}
            >
              {currentStep === steps.length - 1 ? 'Inizia' : 'Avanti'}
              {currentStep === steps.length - 1 ? (
                <Check size={18} className="ml-2" />
              ) : (
                <ArrowRight size={18} className="ml-2" />
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}