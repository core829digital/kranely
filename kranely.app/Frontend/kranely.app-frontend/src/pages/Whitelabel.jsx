import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Globe, Upload, Check, ArrowRight, Star, Zap, Shield, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useRBAC from '../hooks/useRBAC';

const PLANS = [
  {
    name: 'Reseller Starter',
    price: '€49',
    period: '/month',
    color: 'border-white/10',
    accent: 'text-[#F0EBE8]/70',
    features: ['1 Custom Brand', 'Your logo & colors', 'Custom domain', 'Up to 10 clients'],
    cta: 'Start Reselling',
    popular: false,
  },
  {
    name: 'Reseller Pro',
    price: '€129',
    period: '/month',
    color: 'border-[#FFC703]/30',
    accent: 'text-[#FFC703]',
    features: ['Unlimited Brands', 'Full white-label UI', 'Custom domain + SSL', 'Unlimited clients', 'Priority support', 'Remove "Powered by Kranely"'],
    cta: 'Go Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    color: 'border-purple-500/20',
    accent: 'text-purple-400',
    features: ['Full source customization', 'Dedicated infrastructure', 'SLA guarantees', 'Dedicated account manager', 'Custom feature dev'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Whitelabel() {
  const { isAdmin } = useRBAC();
  const [brandName, setBrandName] = useState('Your Brand');
  const [primaryColor, setPrimaryColor] = useState('#FFC703');
  const [submitted, setSubmitted] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center">
        <div className="text-center p-8 bg-white/5 border border-white/10 rounded-2xl max-w-sm">
          <Shield size={40} className="text-[#FFC703] mx-auto mb-3" />
          <h2 className="text-[#F0EBE8] text-lg font-semibold mb-2">Admin Only</h2>
          <p className="text-[#F0EBE8]/50 text-sm">The Whitelabel section is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1A18]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFC703]/10 flex items-center justify-center">
              <Palette size={16} className="text-[#FFC703]" />
            </div>
            <span className="text-xs text-[#F0EBE8]/40 uppercase tracking-widest font-medium">Whitelabel Program</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Resell Kranely as Your Own App</h1>
          <p className="text-[#F0EBE8]/50 text-sm mt-2 max-w-xl">
            Fully rebrand the Kranely platform with your company's identity and offer it to your clients as your proprietary software.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Config Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6"
          >
            <h2 className="text-base font-semibold text-[#F0EBE8] flex items-center gap-2">
              <Palette size={16} className="text-[#FFC703]" /> Brand Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-[#F0EBE8]/60 mb-1.5 block">Brand Name</Label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Your Company Name"
                  className="bg-[#1C1A18] border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-[#F0EBE8]/60 mb-1.5 block">Primary Accent Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-[#1C1A18] border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40 rounded-xl flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#F0EBE8]/60 mb-1.5 block">Custom Domain</Label>
                <Input
                  placeholder="app.yourdomain.com"
                  className="bg-[#1C1A18] border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-[#F0EBE8]/60 mb-1.5 block">Logo Upload</Label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#FFC703]/30 transition-colors cursor-pointer">
                  <Upload size={24} className="text-[#F0EBE8]/30 mx-auto mb-2" />
                  <p className="text-xs text-[#F0EBE8]/40">Drop your logo here or <span className="text-[#FFC703]">browse</span></p>
                  <p className="text-[10px] text-[#F0EBE8]/30 mt-1">PNG, SVG • Max 2MB • Min 200×200px</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSubmitted(true)}
              className="w-full py-3 bg-[#FFC703] text-[#1C1A18] rounded-xl font-semibold hover:bg-[#e6b300] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,199,3,0.15)]"
            >
              {submitted ? (
                <><Check size={16} /> Request Submitted</>
              ) : (
                <><ArrowRight size={16} /> Request Whitelabel Setup</>
              )}
            </button>
            {submitted && (
              <p className="text-center text-xs text-[#FFC703]/70">
                ✓ Our team will contact you within 24 hours.
              </p>
            )}
          </motion.div>

          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <Eye size={14} className="text-[#FFC703]" />
              <span className="text-xs font-semibold text-[#F0EBE8]">Live Preview</span>
              <div className="ml-auto flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </div>
            {/* Mini Sidebar Mockup */}
            <div className="flex-1 bg-[#141210] rounded-xl overflow-hidden flex">
              <div className="w-48 border-r border-white/5" style={{ borderRightColor: `${primaryColor}20` }}>
                <div className="p-3 border-b border-white/5">
                  <span className="font-bold text-base" style={{ color: primaryColor }}>
                    {brandName}
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {['Dashboard', 'Clients', 'Quotes', 'Payments'].map((item, i) => (
                    <div
                      key={item}
                      className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${i === 0 ? 'text-[#1C1A18] font-semibold' : 'text-white/40'}`}
                      style={i === 0 ? { backgroundColor: primaryColor } : {}}
                    >
                      <div className={`w-2 h-2 rounded-sm ${i === 0 ? 'bg-[#1C1A18]/40' : 'bg-white/10'}`} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 p-3">
                <div className="h-2 rounded bg-white/5 w-1/2 mb-2" />
                <div className="h-1.5 rounded bg-white/5 w-3/4 mb-4" />
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-white/5 border border-white/5" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[#F0EBE8]/30 text-center mt-3">Preview updates in real-time</p>
          </motion.div>
        </div>

        {/* Pricing */}
        <div>
          <h2 className="text-lg font-bold text-[#F0EBE8] mb-2">Reseller Plans</h2>
          <p className="text-sm text-[#F0EBE8]/50 mb-6">Start reselling Kranely under your own brand today.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`relative bg-white/5 rounded-2xl border ${plan.color} p-6 flex flex-col ${plan.popular ? 'ring-1 ring-[#FFC703]/30' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#FFC703] text-[#1C1A18] text-xs font-bold rounded-full">
                    Best Value
                  </div>
                )}
                <p className="font-bold text-[#F0EBE8] mb-1">{plan.name}</p>
                <div className="mb-4">
                  <span className={`text-3xl font-bold ${plan.accent}`}>{plan.price}</span>
                  <span className="text-[#F0EBE8]/40 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={13} className="text-[#FFC703] mt-0.5 shrink-0" />
                      <span className="text-xs text-[#F0EBE8]/60">{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.popular ? 'bg-[#FFC703] text-[#1C1A18] hover:bg-[#e6b300]' : 'bg-white/10 text-[#F0EBE8] hover:bg-white/15 border border-white/10'}`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
