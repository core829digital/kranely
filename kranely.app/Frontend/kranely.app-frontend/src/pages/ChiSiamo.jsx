import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { createPageUrl } from '../utils';
import SEO from '../components/seo/SEO';
import { Zap, Shield, Globe, HeartHandshake, ArrowRight, Users, Building2, TrendingUp } from 'lucide-react';

const values = [
  {
    icon: Zap,
    title: 'Speed',
    description: 'From quote to signed contract in minutes, not hours.',
    details: 'We built Kranely around the reality that installers lose jobs because competitors move faster. Our automated quoting engine generates professional PDFs in seconds.'
  },
  {
    icon: Shield,
    title: 'Reliability',
    description: 'Enterprise-grade infrastructure you can count on.',
    details: 'Built on Convex real-time database with 99.9% uptime SLA. Your data is always available, always in sync across your entire team.'
  },
  {
    icon: Globe,
    title: 'Multilingual',
    description: 'Native support for EN, IT, FR, ES, DE.',
    details: 'Whether your team speaks Italian in Milan or German in Munich, Kranely speaks their language. Full UI localisation with industry-specific terminology.'
  },
  {
    icon: HeartHandshake,
    title: 'Support',
    description: 'Real humans who understand your industry.',
    details: 'Our support team includes former window and door installers. When you have a question, you get an answer from someone who has actually installed windows.'
  }
];

const stats = [
  { value: '500+', label: 'Companies onboarded' },
  { value: '€80M+', label: 'Quotes processed' },
  { value: '4.9/5', label: 'Customer satisfaction' },
  { value: '12+', label: 'Countries' },
];

export default function ChiSiamo() {
  const { t } = useTranslation();
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
        title="About Kranely | Window & Door Management Platform"
        description="Kranely is the all-in-one SaaS platform built for window and door installation professionals. Manage clients, quotes, suppliers, projects and payments in one place."
        keywords="about Kranely, window installer software, serramentisti platform, door installation crm, saas for installers"
      />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#FFC703]/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC703]/10 border border-[#FFC703]/20 text-[#FFC703] text-sm mb-8"
          >
            <Building2 size={14} />
            About Kranely
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]"
          >
            Built by installers,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC703] to-[#e6b300]">
              for installers.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#F0EBE8]/60 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Kranely was founded with one mission: eliminate the administrative chaos that keeps window and door professionals from doing what they do best — installing.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl font-bold text-[#FFC703] mb-1">{s.value}</div>
                <div className="text-sm text-[#F0EBE8]/50 uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 text-[#FFC703] text-sm uppercase tracking-wider mb-4">
                <TrendingUp size={14} />
                Our Mission
              </div>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Replace spreadsheets and WhatsApp with a real operating system.
              </h2>
              <div className="space-y-4 text-[#F0EBE8]/60 leading-relaxed">
                <p>
                  Most window installers still run their business on Excel, WhatsApp groups, and paper invoices. That costs them money, clients, and growth.
                </p>
                <p>
                  Kranely gives small and mid-size installation companies the same operational clarity that large enterprises have — without the enterprise price tag or the complexity.
                </p>
                <p>
                  From the first client enquiry to the final payment, every step lives in one workspace that your whole team can access in real time.
                </p>
              </div>
              <motion.button
                onClick={handleCTA}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 px-7 py-3.5 bg-[#FFC703] text-[#1C1A18] rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,199,3,0.2)]"
              >
                Try Kranely free
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Users, label: 'Team collaboration', sub: 'Real-time sync across all roles' },
                { icon: Shield, label: 'RBAC security', sub: 'Admin, staff, supplier, client' },
                { icon: Globe, label: '5 languages', sub: 'EN · IT · FR · ES · DE' },
                { icon: Zap, label: 'Instant quotes', sub: 'PDF in seconds, not hours' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FFC703]/20 transition-all"
                >
                  <item.icon size={22} className="text-[#FFC703] mb-3" />
                  <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
                  <div className="text-xs text-[#F0EBE8]/50">{item.sub}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our principles</h2>
            <p className="text-[#F0EBE8]/50 max-w-xl mx-auto">
              Four commitments that guide every product decision we make.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FFC703]/25 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FFC703]/10 flex items-center justify-center text-[#FFC703] mb-5 group-hover:scale-110 transition-transform">
                  <v.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{v.title}</h3>
                <p className="text-[#F0EBE8]/70 text-sm font-medium mb-3">{v.description}</p>
                <p className="text-[#F0EBE8]/45 text-sm leading-relaxed">{v.details}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Join the next generation of{' '}
              <span className="text-[#FFC703]">installers.</span>
            </h2>
            <p className="text-[#F0EBE8]/50 mb-8 text-lg">
              Start your free workspace today. No credit card required.
            </p>
            <button
              onClick={handleCTA}
              className="px-8 py-4 bg-[#FFC703] text-[#1C1A18] rounded-full font-bold text-lg inline-flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,199,3,0.25)] group"
            >
              Get started free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
