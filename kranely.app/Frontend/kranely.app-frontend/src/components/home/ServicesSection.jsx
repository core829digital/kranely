import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users, FileText, CheckSquare, BarChart, Smartphone, HardHat } from 'lucide-react';

export default function ServicesSection() {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: <Users size={24} />,
      title: t('landing.services.crm.title'),
      description: t('landing.services.crm.description')
    },
    {
      icon: <FileText size={24} />,
      title: t('landing.services.quotes.title'),
      description: t('landing.services.quotes.description')
    },
    {
      icon: <CheckSquare size={24} />,
      title: t('landing.services.suppliers.title'),
      description: t('landing.services.suppliers.description')
    },
    {
      icon: <BarChart size={24} />,
      title: t('landing.services.reports.title'),
      description: t('landing.services.reports.description')
    }
  ];

  return (
    <section className="py-32 bg-[#1C1A18] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FFC703]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {t('landing.services.title')} <br />
            <span className="text-[#FFC703] font-light">{t('landing.services.subtitle').split(' ').slice(0,2).join(' ')}</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#F0EBE8]/60 max-w-2xl mx-auto"
          >
            {t('landing.services.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FFC703]/30 transition-all group backdrop-blur-sm"
            >
              <div className="w-14 h-14 rounded-xl bg-[#FFC703]/10 flex items-center justify-center text-[#FFC703] mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-[#F0EBE8]/60 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
