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
const ul = "list-disc pl-6 text-[#F0EBE8]/70 text-sm mb-3 space-y-1";

export default function Cookie() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Cookie Policy</h1>
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
          
          <h2 className={h2}>Cookies</h2>
          <p className={p}>
            This document informs Users about the technologies that help this Application to achieve the purposes described below. Such technologies allow the Owner to access and store information (for example by using a Cookie) or use resources (for example by running a script) on a User's device as they interact with this Application.
          </p>
          <p className={p}>
            For simplicity, all such technologies are defined as "Trackers" within this document – unless there is a reason to differentiate. For example, while Cookies can be used on both web and mobile browsers, it would be inaccurate to talk about Cookies in the context of mobile apps as they are a browser-based Tracker. For this reason, within this document, the term Cookies is only used where it is specifically meant to indicate that particular type of Tracker.
          </p>
          <p className={p}>
            Some of the purposes for which Trackers are used may also require the User's consent. Whenever consent is given, it can be freely withdrawn at any time following the instructions provided in this document.
          </p>
          <p className={p}>
            This Application uses Trackers managed directly by the Owner (so-called "first-party" Trackers) and Trackers that enable services provided by a third-party (so-called "third-party" Trackers). Unless otherwise specified within this document, third-party providers may access the Trackers managed by them.
          </p>
          <p className={p}>
            The validity and expiration periods of Cookies and other similar Trackers may vary depending on the lifetime set by the Owner or the relevant provider. Some of them expire upon termination of the User's browsing session.
          </p>
          <p className={p}>
            In addition to what's specified in the descriptions within each of the categories below, Users may find more precise and updated information regarding lifetime specification as well as any other relevant information — such as the presence of other Trackers — in the linked privacy policies of the respective third-party providers or by contacting the Owner.
          </p>

          <h2 className={h2}>Activities strictly necessary for the operation of this Application and delivery of the Service</h2>
          <p className={p}>
            This Application uses so-called "technical" Cookies and other similar Trackers to carry out activities that are strictly necessary for the operation or delivery of the Service.
          </p>

          <h2 className={h2}>Other activities involving the use of Trackers</h2>

          <h3 className={h3}>Experience</h3>
          <p className={p}>
            This Application uses Trackers to improve the quality of the user experience and enable interactions with external content, networks and platforms.
          </p>

          <h3 className={h3}>Interaction with external social networks and platforms</h3>
          <p className={p}>
            This type of service allows interaction with social networks or other external platforms directly from the pages of this Application. The interaction and information obtained through this Application are always subject to the User's privacy settings for each social network.
          </p>

          <h4 className={h4}>Google Fonts (Google LLC)</h4>
          <p className={p}>
            Google Fonts is a typeface visualization service provided by Google LLC that allows this Application to incorporate content of this kind on its pages.
          </p>
          
          <h3 className={h3}>Measurement</h3>
          <p className={p}>
            This Application uses Trackers to measure traffic and analyze User behavior with the goal of improving the Service.
          </p>

          <h4 className={h4}>Analytics</h4>
          <p className={p}>
            The services contained in this section enable the Owner to monitor and analyze web traffic and can be used to keep track of User behavior.
          </p>

          <h4 className={h4}>Google Analytics (Google LLC)</h4>
          <p className={p}>
            Google Analytics is a web analysis service provided by Google LLC ("Google"). Google utilizes the Data collected to track and examine the use of this Application.
          </p>

          <h2 className={h2}>How to manage preferences and provide or withdraw consent</h2>
          <p className={p}>
            There are various ways to manage Tracker related preferences and to provide and withdraw consent, where relevant:
          </p>
          <p className={p}>
            Users can manage preferences related to Trackers from directly within their own device settings, for example, by preventing the use or storage of Trackers.
          </p>
          <p className={p}>
            Additionally, whenever the use of Trackers is based on consent, Users can provide or withdraw such consent by setting their preferences within the cookie notice or by updating such preferences accordingly via the relevant consent-preferences widget, if available.
          </p>

          <h3 className={h3}>Locating Tracker Settings</h3>
          <p className={p}>
            Users can, for example, find information about how to manage Cookies in the most commonly used browsers at the following addresses:
          </p>
          <ul className={ul}>
            <li>Google Chrome</li>
            <li>Mozilla Firefox</li>
            <li>Apple Safari</li>
            <li>Microsoft Internet Explorer</li>
            <li>Microsoft Edge</li>
            <li>Brave</li>
            <li>Opera</li>
          </ul>

          <h2 className={h2}>Owner and Data Controller</h2>
          <p className={p}><strong className="text-[#F0EBE8]">Kranely</strong> — B2B SaaS Platform for order management.</p>
          <p className={p}>
            <strong className="text-[#F0EBE8]">Owner contact email:</strong>{' '}
            <a href="mailto:info@kranely.app" className="text-[#FFC703] hover:underline">info@kranely.app</a>
          </p>

          {/* Contact Footer */}
          <div className="mt-10 p-6 rounded-xl bg-[#FFC703]/5 border border-[#FFC703]/15 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFC703]/10 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-[#FFC703]" />
            </div>
            <div>
              <p className="font-semibold text-[#F0EBE8] text-sm mb-1">Contact the Owner</p>
              <p className="text-[#F0EBE8]/60 text-xs">
                For any request regarding the data treatment and tracker technologies:{' '}
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
