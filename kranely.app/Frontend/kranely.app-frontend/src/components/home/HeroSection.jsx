import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (isSignedIn) {
      navigate(createPageUrl('Dashboard'));
    } else {
      openSignIn({ redirectUrl: createPageUrl('Dashboard') });
    }
  };

  const y = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1C1A18] pt-20">

      {/* Huly.io Style Background: Grid + Glowing Orbs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FFC703]/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#e6b300]/10 rounded-full blur-[150px]"
        />
      </div>

      {/* Main SaaS Content */}
      <div className="relative z-30 max-w-5xl mx-auto px-6 text-center mt-20">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC703]/10 border border-[#FFC703]/20 text-[#FFC703] text-sm mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#FFC703] animate-pulse" />
          {t('landing.hero.badge')}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-8 tracking-tight leading-[1.1]"
        >
          {t('landing.hero.title')} <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC703] via-[#ffda4d] to-[#e6b300]">
            {t('landing.hero.title_accent')}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-[#F0EBE8]/60 text-lg md:text-2xl max-w-3xl mx-auto mb-10 leading-relaxed font-light"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            onClick={handleCTA}
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255, 199, 3, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            className="group px-8 py-4 bg-[#FFC703] text-[#1C1A18] rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,199,3,0.2)]"
          >
            {t('landing.hero.cta')}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      {/* Floating Mockup (Huly.io trick) */}
      <motion.div
        style={{ y }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="relative z-20 mt-20 w-full max-w-6xl mx-auto px-4"
      >
        <div className="rounded-2xl border border-white/10 bg-[#212529]/80 backdrop-blur-xl p-2 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 mb-4 px-4 pt-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="h-[40vh] md:h-[60vh] bg-[#1C1A18] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
             {/* Abstract Dashboard representation */}
             <div className="absolute top-8 left-8 w-64 h-32 bg-white/5 rounded-xl border border-white/10" />
             <div className="absolute top-8 right-8 w-64 h-32 bg-[#FFC703]/10 border border-[#FFC703]/20 rounded-xl flex items-center justify-center">
                <span className="text-[#FFC703] font-mono text-4xl">€14k</span>
             </div>
             <div className="absolute bottom-8 left-8 right-8 h-48 bg-white/5 rounded-xl border border-white/10" />
          </div>
        </div>
      </motion.div>
      
    </section>
  );
}
