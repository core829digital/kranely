import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Shield, Mail } from 'lucide-react';

const h2 = "text-xl font-semibold text-[#F0EBE8] mt-10 mb-3 pb-2 border-b border-white/8";
const h3 = "text-base font-semibold text-[#FFC703]/80 mt-6 mb-2";
const p  = "text-[#F0EBE8]/70 text-sm leading-relaxed mb-3";
const h4 = "text-sm font-semibold text-[#F0EBE8]/90 mt-4 mb-1";

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#1C1A18] text-[#F0EBE8]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFC703]/5 rounded-full blur-[100px]" />
        <div className="max-w-4xl mx-auto px-6 py-20 relative z-10 pt-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC703]/10 border border-[#FFC703]/20">
              <Shield size={13} className="text-[#FFC703]" />
              <span className="text-[#FFC703] text-xs font-medium">Legal Document</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-[#F0EBE8]/50 text-sm">Last updated: July 23, 2025 — Kranely Platform</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto px-6 pb-24"
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12">
          <p className={p}>
            This Application collects some Personal Data from its Users. This document can be printed using the print command 
            present in the settings of any browser.
          </p>

          <h2 className={h2}>Data Controller</h2>
          <p className={p}><strong className="text-[#F0EBE8]">Kranely</strong> — Windows and construction site management platform.</p>
          <p className={p}>
            <strong className="text-[#F0EBE8]">Controller Email:</strong>{' '}
            <a href="mailto:info@kranely.app" className="text-[#FFC703] hover:underline">info@kranely.app</a>{' '}
            /{' '}
            <a href="mailto:admin@kranely.app" className="text-[#FFC703] hover:underline">admin@kranely.app</a>
          </p>

          <h2 className={h2}>Types of Data Collected</h2>
          <p className={p}>
            Among the Personal Data collected by this Application, either independently or through third parties, 
            there are: Tracking Tools; Usage Data.
          </p>
          <p className={p}>
            Complete details on each type of Personal Data collected are provided in the dedicated sections 
            of this privacy policy or through specific information texts displayed before 
            the Data collection.
          </p>
          <p className={p}>
            Personal Data may be freely provided by the User or, in the case of Usage Data, 
            collected automatically during the use of this Application.
          </p>

          <h2 className={h2}>Methods and Location of Data Processing</h2>
          <h3 className={h3}>Processing Methods</h3>
          <p className={p}>
            The Controller adopts appropriate security measures to prevent unauthorized access, disclosure, 
            modification or destruction of Personal Data.
          </p>
          <h3 className={h3}>Location</h3>
          <p className={p}>
            Data is processed at the Controller's operating locations and in any other place where the 
            parties involved in the processing are located. For further information, contact the Controller.
          </p>
          <h3 className={h3}>Retention Period</h3>
          <p className={p}>
            Unless otherwise indicated, Personal Data is processed and stored for the time required 
            for the purpose for which it was collected.
          </p>

          <h2 className={h2}>Cookie Policy</h2>
          <p className={p}>
            This Application uses Tracking Tools. To learn more, Users can consult the{' '}
            <Link to={createPageUrl('Cookie')} className="text-[#FFC703] hover:underline">Cookie Policy</Link>.
          </p>

          <h2 className={h2}>User Rights</h2>
          <p className={p}>
            Users may exercise certain rights with reference to the Data processed by the Controller, 
            including: withdraw consent, object to processing, access their Data, request correction, 
            obtain restriction of processing, request deletion of their Data, receive their Data 
            and file a complaint with the competent authority.
          </p>

          <h2 className={h2}>Changes to this Privacy Policy</h2>
          <p className={p}>
            The Data Controller reserves the right to make changes to this privacy policy 
            at any time, notifying Users on this page.
          </p>

          {/* Contact Footer */}
          <div className="mt-10 p-6 rounded-xl bg-[#FFC703]/5 border border-[#FFC703]/15 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFC703]/10 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-[#FFC703]" />
            </div>
            <div>
              <p className="font-semibold text-[#F0EBE8] text-sm mb-1">Contact the Controller</p>
              <p className="text-[#F0EBE8]/60 text-xs">
                For any request regarding the processing of your personal data:{' '}
                <a href="mailto:info@kranely.app" className="text-[#FFC703] hover:underline">info@kranely.app</a>
              </p>
            </div>
          </div>

          <p className="text-xs text-[#F0EBE8]/30 mt-8">Last modified: July 23, 2025 — Kranely ©</p>
        </div>
      </motion.section>
    </div>
  );
}