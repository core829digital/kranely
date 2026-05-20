import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Calculator, Calendar, ArrowRight } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';

export default function CTASection() {
  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-b from-[#495057] via-[#343a40] to-[#212529] overflow-hidden">
      {/* Animated Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [360, 180, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#e9ecef]/10 to-transparent rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">
            Inizia Oggi
          </span>
          <h2 className="text-4xl lg:text-5xl font-light text-[#f8f9fa] mt-4 mb-6">
            Ogni progetto è un mix di <br />
            <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] via-[#e9ecef] to-[#dee2e6]">creatività e praticità</span>
          </h2>
          <p className="text-[#dee2e6] max-w-2xl mx-auto">
            Utilizza i nostri strumenti per calcolare un preventivo stimato
            o prenota un appuntamento nel nostro showroom.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Calculator Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="group"
          >
            <Link to={createPageUrl('Calcolatore')}>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f8f9fa] via-[#e9ecef] to-[#dee2e6] p-8 lg:p-10 h-full border border-[#f8f9fa]/20 shadow-2xl hover:shadow-[0_30px_90px_rgba(248,249,250,0.4)] transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#212529]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 rounded-2xl bg-[#212529]/10 flex items-center justify-center mb-6 group-hover:bg-[#343a40] transition-colors"
                  >
                    <Calculator size={28} className="text-[#212529] group-hover:text-[#f8f9fa] transition-colors" />
                  </motion.div>
                  <h3 className="text-2xl font-medium text-[#212529] mb-3">
                    Calcola Preventivo
                  </h3>
                  <p className="text-[#495057] mb-6">
                    Ottieni una stima immediata per il tuo progetto di ristrutturazione o nuovi infissi.
                  </p>
                  <div className="flex items-center gap-2 text-[#212529] font-medium">
                    <span>Inizia ora</span>
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Appointment Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="group cursor-pointer"
            onClick={null} // Will be replaced by handleAppointmentClick logic in wrapper or here
          >
            {/* We need to rewrite the component to use hooks. Converting export default to allow hooks. */}
            <AppointmentCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AppointmentCard() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const handleAppointmentClick = () => {
    if (isSignedIn) {
      navigate('/MyAppointments');
    } else {
      openSignIn({ redirectUrl: '/MyAppointments' });
    }
  };

  return (
    <div onClick={handleAppointmentClick}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#343a40] to-[#495057] border border-[#f8f9fa]/20 p-8 lg:p-10 h-full shadow-2xl hover:shadow-[0_30px_90px_rgba(248,249,250,0.2)] transition-all duration-500">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f8f9fa]/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10">
          <motion.div
            whileHover={{ rotate: -360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-16 h-16 rounded-2xl bg-[#f8f9fa]/10 flex items-center justify-center mb-6 group-hover:bg-[#6c757d] transition-colors"
          >
            <Calendar size={28} className="text-[#f8f9fa]" />
          </motion.div>
          <h3 className="text-2xl font-medium text-[#f8f9fa] mb-3">
            Prenota Appuntamento
          </h3>
          <p className="text-[#dee2e6] mb-6">
            Visita il nostro showroom e parla con i nostri esperti per il tuo progetto.
          </p>
          <div className="flex items-center gap-2 text-[#f8f9fa] font-medium">
            <span>Prenota</span>
            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}