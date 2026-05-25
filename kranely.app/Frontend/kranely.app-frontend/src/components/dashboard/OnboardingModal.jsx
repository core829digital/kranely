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
    title: 'Welcome to Kranely!',
    description: 'Let us walk you through the main features of your private workspace.',
    icon: Sparkles,
    color: 'from-[#FFC703] to-[#FFC703]/60'
  },
  {
    title: 'Manage your Documents',
    description: 'Upload, organise, and securely share documents. Quotes, contracts, invoices — all in one place.',
    icon: FileText,
    color: 'from-[#FFC703]/80 to-[#FFC703]/40'
  },
  {
    title: 'Upload Files',
    description: 'Drag and drop or click to upload. We support all formats: PDFs, images, and more.',
    icon: Upload,
    color: 'from-[#FFC703]/60 to-[#535252]'
  },
  {
    title: 'Share with Your Team',
    description: 'Share documents with collaborators and the company. Manage permissions granularly.',
    icon: Share2,
    color: 'from-[#535252] to-[#1C1A18]'
  },
  {
    title: 'Live Chat',
    description: 'Communicate in real time with your team. Send messages, files, photos, create polls and events!',
    icon: MessageSquare,
    color: 'from-[#FFC703] to-[#FFC703]/50'
  },
  {
    title: 'You\'re all set!',
    description: 'Start using all the features of your private workspace. Good luck!',
    icon: Check,
    color: 'from-[#FFC703]/70 to-[#535252]'
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
          className="bg-gradient-to-br from-[#1C1A18] to-[#535252] rounded-3xl shadow-2xl border border-white/10 max-w-2xl w-full overflow-hidden"
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
              Back
            </Button>

            <div className="text-sm text-[#adb5bd]">
              {currentStep + 1} / {steps.length}
            </div>

            <Button
              onClick={handleNext}
              className={`bg-gradient-to-r ${step.color} text-white hover:shadow-xl`}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
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
