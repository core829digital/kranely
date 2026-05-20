import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useClerk, useUser } from '@clerk/clerk-react';
import { ArrowRight, Palette, Globe, Zap, Shield, Users, Check, Star } from 'lucide-react';

const PLANS = [
  {
    name: 'Solo',
    desc: 'Perfect for individual professionals',
    price: '€29',
    period: '/month',
    storage: '10 GB',
    users: '1 user',
    features: [
      'Full platform access',
      'All core modules',
      '10 GB storage',
      'Client portal',
      'Email support',
    ],
    popular: false,
    ctaText: 'Start Solo Plan',
    color: 'border-white/10',
  },
  {
    name: 'Team',
    desc: 'For growing installation businesses',
    price: '€79',
    period: '/month',
    storage: '100 GB',
    users: 'Up to 10 users',
    features: [
      'Everything in Solo',
      'Team collaboration tools',
      'Advanced CRM',
      '100 GB storage',
      'Whitelabel branding',
      'Priority support',
    ],
    popular: true,
    ctaText: 'Start Team Plan',
    color: 'border-[#FFC703]/30',
  },
  {
    name: 'Enterprise',
    desc: 'Custom solution for large operations',
    price: 'Custom',
    period: '',
    storage: 'Unlimited',
    users: 'Unlimited users',
    features: [
      'Everything in Team',
      'Dedicated infrastructure',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated account manager',
      'Full source white-label',
    ],
    popular: false,
    ctaText: 'Contact Sales',
    color: 'border-purple-500/20',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose Your Plan',
    desc: 'Select the plan that fits your business size and needs. Cancel anytime.',
    icon: <Star size={20} className="text-[#FFC703]" />,
  },
  {
    step: '02',
    title: 'Configure & Customize',
    desc: 'Set up your brand, upload your logo, and configure your workspace in minutes.',
    icon: <Palette size={20} className="text-[#FFC703]" />,
  },
  {
    step: '03',
    title: 'Launch & Scale',
    desc: 'Invite your team, onboard clients, and manage your entire workflow from day one.',
    icon: <Zap size={20} className="text-[#FFC703]" />,
  },
];

export default function RentYourApp() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const handleStart = () => {
    if (isSignedIn) navigate(createPageUrl('Whitelabel'));
    else openSignIn({ redirectUrl: createPageUrl('Whitelabel') });
  };

  return (
    <div className="min-h-screen bg-[#1C1A18] text-[#F0EBE8]">
      
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
        <motion.div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#FFC703]/8 rounded-full blur-[120px]" animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 12, repeat: Infinity }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center pt-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC703]/10 border border-[#FFC703]/20 text-[#FFC703] text-sm mb-8">
              <Palette size={13} />
              Rent-Your-App — Powered by Kranely
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Your business.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC703] to-[#ffda4d]">
                Your platform.
              </span>
            </h1>
            <p className="text-xl text-[#F0EBE8]/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Rent the full Kranely infrastructure under your own brand. 
              Manage clients, quotes, suppliers and projects — with your name on it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={handleStart}
                whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(255,199,3,0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-[#FFC703] text-[#1C1A18] rounded-full font-bold text-base flex items-center justify-center gap-2 group"
              >
                Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <a href="#pricing" className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-medium text-[#F0EBE8] hover:bg-white/10 transition-all text-center">
                See Pricing
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">How it works</h2>
            <p className="text-[#F0EBE8]/50">From sign-up to live platform in under 24 hours.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-black text-white/5 absolute top-0 right-0 leading-none">{step.step}</div>
                <div className="w-12 h-12 rounded-xl bg-[#FFC703]/10 flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="font-bold text-[#F0EBE8] mb-2">{step.title}</h3>
                <p className="text-sm text-[#F0EBE8]/50 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Everything included</h2>
          <p className="text-[#F0EBE8]/50 text-center mb-12">Every plan includes the full Kranely feature set.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Users size={18} />, label: 'Full CRM' },
              { icon: <Globe size={18} />, label: 'Custom Domain' },
              { icon: <Palette size={18} />, label: 'Brand Customization' },
              { icon: <Zap size={18} />, label: 'Instant Quotes' },
              { icon: <Shield size={18} />, label: 'GDPR Compliant' },
              { icon: <Star size={18} />, label: 'Supplier Network' },
              { icon: <Check size={18} />, label: 'Project Tracker' },
              { icon: <ArrowRight size={18} />, label: 'Payment Modules' },
            ].map((feat) => (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/8 rounded-xl p-4 flex items-center gap-3 hover:border-[#FFC703]/20 transition-colors"
              >
                <div className="text-[#FFC703]">{feat.icon}</div>
                <span className="text-sm text-[#F0EBE8]/80 font-medium">{feat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-[#F0EBE8]/50 text-center mb-12">No surprise fees. Start small, scale up anytime.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white/5 rounded-2xl border ${plan.color} p-6 flex flex-col ${plan.popular ? 'ring-1 ring-[#FFC703]/30' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#FFC703] text-[#1C1A18] text-xs font-bold rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <p className="font-bold text-[#F0EBE8] text-lg">{plan.name}</p>
                  <p className="text-xs text-[#F0EBE8]/40 mt-0.5">{plan.desc}</p>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-[#F0EBE8]/40 text-sm">{plan.period}</span>
                </div>
                <div className="flex gap-3 mb-5 text-xs text-[#F0EBE8]/40">
                  <span>💾 {plan.storage}</span>
                  <span>👥 {plan.users}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={13} className="text-[#FFC703] shrink-0" />
                      <span className="text-xs text-[#F0EBE8]/60">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleStart}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.popular ? 'bg-[#FFC703] text-[#1C1A18] hover:bg-[#e6b300] shadow-[0_0_20px_rgba(255,199,3,0.2)]' : 'bg-white/10 border border-white/10 text-[#F0EBE8] hover:bg-white/15'}`}
                >
                  {plan.ctaText}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
