import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { createPageUrl } from '../utils';
import SEO from '../components/seo/SEO';
import { Check, Zap, Building2, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    icon: Zap,
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: 'For solo installers getting started.',
    highlight: false,
    features: [
      'Up to 50 clients',
      'Unlimited quotes',
      'PDF generation',
      '1 user seat',
      'Document storage (5 GB)',
      'Email support',
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Pro',
    icon: Building2,
    monthlyPrice: 99,
    yearlyPrice: 79,
    description: 'For growing installation companies.',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Unlimited clients',
      'Unlimited quotes',
      'Supplier network access',
      'Up to 10 user seats',
      'Document storage (50 GB)',
      'Project management module',
      'Payment tracking',
      'Analytics dashboard',
      'Priority support',
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Enterprise',
    icon: Building2,
    monthlyPrice: null,
    yearlyPrice: null,
    description: 'Custom plans for large operations.',
    highlight: false,
    features: [
      'Everything in Pro',
      'Unlimited user seats',
      'White-label branding',
      'Custom domain',
      'SSO / SAML',
      'Dedicated onboarding',
      'SLA agreement',
      'Custom integrations',
    ],
    cta: 'Contact sales',
  },
];

export default function PublicPricing() {
  const [yearly, setYearly] = useState(false);
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const handleCTA = (plan) => {
    if (plan.name === 'Enterprise') {
      navigate(createPageUrl('Contact'));
      return;
    }
    if (isSignedIn) navigate(createPageUrl('Dashboard'));
    else openSignIn({ redirectUrl: createPageUrl('Dashboard') });
  };

  return (
    <div className="bg-[#1C1A18]">
      <SEO
        title="Pricing | Kranely — Window & Door Management Platform"
        description="Simple, transparent pricing for window and door installation professionals. Starter from €49/mo. No hidden fees."
        keywords="kranely pricing, window installer software cost, serramentisti crm price"
      />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFC703]/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC703]/10 border border-[#FFC703]/20 text-[#FFC703] text-sm mb-8"
          >
            Transparent pricing
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-white mb-5 tracking-tight"
          >
            Simple pricing.{' '}
            <span className="text-[#FFC703]">No surprises.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#F0EBE8]/55 font-light mb-10"
          >
            All plans include a 14-day free trial. Cancel any time.
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-3 p-1 rounded-full bg-white/5 border border-white/10"
          >
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!yearly ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${yearly ? 'bg-[#FFC703] text-[#1C1A18]' : 'text-white/40 hover:text-white/60'}`}
            >
              Yearly
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${yearly ? 'bg-[#1C1A18]/20 text-[#1C1A18]' : 'bg-[#FFC703]/15 text-[#FFC703]'}`}>
                −20%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-2xl border flex flex-col ${
                  plan.highlight
                    ? 'bg-[#FFC703]/8 border-[#FFC703]/30 shadow-[0_0_40px_rgba(255,199,3,0.1)]'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFC703] text-[#1C1A18] rounded-full text-xs font-bold">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${plan.highlight ? 'text-[#FFC703]' : 'text-[#F0EBE8]/40'}`}>
                    {plan.name}
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    {plan.monthlyPrice ? (
                      <>
                        <span className="text-4xl font-bold text-white">
                          €{yearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-[#F0EBE8]/40 text-sm mb-1">/mo</span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-white">Custom</span>
                    )}
                  </div>
                  {plan.monthlyPrice && yearly && (
                    <div className="text-xs text-[#FFC703]/70">Billed annually · Save €{(plan.monthlyPrice - plan.yearlyPrice) * 12}/yr</div>
                  )}
                  <p className="text-sm text-[#F0EBE8]/50 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-[#F0EBE8]/65">
                      <Check size={14} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-[#FFC703]' : 'text-[#FFC703]/60'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCTA(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all group ${
                    plan.highlight
                      ? 'bg-[#FFC703] text-[#1C1A18] hover:opacity-90 shadow-[0_0_20px_rgba(255,199,3,0.2)]'
                      : 'bg-white/8 text-white hover:bg-white/15 border border-white/10'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-[#F0EBE8]/30 mt-10">
            All prices excl. VAT · Secure payment via Stripe · Cancel any time
          </p>
        </div>
      </section>
    </div>
  );
}
