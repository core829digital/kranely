import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import useRBAC from '../hooks/useRBAC';
import {
  HardDrive, Cloud, AlertCircle, Check, Zap, Star, Shield, Infinity as InfinityIcon,
  Upload, FileText, Image, ArrowRight, TrendingUp
} from 'lucide-react';

const STORAGE_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: <HardDrive size={22} className="text-[#F0EBE8]/60" />,
    storage: '5 GB',
    price: 'Free',
    priceUnit: '',
    color: 'border-white/10',
    accentColor: 'text-[#F0EBE8]/60',
    badgeColor: 'bg-white/5',
    features: [
      '5 GB of secure cloud storage',
      'Documents & PDF uploads',
      'Basic file management',
      '30-day file retention',
    ],
    current: true,
    cta: 'Current Plan',
    ctaDisabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: <Star size={22} className="text-[#FFC703]" />,
    storage: '50 GB',
    price: '€9',
    priceUnit: '/month',
    color: 'border-[#FFC703]/30',
    accentColor: 'text-[#FFC703]',
    badgeColor: 'bg-[#FFC703]/10',
    popular: true,
    features: [
      '50 GB of secure cloud storage',
      'Unlimited file types',
      'Advanced file previews',
      'Priority storage access',
      '1-year file retention',
    ],
    current: false,
    cta: 'Upgrade to Pro',
    ctaDisabled: false,
  },
  {
    id: 'business',
    name: 'Business',
    icon: <Shield size={22} className="text-emerald-400" />,
    storage: '500 GB',
    price: '€29',
    priceUnit: '/month',
    color: 'border-emerald-500/20',
    accentColor: 'text-emerald-400',
    badgeColor: 'bg-emerald-500/10',
    features: [
      '500 GB of secure cloud storage',
      'Team-wide storage access',
      'Bulk upload & download',
      'Storage analytics dashboard',
      'Indefinite file retention',
      'Priority support',
    ],
    current: false,
    cta: 'Upgrade to Business',
    ctaDisabled: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <InfinityIcon size={22} className="text-purple-400" />,
    storage: 'Unlimited',
    price: 'Custom',
    priceUnit: '',
    color: 'border-purple-500/20',
    accentColor: 'text-purple-400',
    badgeColor: 'bg-purple-500/10',
    features: [
      'Unlimited secure storage',
      'Dedicated storage nodes',
      'Custom retention policies',
      'SLA guarantees',
      'Dedicated account manager',
      'Custom integrations',
    ],
    current: false,
    cta: 'Contact Sales',
    ctaDisabled: false,
  },
];

export default function Storage() {
  const { isAdmin } = useRBAC();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const storageData = useQuery(api.storageStats.getStats);

  // Calculate usage percentage
  const usedBytes = storageData?.totalSizeBytes || 0;
  const limitBytes = 5 * 1024 * 1024 * 1024; // 5GB (Free tier)
  const usagePercent = Math.min(100, (usedBytes / limitBytes) * 100);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-[#1C1A18]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#FFC703]/10 flex items-center justify-center">
              <Cloud size={16} className="text-[#FFC703]" />
            </div>
            <span className="text-xs text-[#F0EBE8]/40 uppercase tracking-widest font-medium">Storage Manager</span>
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">Storage & Space</h1>
          <p className="text-[#F0EBE8]/50 text-sm mt-1">Manage your workspace storage and upgrade your plan.</p>
        </motion.div>

        {/* Current Usage Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-[#F0EBE8] mb-1">Current Usage</h2>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold text-[#FFC703]">{formatBytes(usedBytes)}</span>
                <span className="text-[#F0EBE8]/40 text-sm mb-1">of 5 GB used</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className={`h-2.5 rounded-full ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-[#FFC703]'}`}
                />
              </div>
              <p className="text-xs text-[#F0EBE8]/40 mt-2">{usagePercent.toFixed(1)}% of your free storage used</p>
            </div>
            
            {/* Stats Mini Grid */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 shrink-0">
              {[
                { label: 'Files', value: storageData?.totalFiles || '—', icon: <FileText size={14} /> },
                { label: 'Documents', value: storageData?.documentCount || '—', icon: <FileText size={14} /> },
                { label: 'Images', value: storageData?.imageCount || '—', icon: <Image size={14} /> },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-1 text-[#FFC703]/50">{stat.icon}</div>
                  <p className="text-xl font-bold text-[#F0EBE8]">{stat.value}</p>
                  <p className="text-[10px] text-[#F0EBE8]/40 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {usagePercent > 70 && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle size={14} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">You're using over {Math.round(usagePercent)}% of your storage. Consider upgrading.</p>
            </div>
          )}
        </motion.div>

        {/* Plan Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#F0EBE8] mb-2">Storage Plans</h2>
          <p className="text-sm text-[#F0EBE8]/50 mb-6">Choose the plan that fits your workflow.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {STORAGE_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className={`relative flex flex-col bg-white/5 rounded-2xl border ${plan.color} p-6 transition-all hover:bg-white/8 ${plan.popular ? 'ring-1 ring-[#FFC703]/30' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#FFC703] text-[#1C1A18] text-xs font-bold rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                {plan.current && (
                  <div className="absolute -top-3 left-4 px-3 py-0.5 bg-white/10 border border-white/20 text-[#F0EBE8]/70 text-xs font-medium rounded-full">
                    Current
                  </div>
                )}

                {/* Header */}
                <div className={`w-12 h-12 rounded-xl ${plan.badgeColor} flex items-center justify-center mb-4`}>
                  {plan.icon}
                </div>
                <h3 className="text-base font-bold text-[#F0EBE8] mb-0.5">{plan.name}</h3>
                <p className={`text-xs ${plan.accentColor} font-medium mb-4`}>{plan.storage} Storage</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-bold text-[#F0EBE8]">{plan.price}</span>
                  <span className="text-[#F0EBE8]/40 text-sm">{plan.priceUnit}</span>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check size={13} className="text-[#FFC703] shrink-0 mt-0.5" />
                      <span className="text-xs text-[#F0EBE8]/60 leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  disabled={plan.ctaDisabled}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    plan.ctaDisabled
                      ? 'bg-white/5 text-[#F0EBE8]/30 cursor-default'
                      : plan.popular
                        ? 'bg-[#FFC703] text-[#1C1A18] hover:bg-[#e6b300] shadow-[0_0_20px_rgba(255,199,3,0.2)]'
                        : 'bg-white/10 text-[#F0EBE8] hover:bg-white/15 border border-white/10'
                  }`}
                >
                  {plan.cta}
                  {!plan.ctaDisabled && <ArrowRight size={14} />}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* File Type Breakdown (placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#FFC703]" />
            <h3 className="text-sm font-semibold text-[#F0EBE8]">Storage Breakdown</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'PDF Documents', percent: 65, color: 'bg-[#FFC703]' },
              { label: 'Images', percent: 22, color: 'bg-emerald-400' },
              { label: 'Other Files', percent: 13, color: 'bg-purple-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-[#F0EBE8]/60 mb-1">
                  <span>{item.label}</span>
                  <span>{item.percent}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className={`h-1.5 rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
