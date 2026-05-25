import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { createPageUrl } from '../utils';
import SEO from '../components/seo/SEO';
import { Star, ArrowRight, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Marco Bianchi',
    company: 'Serramenti Bianchi SRL',
    country: 'IT',
    rating: 5,
    text: 'Kranely halved the time I spend on quotes. What used to take me an hour now takes five minutes. My clients get a professional PDF the same day they call.',
  },
  {
    name: 'Thomas Müller',
    company: 'Fenster & Türen GmbH',
    country: 'DE',
    rating: 5,
    text: 'The supplier network module alone is worth the subscription. I forward requests to my suppliers directly in the platform and get counter-offers the same day.',
  },
  {
    name: 'Sophie Dupont',
    company: 'Menuiserie Dupont',
    country: 'FR',
    rating: 5,
    text: 'Finally a tool that understands how we work. The project tracking with sopralluogo phases is exactly what we needed. Our team of 8 is fully coordinated now.',
  },
  {
    name: 'Luca Ferrari',
    company: 'Ferrari Infissi',
    country: 'IT',
    rating: 5,
    text: 'I tried three other tools before Kranely. Nothing else had all the pieces in one place — clients, quotes, suppliers, payments. This is the one.',
  },
  {
    name: 'Carlos García',
    company: 'Ventanas García',
    country: 'ES',
    rating: 5,
    text: 'The white-label feature lets me show clients a branded portal. It looks like we built a custom app just for them. It has made us look much bigger than we are.',
  },
  {
    name: 'Roberto Martini',
    company: 'Martini Serramentista',
    country: 'IT',
    rating: 5,
    text: 'Payment tracking was always my weak point. Now I see exactly what is paid, what is due, and what is overdue. I recover more revenue every month.',
  },
];

const stats = [
  { value: '4.9', label: 'Average rating', sub: 'out of 5' },
  { value: '500+', label: 'Active companies', sub: 'across Europe' },
  { value: '98%', label: 'Retention rate', sub: 'after 6 months' },
];

export default function Recensioni() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (isSignedIn) navigate(createPageUrl('Dashboard'));
    else openSignIn({ redirectUrl: createPageUrl('Dashboard') });
  };

  return (
    <div className="bg-[#1C1A18]">
      <SEO
        title="Customer Reviews | Kranely — Window & Door Management Platform"
        description="See what window and door installation professionals across Europe say about Kranely. Real reviews from real serramentisti."
        keywords="kranely reviews, window installer software review, serramentisti crm testimonials"
      />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFC703]/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-1 mb-6"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={22} className="fill-[#FFC703] text-[#FFC703]" />
            ))}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-white mb-5 tracking-tight"
          >
            Trusted by installers{' '}
            <span className="text-[#FFC703]">across Europe.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#F0EBE8]/55 max-w-2xl mx-auto font-light"
          >
            Real feedback from window and door industry professionals who use Kranely every day.
          </motion.p>
        </div>
      </section>

      <section className="py-12 border-y border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl font-bold text-[#FFC703] mb-0.5">{s.value}</div>
                <div className="text-sm text-white/70 font-medium">{s.label}</div>
                <div className="text-xs text-white/35">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1 }}
                className="p-7 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FFC703]/20 transition-all flex flex-col gap-5"
              >
                <Quote size={20} className="text-[#FFC703]/40" />
                <p className="text-[#F0EBE8]/70 text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/8">
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-[#F0EBE8]/40">{t.company}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={12} className="fill-[#FFC703] text-[#FFC703]" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Join them and transform your{' '}
              <span className="text-[#FFC703]">workflow.</span>
            </h2>
            <p className="text-[#F0EBE8]/50 mb-8 text-lg">Free to start. No credit card required.</p>
            <button
              onClick={handleCTA}
              className="px-8 py-4 bg-[#FFC703] text-[#1C1A18] rounded-full font-bold text-lg inline-flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,199,3,0.25)] group"
            >
              Start free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}