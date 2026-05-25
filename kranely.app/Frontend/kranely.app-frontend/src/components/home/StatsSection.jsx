import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function StatsSection() {
  const { t } = useTranslation();
  
  const stats = [
    { value: '10k+', label: t('landing.stats.quotes') },
    { value: '€50M+', label: t('landing.stats.projects') },
    { value: '70%', label: t('landing.stats.clients') },
    { value: '4.9/5', label: t('landing.stats.years') },
  ];

  return (
    <section className="py-20 bg-[#1C1A18] border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#FFC703]/5 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex flex-col items-center justify-center"
            >
              <h3 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFC703] to-[#ffda4d] mb-2">
                {stat.value}
              </h3>
              <p className="text-sm md:text-base text-[#F0EBE8]/60 font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}