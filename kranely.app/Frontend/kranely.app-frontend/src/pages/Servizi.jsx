import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { createPageUrl } from '../utils';
import SEO from '../components/seo/SEO';
import {
  Users, FileText, Package, FolderKanban, CreditCard,
  FileArchive, MessageSquare, BarChart3, Settings, ArrowRight, Check
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Client CRM',
    description: 'A complete client management system built for installers. Track leads, active projects, contact history, and payment status in one view.',
    items: ['Contact database with notes', 'Lead pipeline tracking', 'Client portal access', 'Communication history'],
  },
  {
    icon: FileText,
    title: 'Quote Builder',
    description: 'Generate professional PDF quotes in seconds. Smart pricing engine with margin control, tax settings, and one-click send to clients.',
    items: ['PDF generation in seconds', 'Custom pricing templates', 'Digital signature support', 'Quote status tracking'],
  },
  {
    icon: Package,
    title: 'Supplier Network',
    description: 'Connect directly with your suppliers. Forward client requests, review counter-offers, and manage orders without leaving your workspace.',
    items: ['Direct supplier messaging', 'Request forwarding', 'Counter-offer management', 'Order status tracking'],
  },
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'From site survey to installation to sign-off. Track every phase of every site with your team in real time.',
    items: ['Site visit scheduling', 'Phase-by-phase tracking', 'Team assignment', 'Photo documentation'],
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Know exactly what has been paid, what is pending, and what is overdue. Send reminders and log payments without a separate accounting tool.',
    items: ['Invoice generation', 'Payment status board', 'Overdue alerts', 'Revenue reporting'],
  },
  {
    icon: FileArchive,
    title: 'Document Centre',
    description: 'All your certifications, contracts, and project photos in one secure place. Share specific files with clients or suppliers with one click.',
    items: ['Secure file storage', 'Client-facing document sharing', 'Certification library', 'PDF editing tools'],
  },
  {
    icon: MessageSquare,
    title: 'Team Messaging',
    description: 'Internal chat with role-based visibility. Collaborate on projects without creating WhatsApp groups that include the wrong people.',
    items: ['Project-linked threads', 'Role-based visibility', 'File attachments', 'Notification system'],
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Understand your business with clear metrics: revenue trends, quote conversion, project lead times, and supplier performance.',
    items: ['Revenue analytics', 'Quote conversion rate', 'Project performance', 'Supplier KPIs'],
  },
];

export default function Servizi() {
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
        title="Features | Kranely — Window & Door Management Platform"
        description="Kranely gives window and door installers a complete operating system: CRM, quotes, supplier network, projects, payments, documents and analytics in one place."
        keywords="window installer software features, door installer crm, quote builder, supplier network, project management serramentisti"
      />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#FFC703]/6 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC703]/10 border border-[#FFC703]/20 text-[#FFC703] text-sm mb-8"
          >
            <Settings size={14} />
            Platform Features
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]"
          >
            One workspace.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC703] to-[#e6b300]">
              Everything you need.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#F0EBE8]/55 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Eight core modules that replace the spreadsheets, WhatsApp groups, and disconnected tools that slow your installation business down.
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 2) * 0.1 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FFC703]/25 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FFC703]/10 flex items-center justify-center text-[#FFC703] mb-5 group-hover:scale-110 transition-transform">
                  <f.icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-[#F0EBE8]/55 text-sm leading-relaxed mb-5">{f.description}</p>
                <ul className="space-y-2">
                  {f.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-[#F0EBE8]/60">
                      <Check size={14} className="text-[#FFC703] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
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
              Ready to see it{' '}
              <span className="text-[#FFC703]">in action?</span>
            </h2>
            <p className="text-[#F0EBE8]/50 mb-8 text-lg">
              Start your free workspace and explore all features today.
            </p>
            <button
              onClick={handleCTA}
              className="px-8 py-4 bg-[#FFC703] text-[#1C1A18] rounded-full font-bold text-lg inline-flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,199,3,0.25)] group"
            >
              Start for free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
