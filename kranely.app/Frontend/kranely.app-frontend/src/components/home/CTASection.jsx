import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useClerk, useUser } from '@clerk/clerk-react';

export default function CTASection() {
  const { t } = useTranslation();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const handleAction = () => {
    if (isSignedIn) {
      navigate(createPageUrl('Dashboard'));
    } else {
      openSignIn({ redirectUrl: createPageUrl('Dashboard') });
    }
  };

  return (
    <section className="py-32 bg-[#1C1A18] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#FFC703]/10 rounded-full blur-[150px] pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
<motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
        >
          {t('landing.cta.title')} <br className="hidden md:block"/>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-[#F0EBE8]/60 mb-12 max-w-2xl mx-auto font-light"
        >
          {t('landing.cta.subtitle')}
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }}
        >
          <button 
             onClick={handleAction}
             className="px-10 py-5 bg-[#FFC703] text-[#1C1A18] rounded-full font-bold text-lg inline-flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,199,3,0.3)] group"
           >
              {t('landing.cta.cta')}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}