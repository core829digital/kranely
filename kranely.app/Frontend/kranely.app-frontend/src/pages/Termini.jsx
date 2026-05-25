import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Mail } from 'lucide-react';

const h2 = "text-xl font-semibold text-[#F0EBE8] mt-10 mb-3 pb-2 border-b border-white/8";
const h3 = "text-base font-semibold text-[#FFC703]/80 mt-6 mb-2";
const p  = "text-[#F0EBE8]/70 text-sm leading-relaxed mb-3";
const ul = "list-disc pl-6 text-[#F0EBE8]/70 text-sm mb-3 space-y-1";

export default function Termini() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Terms of Service</h1>
            <p className="text-[#F0EBE8]/50 text-sm">Last updated: July 2025 — Kranely Platform</p>
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
          
          <h2 className={h2}>1. Acceptance of Terms</h2>
          <p className={p}>
            By using the kranely.app website and the services offered by Kranely, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the site.
          </p>

          <h2 className={h2}>2. Description of Services</h2>
          <p className={p}>Kranely offers the following services:</p>
          <ul className={ul}>
            <li>B2B SaaS Platform for order and project management</li>
            <li>White-label capabilities for partners</li>
            <li>Invoicing, estimates, and supplier orchestration</li>
            <li>Online tools for estimating quotes and project calculation</li>
            <li>Appointment booking system</li>
          </ul>

          <h2 className={h2}>3. Online Quotes</h2>
          <h3 className={h3}>3.1 Indicative Nature</h3>
          <p className={p}>
            The quotes generated through our platform are to be considered <strong>strictly indicative</strong> and non-binding. Final prices may vary based on:
          </p>
          <ul className={ul}>
            <li>Technical inspection and assessment of the property or business structure</li>
            <li>Detailed technical specifications of the chosen materials</li>
            <li>Any structural or unforeseen works</li>
            <li>Variations in market prices of materials</li>
            <li>Installation complexity</li>
          </ul>

          <h3 className={h3}>3.2 Final Quote</h3>
          <p className={p}>
            The final and binding quote will only be provided after a free inspection and a detailed project evaluation by our technicians.
          </p>

          <h2 className={h2}>4. Appointment Booking</h2>
          <p className={p}>
            The online booking system is subject to availability. Appointment confirmation will be sent via email. In case you are unable to attend, we kindly ask you to cancel or modify the appointment at least 24 hours in advance.
          </p>

          <h2 className={h2}>5. Intellectual Property</h2>
          <p className={p}>
            All content on the site, including text, images, graphics, logos, and software, is the property of Kranely or its respective owners and is protected by copyright laws. Reproduction, distribution, or modification without written permission is prohibited.
          </p>

          <h2 className={h2}>6. Limitation of Liability</h2>
          <p className={p}>Kranely is not responsible for:</p>
          <ul className={ul}>
            <li>Damages resulting from the use of information on the site</li>
            <li>Site interruptions or malfunctions</li>
            <li>Differences between estimated online quotes and final quotes</li>
            <li>Content of linked third-party sites</li>
          </ul>

          <h2 className={h2}>7. User Obligations</h2>
          <p className={p}>The user agrees to:</p>
          <ul className={ul}>
            <li>Provide truthful and accurate information</li>
            <li>Not use the site for illegal or unauthorized purposes</li>
            <li>Not attempt to access restricted areas of the site</li>
            <li>Not interfere with the functioning of the site</li>
          </ul>

          <h2 className={h2}>8. Warranties</h2>
          <p className={p}>
            The services provided by Kranely are covered by the warranties required by law:
          </p>
          <ul className={ul}>
            <li><strong>Legal warranty:</strong> 2 years for conformity defects</li>
            <li><strong>Manufacturer warranty:</strong> varies based on the materials used</li>
            <li><strong>Construction warranty:</strong> according to current regulations</li>
          </ul>
          <p className={p}>
            Specific warranty conditions will be indicated in the supply contract.
          </p>

          <h2 className={h2}>9. Dispute Resolution</h2>
          <p className={p}>
            For any dispute relating to these Terms of Service, the parties agree to attempt an amicable resolution. In the event of no agreement, the competent court will be the court of the consumer's place of residence, if applicable, or the competent court under Italian law.
          </p>

          <h2 className={h2}>10. Changes to Terms</h2>
          <p className={p}>
            Kranely reserves the right to modify these Terms of Service at any time. Changes will be posted on this page and, if substantial, communicated to registered users. Continued use of the site after changes constitutes acceptance of the new terms.
          </p>

          <h2 className={h2}>11. Applicable Law</h2>
          <p className={p}>
            These Terms of Service are governed by Italian law. For matters not expressly provided for, the provisions of the Italian Civil Code and the Consumer Code apply.
          </p>

          {/* Contact Footer */}
          <div className="mt-10 p-6 rounded-xl bg-[#FFC703]/5 border border-[#FFC703]/15 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFC703]/10 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-[#FFC703]" />
            </div>
            <div>
              <p className="font-semibold text-[#F0EBE8] text-sm mb-1">Contact Us</p>
              <p className="text-[#F0EBE8]/60 text-xs">
                For questions regarding these terms:{' '}
                <a href="mailto:info@kranely.app" className="text-[#FFC703] hover:underline">info@kranely.app</a>
              </p>
            </div>
          </div>

          <p className="text-xs text-[#F0EBE8]/30 mt-8">Last modified: July 2025 — Kranely ©</p>
        </div>
      </motion.section>
    </div>
  );
}
