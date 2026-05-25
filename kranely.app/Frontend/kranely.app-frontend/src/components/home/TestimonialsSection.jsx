import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReviewCarousel from '../reviews/ReviewCarousel';
import { ArrowRight } from 'lucide-react';

export default function TestimonialsSection() {
  const { t } = useTranslation();
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#C9A962] text-sm tracking-widest uppercase">{t('landing.testimonials.title')}</span>
          <h2 className="text-3xl lg:text-4xl font-light text-[#2D3B35] mt-4">
            {t('landing.testimonials.title')}
          </h2>
        </motion.div>

        <ReviewCarousel />

        <div className="text-center mt-8">
          <Link to={createPageUrl('Recensioni')}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 text-[#C9A962] hover:text-[#d4b76d] transition-colors"
            >
              Vedi tutte le recensioni
              <ArrowRight size={18} />
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
}